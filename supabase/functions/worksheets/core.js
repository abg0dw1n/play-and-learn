// Worksheets API (parents only). Plain JavaScript on web-standard Request/Response, so the same code runs
// in the Supabase edge function (index.ts) and in the Node tests (tests/worksheets-core.test.mjs).
// All storage and database access goes through the `db` and `storage` objects passed in.

const MIN_PASSCODE = 6;
const MAX_FAILS = 8;               // wrong passcodes in a row before a lock-out
const LOCK_MS = 15 * 60 * 1000;
const TOKEN_DAYS = 30;
const MAX_PAGES = 20;
const MAX_IMAGE = 8 * 1024 * 1024;
const MAX_PDF = 16 * 1024 * 1024;
const SIGNED_SECONDS = 60 * 60;
const PBKDF2_ROUNDS = 100_000;

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const unhex = (s) => new Uint8Array((s.match(/../g) || []).map((h) => parseInt(h, 16)));
const randomHex = (n) => hex(crypto.getRandomValues(new Uint8Array(n)));
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function same(a, b) { // constant-time string compare
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hashPasscode(passcode, saltHex) {
  const key = await crypto.subtle.importKey('raw', enc.encode(passcode), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(saltHex), iterations: PBKDF2_ROUNDS }, key, 256);
  return hex(bits);
}

async function sign(secretHex, message) {
  const key = await crypto.subtle.importKey('raw', unhex(secretHex), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode(message)));
}

/** What kind of file this really is, from its first bytes (the browser's label isn't trusted). */
export function sniff(bytes) {
  const b = bytes;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { kind: 'image', type: 'image/jpeg', ext: 'jpg' };
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { kind: 'image', type: 'image/png', ext: 'png' };
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) {
    return { kind: 'image', type: 'image/webp', ext: 'webp' };
  }
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return { kind: 'pdf', type: 'application/pdf', ext: 'pdf' };
  return null;
}

