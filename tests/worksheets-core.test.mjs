// Run: node tests/worksheets-core.test.mjs   (no installs needed; uses Node's built-in fetch/crypto)
import { createHandler, sniff } from '../supabase/functions/worksheets/core.js';

let clock = 1_800_000_000_000;
const rows = { settings: new Map(), worksheets: new Map(), pages: new Map() };
const files = new Map();
let nextId = 1;
const uuid = () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`;
const db = {
  async getSetting(k) { return rows.settings.get(k) ?? null; },
  async setSetting(k, v) { rows.settings.set(k, v); },
  async listWorksheets() { return [...rows.worksheets.values()].reverse(); },
  async getWorksheet(id) { return rows.worksheets.get(id) ?? null; },
  async createWorksheet({ title }) { const w = { id: uuid(), title, notes: '', created_at: 'x', updated_at: 'x' }; rows.worksheets.set(w.id, w); return w; },
  async updateWorksheet(id, f) { const w = { ...rows.worksheets.get(id), ...f }; rows.worksheets.set(id, w); return w; },
  async touchWorksheet() {},
  async deleteWorksheet(id) { rows.worksheets.delete(id); for (const [k, p] of rows.pages) if (p.worksheet_id === id) rows.pages.delete(k); },
  async listPages(ids) { return [...rows.pages.values()].filter((p) => ids.includes(p.worksheet_id)).sort((a, b) => a.position - b.position); },
  async getPage(id) { return rows.pages.get(id) ?? null; },
  async addPage(r) { const p = { id: uuid(), text: '', ...r }; rows.pages.set(p.id, p); return p; },
  async deletePage(id) { rows.pages.delete(id); },
};
const storage = {
  async upload(path, bytes, type) { files.set(path, { bytes, type }); },
  async signedUrls(paths) { return Object.fromEntries(paths.map((p) => [p, `https://signed.example/${p}?t=1`])); },
  async remove(paths) { paths.forEach((p) => files.delete(p)); },
};
const handler = createHandler({ db, storage, allowedOrigins: ['https://site.example'], now: () => clock });

let problems = 0;
const ok = (c, m) => { if (!c) { problems++; console.log('  FAIL -', m); } else console.log('  ok -', m); };
const call = async (body, token, extraHeaders = {}) => {
  const res = await handler(new Request('https://fn.example/worksheets', {
    method: 'POST', headers: { 'content-type': 'application/json', ...(token ? { 'x-parent-token': token } : {}), ...extraHeaders }, body: JSON.stringify(body),
  }));
  return { status: res.status, json: await res.json(), headers: res.headers };
};
const upload = async (id, bytes, token, name = 'p.jpg') => {
  const form = new FormData();
  form.set('action', 'addPage'); form.set('worksheetId', id); form.set('file', new File([bytes], name));
  const res = await handler(new Request('https://fn.example/worksheets', { method: 'POST', headers: { 'x-parent-token': token }, body: form }));
  return { status: res.status, json: await res.json() };
};
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3, 4, 5, 6, 7, 8]);
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]);
const PDF = new TextEncoder().encode('%PDF-1.4 hello');
const WEBP = new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ');

console.log('sign-in');
let r = await call({ action: 'status' });
ok(r.status === 200 && r.json.hasPasscode === false, 'status: no passcode yet');
r = await call({ action: 'list' });
ok(r.status === 401, 'list needs sign-in');
r = await call({ action: 'setup', passcode: 'abc' });
ok(r.status === 400, 'short passcode refused');
r = await call({ action: 'setup', passcode: 'sunny-day-1' });
ok(r.status === 200 && r.json.token?.startsWith('v1.'), 'setup returns a token');
const token = r.json.token;
r = await call({ action: 'setup', passcode: 'another-one' });
ok(r.status === 409, 'second setup refused');
ok(!JSON.stringify([...rows.settings.values()]).includes('sunny-day-1'), 'passcode itself is never stored');
r = await call({ action: 'list' }, token);
ok(r.status === 200 && r.json.worksheets.length === 0, 'token works');
ok((await call({ action: 'list' }, token.slice(0, -1) + (token.endsWith('0') ? '1' : '0'))).status === 401, 'tampered token refused');
ok((await call({ action: 'list' }, 'v1.9999999999.' + '0'.repeat(64))).status === 401, 'forged token refused');
clock += 31 * 86400 * 1000;
ok((await call({ action: 'list' }, token)).status === 401, 'token expires after 30 days');
r = await call({ action: 'login', passcode: 'sunny-day-1' });
ok(r.status === 200, 'login with the right passcode');
const t1 = r.json.token;

console.log('lock-out');
for (let i = 0; i < 7; i++) await call({ action: 'login', passcode: 'wrong' + i });
r = await call({ action: 'login', passcode: 'wrong-last' });
ok(r.status === 401, '8th wrong try still says wrong');
r = await call({ action: 'login', passcode: 'sunny-day-1' });
ok(r.status === 429, 'locked even for the right passcode');
clock += 16 * 60 * 1000;
r = await call({ action: 'login', passcode: 'sunny-day-1' });
ok(r.status === 200, 'unlocks after 15 minutes');
const t2 = r.json.token;

