// Talks to the worksheet service and gets photos ready to upload.
import { WORKSHEETS_API } from '../config.js';

const KEY = 'playlearn:ws-token';
export const token = {
  get() { try { return localStorage.getItem(KEY); } catch { return null; } },
  set(v) { try { localStorage.setItem(KEY, v); } catch { /* private mode: they'll sign in again next time */ } },
  clear() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } },
};

export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.status = status; }
}

async function send(body, { signedIn = true } = {}) {
  const isForm = body instanceof FormData;
  const headers = {};
  if (!isForm) headers['content-type'] = 'application/json';
  const t = token.get();
  if (signedIn && t) headers['x-parent-token'] = t;
  let res;
  try {
    res = await fetch(WORKSHEETS_API, { method: 'POST', headers, body: isForm ? body : JSON.stringify(body) });
  } catch {
    throw new ApiError("Can't reach the server. Check the internet connection and try again.");
  }
  let json = {};
  try { json = await res.json(); } catch { /* not JSON */ }
  if (!res.ok) {
    if (res.status === 401 && signedIn) token.clear();
    throw new ApiError(json.error || 'Something went wrong. Please try again.', res.status);
  }
  return json;
}

export const api = {
  async status() { return (await send({ action: 'status' }, { signedIn: false })).hasPasscode; },
  async setup(passcode) { const r = await send({ action: 'setup', passcode }, { signedIn: false }); token.set(r.token); },
  async login(passcode) { const r = await send({ action: 'login', passcode }, { signedIn: false }); token.set(r.token); },
  async changePasscode(current, next) { const r = await send({ action: 'changePasscode', current, next }); token.set(r.token); },
  async list() { return (await send({ action: 'list' })).worksheets; },
  async get(id) { const r = await send({ action: 'get', id }); return { worksheet: r.worksheet, pages: r.pages }; },
  async create(title) { return (await send({ action: 'create', title })).worksheet; },
  async update(id, fields) { return (await send({ action: 'update', id, ...fields })).worksheet; },
  async remove(id) { await send({ action: 'delete', id }); },
  async removePage(pageId) { await send({ action: 'deletePage', pageId }); },
  async addPage(id, blob, name) {
    const form = new FormData();
    form.set('action', 'addPage');
    form.set('worksheetId', id);
    form.set('file', blob, name);
    return (await send(form)).page;
  },
};

const MAX_SIDE = 2200;  // plenty to read handwriting; keeps each page well under 1 MB

/** Make a phone photo small enough to upload quickly (PDFs go up as they are). */
export async function prepareFile(file) {
  const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
  if (isPdf) {
    if (file.size > 16 * 1024 * 1024) throw new ApiError('That PDF is too big (limit 16 MB).');
    return { blob: file, name: file.name || 'scan.pdf' };
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    try { bitmap = await viaImageElement(file); } catch {
      throw new ApiError("Couldn't read that photo. Try taking it again, or choose a JPEG or PNG.");
    }
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; // PNG scans with see-through backgrounds
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
  if (!blob) throw new ApiError("Couldn't prepare that photo. Please try another.");
  return { blob, name: 'page.jpg' };
}

function viaImageElement(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('decode')); };
    img.src = url;
  });
}