export function createHandler({ db, storage, allowedOrigins = [], now = () => Date.now() }) {
  const corsFor = (req) => {
    const origin = req.headers.get('origin');
    const ok = origin && allowedOrigins.includes(origin);
    return ok ? {
      'access-control-allow-origin': origin,
      'access-control-allow-headers': 'content-type, x-parent-token',
      'access-control-allow-methods': 'POST, GET, OPTIONS',
      vary: 'origin',
    } : {};
  };
  const reply = (req, status, body) => new Response(JSON.stringify(body), {
    status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store', ...corsFor(req) },
  });
  const fail = (req, status, error) => reply(req, status, { error });

  async function makeToken() {
    const exp = Math.floor(now() / 1000) + TOKEN_DAYS * 86400;
    const secret = await db.getSetting('token_secret');
    return `v1.${exp}.${await sign(secret, `v1.${exp}`)}`;
  }

  async function tokenOk(token) {
    const parts = String(token || '').split('.');
    if (parts.length !== 3 || parts[0] !== 'v1' || !/^\d+$/.test(parts[1]) || !/^[0-9a-f]{64}$/.test(parts[2])) return false;
    if (Number(parts[1]) < Math.floor(now() / 1000)) return false;
    const secret = await db.getSetting('token_secret');
    if (!secret) return false;
    return same(parts[2], await sign(secret, `v1.${parts[1]}`));
  }

  /** Check a passcode with the lock-out rule. Returns null when right, otherwise an error response. */
  async function checkPasscode(req, passcode) {
    const lockUntil = Number(await db.getSetting('lock_until') || 0);
    if (lockUntil > now()) return fail(req, 429, 'Too many tries. Please wait a few minutes and try again.');
    const salt = await db.getSetting('pass_salt');
    const want = await db.getSetting('pass_hash');
    const good = salt && want && typeof passcode === 'string' && same(await hashPasscode(passcode, salt), want);
    if (good) {
      await db.setSetting('fail_count', '0');
      return null;
    }
    const fails = Number(await db.getSetting('fail_count') || 0) + 1;
    await db.setSetting('fail_count', String(fails >= MAX_FAILS ? 0 : fails));
    if (fails >= MAX_FAILS) await db.setSetting('lock_until', String(now() + LOCK_MS));
    return fail(req, 401, 'That passcode is not right.');
  }

  async function setPasscode(passcode) {
    const salt = randomHex(16);
    await db.setSetting('pass_salt', salt);
    await db.setSetting('pass_hash', await hashPasscode(passcode, salt));
    await db.setSetting('fail_count', '0');
    // A new secret signs the sign-in tokens, so changing the passcode signs out every other device.
    await db.setSetting('token_secret', randomHex(32));
  }

  const validPasscode = (p) => typeof p === 'string' && p.length >= MIN_PASSCODE && p.length <= 100;

  async function withUrls(pages) {
    const urls = pages.length ? await storage.signedUrls(pages.map((p) => p.path), SIGNED_SECONDS) : {};
    return pages.map((p) => ({ id: p.id, position: p.position, kind: p.kind, text: p.text, url: urls[p.path] || null }));
  }

  const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);

  async function handle(req) {
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsFor(req) });
    if (req.method === 'GET') return reply(req, 200, { ok: true, hasPasscode: !!(await db.getSetting('pass_hash')) });
    if (req.method !== 'POST') return fail(req, 405, 'Not allowed.');

    const type = req.headers.get('content-type') || '';
    let input = {};
    let file = null;
    if (type.includes('multipart/form-data')) {
      const form = await req.formData();
      for (const [k, v] of form.entries()) {
        if (typeof v === 'string') input[k] = v; else if (k === 'file') file = v;
      }
    } else {
      try { input = await req.json(); } catch { return fail(req, 400, 'Bad request.'); }
    }
    const action = input.action;

    // ---- no sign-in needed
    if (action === 'status') return reply(req, 200, { ok: true, hasPasscode: !!(await db.getSetting('pass_hash')) });
    if (action === 'setup') {
      if (await db.getSetting('pass_hash')) return fail(req, 409, 'A passcode is already set.');
      if (!validPasscode(input.passcode)) return fail(req, 400, `Use at least ${MIN_PASSCODE} letters or numbers.`);
      await setPasscode(input.passcode);
      return reply(req, 200, { ok: true, token: await makeToken() });
    }
    if (action === 'login') {
      const bad = await checkPasscode(req, input.passcode);
      return bad || reply(req, 200, { ok: true, token: await makeToken() });
    }

    // ---- everything below needs a valid sign-in
    if (!(await tokenOk(req.headers.get('x-parent-token')))) return fail(req, 401, 'Please sign in again.');

    if (action === 'changePasscode') {
      const bad = await checkPasscode(req, input.current);
      if (bad) return bad;
      if (!validPasscode(input.next)) return fail(req, 400, `Use at least ${MIN_PASSCODE} letters or numbers.`);
      await setPasscode(input.next);
      return reply(req, 200, { ok: true, token: await makeToken() });
    }

    if (action === 'list') {
      const sheets = await db.listWorksheets();
      const pages = await db.listPages(sheets.map((s) => s.id));
      const firstOf = new Map();
      const countOf = new Map();
      for (const p of pages) {
        countOf.set(p.worksheet_id, (countOf.get(p.worksheet_id) || 0) + 1);
        if (!firstOf.has(p.worksheet_id) || p.position < firstOf.get(p.worksheet_id).position) firstOf.set(p.worksheet_id, p);
      }
      const covers = await withUrls([...firstOf.values()]);
      const coverById = new Map([...firstOf.keys()].map((id, i) => [id, covers[i]]));
      return reply(req, 200, {
        ok: true,
        worksheets: sheets.map((s) => ({ ...s, pageCount: countOf.get(s.id) || 0, cover: coverById.get(s.id) || null })),
      });
    }

    if (action === 'create') {
      const sheet = await db.createWorksheet({ title: clean(input.title, 120) });
      return reply(req, 200, { ok: true, worksheet: sheet });
    }

    // the rest work on one worksheet
    const id = String(input.id ?? input.worksheetId ?? '');
    if (action !== 'deletePage' && !UUID.test(id)) return fail(req, 400, 'Bad worksheet.');

    if (action === 'get') {
      const sheet = await db.getWorksheet(id);
      if (!sheet) return fail(req, 404, 'Not found.');
      return reply(req, 200, { ok: true, worksheet: sheet, pages: await withUrls(await db.listPages([id])) });
    }

    if (action === 'update') {
      const sheet = await db.getWorksheet(id);
      if (!sheet) return fail(req, 404, 'Not found.');
      const fields = {};
      if (input.title !== undefined) fields.title = clean(input.title, 120);
      if (input.notes !== undefined) fields.notes = String(input.notes).slice(0, 20000);
      return reply(req, 200, { ok: true, worksheet: await db.updateWorksheet(id, fields) });
    }

    if (action === 'addPage') {
      const sheet = await db.getWorksheet(id);
      if (!sheet) return fail(req, 404, 'Not found.');
      if (!file || typeof file.arrayBuffer !== 'function') return fail(req, 400, 'No file.');
      const bytes = new Uint8Array(await file.arrayBuffer());
      const info = sniff(bytes);
      if (!info) return fail(req, 415, 'Please use a photo (JPEG, PNG, WebP) or a PDF.');
      if (bytes.length > (info.kind === 'pdf' ? MAX_PDF : MAX_IMAGE)) return fail(req, 413, 'That file is too big.');
      const existing = await db.listPages([id]);
      if (existing.length >= MAX_PAGES) return fail(req, 400, `A worksheet can have up to ${MAX_PAGES} pages.`);
      const position = existing.reduce((m, p) => Math.max(m, p.position), -1) + 1;
      const path = `${id}/${String(position).padStart(3, '0')}-${randomHex(6)}.${info.ext}`;
      await storage.upload(path, bytes, info.type);
      const page = await db.addPage({ worksheet_id: id, position, path, kind: info.kind });
      await db.touchWorksheet(id);
      return reply(req, 200, { ok: true, page: (await withUrls([page]))[0] });
    }

    if (action === 'deletePage') {
      const pageId = String(input.pageId ?? '');
      if (!UUID.test(pageId)) return fail(req, 400, 'Bad page.');
      const page = await db.getPage(pageId);
      if (!page) return fail(req, 404, 'Not found.');
      await storage.remove([page.path]);
      await db.deletePage(pageId);
      await db.touchWorksheet(page.worksheet_id);
      return reply(req, 200, { ok: true });
    }

    if (action === 'delete') {
      const sheet = await db.getWorksheet(id);
      if (!sheet) return fail(req, 404, 'Not found.');
      const pages = await db.listPages([id]);
      if (pages.length) await storage.remove(pages.map((p) => p.path));
      await db.deleteWorksheet(id);
      return reply(req, 200, { ok: true });
    }

    return fail(req, 400, 'Unknown request.');
  }

  return async (req) => {
    try { return await handle(req); } catch (e) { console.error('worksheets error', e); return fail(req, 500, 'Something went wrong.'); }
  };
}