console.log('worksheets');
r = await call({ action: 'create', title: '  Letter\u0007 sounds  ' }, t2);
ok(r.status === 200 && r.json.worksheet.title === 'Letter  sounds', 'create cleans the title');
const id = r.json.worksheet.id;
r = await upload(id, JPEG, t2);
ok(r.status === 200 && r.json.page.kind === 'image' && r.json.page.position === 0, 'upload a JPEG');
ok([...files.keys()][0].startsWith(id + '/000-') && [...files.keys()][0].endsWith('.jpg'), 'stored under the worksheet folder');
r = await upload(id, PNG, t2); ok(r.status === 200 && r.json.page.position === 1, 'upload a PNG (page 2)');
r = await upload(id, WEBP, t2); ok(r.status === 200, 'upload a WebP');
r = await upload(id, PDF, t2); ok(r.status === 200 && r.json.page.kind === 'pdf', 'upload a PDF');
r = await upload(id, new TextEncoder().encode('<html>not a photo</html>'), t2, 'evil.jpg');
ok(r.status === 415, 'a file that only claims to be a photo is refused');
r = await upload(id, JPEG, 'nope'); ok(r.status === 401, 'upload needs sign-in');
r = await upload('not-a-uuid', JPEG, t2); ok(r.status === 400, 'bad worksheet id refused');
r = await upload(uuid(), JPEG, t2); ok(r.status === 404, 'unknown worksheet refused');
const big = new Uint8Array(8 * 1024 * 1024 + 1); big.set(JPEG);
r = await upload(id, big, t2); ok(r.status === 413, 'oversized photo refused');
r = await call({ action: 'list' }, t2);
ok(r.json.worksheets[0].pageCount === 4 && r.json.worksheets[0].cover?.url?.startsWith('https://signed.example/'), 'list shows page count and a cover link');
r = await call({ action: 'get', id }, t2);
ok(r.json.pages.length === 4 && r.json.pages.map((p) => p.position).join() === '0,1,2,3' && r.json.pages.every((p) => p.url), 'get returns ordered pages with links');
const pageId = r.json.pages[1].id;
r = await call({ action: 'update', id, title: 'Rhymes', notes: 'cat / hat' }, t2);
ok(r.json.worksheet.title === 'Rhymes' && r.json.worksheet.notes === 'cat / hat', 'rename and add notes');
const before = files.size;
r = await call({ action: 'deletePage', pageId }, t2);
ok(r.status === 200 && files.size === before - 1, 'delete one page removes its file');
for (let i = 0; i < 17; i++) await upload(id, JPEG, t2);
r = await upload(id, JPEG, t2); ok(r.status === 400, 'page limit (20) enforced');
r = await call({ action: 'delete', id }, t2);
ok(r.status === 200 && files.size === 0 && rows.worksheets.size === 0 && rows.pages.size === 0, 'delete removes the worksheet, pages and every file');
r = await call({ action: 'get', id }, t2); ok(r.status === 404, 'deleted worksheet is gone');

console.log('passcode change');
r = await call({ action: 'changePasscode', current: 'bad', next: 'brand-new-pass' }, t2); ok(r.status === 401, 'needs the current passcode');
r = await call({ action: 'changePasscode', current: 'sunny-day-1', next: 'brand-new-pass' }, t2);
ok(r.status === 200, 'passcode changed');
ok((await call({ action: 'list' }, t2)).status === 401, 'old sign-ins stop working');
ok((await call({ action: 'list' }, r.json.token)).status === 200, 'the new sign-in works');
ok((await call({ action: 'login', passcode: 'sunny-day-1' })).status === 401, 'old passcode no longer works');

console.log('web rules');
let res = await handler(new Request('https://fn.example/worksheets', { method: 'OPTIONS', headers: { origin: 'https://site.example' } }));
ok(res.status === 204 && res.headers.get('access-control-allow-origin') === 'https://site.example', 'allowed site gets CORS');
res = await handler(new Request('https://fn.example/worksheets', { method: 'OPTIONS', headers: { origin: 'https://evil.example' } }));
ok(!res.headers.get('access-control-allow-origin'), 'other sites get no CORS');
res = await handler(new Request('https://fn.example/worksheets', { method: 'DELETE' }));
ok(res.status === 405, 'odd methods refused');
res = await handler(new Request('https://fn.example/worksheets', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{oops' }));
ok(res.status === 400, 'bad JSON is a 400, not a crash');
ok(sniff(new Uint8Array(12)) === null, 'zero bytes are not a file');

console.log(problems ? `\n${problems} PROBLEM(S)` : '\nALL WORKSHEET API CHECKS PASSED');
process.exit(problems ? 1 : 0);
