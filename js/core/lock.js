// Play lock: a grown-up locks the app for play. While locked she can only reach the home screen, the worlds,
// the games and her stickers: no Grown-ups corner, Print & Color, worksheets or Sound Check, and the browser's
// back button / swipe can't leave the app. A grown-up PIN (held for a moment on the little lock) unlocks it.
// This guards against wandering inside the app and accidental taps; for a hard lock on the whole phone, also use
// the phone's own Guided Access (iPhone) or Screen Pinning (Android).
import { el } from './util.js';
import { store } from './store.js';

const PIN_LEN = 4;
const ROUNDS = 100_000;
const MAX_TRIES = 3;
const COOLDOWN_MS = 60_000;
/** The only screens she can reach while locked. */
const ALLOWED = ['', 'world', 'play', 'stickers'];

const enc = new TextEncoder();
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
const unhex = (s) => new Uint8Array((s.match(/../g) || []).map((h) => parseInt(h, 16)));

async function hashPin(pin, saltHex) {
  const key = await crypto.subtle.importKey('raw', enc.encode(pin), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: unhex(saltHex), iterations: ROUNDS }, key, 256));
}

export const hasPin = () => !!store.get().pinHash;
export const isLocked = () => !!store.get().locked && hasPin();
export const screenAllowed = (page) => !isLocked() || ALLOWED.includes(page || '');

async function setPin(pin) {
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  store.set({ pinSalt: salt, pinHash: await hashPin(pin, salt), pinFails: 0, pinWaitUntil: 0 });
}

/** null when the PIN is right, otherwise a message to show. Three wrong tries in a row pause the pad for a minute. */
async function checkPin(pin) {
  const s = store.get();
  const wait = (s.pinWaitUntil || 0) - Date.now();
  if (wait > 0) return `Too many tries. Wait ${Math.ceil(wait / 1000)} seconds.`;
  if (s.pinHash && await hashPin(pin, s.pinSalt) === s.pinHash) { store.set({ pinFails: 0, pinWaitUntil: 0 }); return null; }
  const fails = (s.pinFails || 0) + 1;
  if (fails >= MAX_TRIES) { store.set({ pinFails: 0, pinWaitUntil: Date.now() + COOLDOWN_MS }); return 'Not right. Wait a minute and try again.'; }
  store.set({ pinFails: fails });
  return `Not right. ${MAX_TRIES - fails} ${MAX_TRIES - fails === 1 ? 'try' : 'tries'} left.`;
}

/** A number pad in a dialog. Resolves with the digits, or null if cancelled. `check(pin)` may return an error message to keep it open. */
function askPin(title, { note = '', check } = {}) {
  return new Promise((resolve) => {
    let digits = '';
    let busy = false;
    const dots = el('div', { class: 'pin-dots', 'aria-live': 'polite' });
    const msg = el('p', { class: 'pin-msg', role: 'status' }, note);
    const draw = () => { dots.textContent = '●'.repeat(digits.length) + '○'.repeat(PIN_LEN - digits.length); dots.setAttribute('aria-label', `${digits.length} of ${PIN_LEN} numbers`); };
    const press = async (d) => {
      if (busy || digits.length >= PIN_LEN) return;
      digits += d; draw();
      if (digits.length < PIN_LEN) return;
      busy = true;
      const err = check ? await check(digits) : null;
      busy = false;
      if (err) { msg.textContent = err; msg.classList.add('bad'); digits = ''; draw(); return; }
      dlg.close(digits);
    };
    const key = (label, onclick, cls = '') => el('button', { type: 'button', class: `pin-key ${cls}`, onclick }, label);
    const pad = el('div', { class: 'pin-pad' },
      ...'123456789'.split('').map((d) => key(d, () => press(d))),
      key('✕', () => dlg.close(''), 'alt'), key('0', () => press('0')), key('⌫', () => { if (!busy) { digits = digits.slice(0, -1); draw(); } }, 'alt'));
    const dlg = el('dialog', { class: 'settings pin-dialog', 'aria-label': title }, el('h2', {}, title), dots, msg, pad);
    dlg.addEventListener('keydown', (e) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace' && !busy) { digits = digits.slice(0, -1); draw(); }
    });
    dlg.addEventListener('close', () => { const v = dlg.returnValue || null; dlg.remove(); resolve(v); });
    draw();
    document.body.append(dlg);
    dlg.showModal();
  });
}

/** Ask for a new PIN twice. Resolves with it, or null if cancelled. */
async function chooseNewPin() {
  for (;;) {
    const a = await askPin(`Choose a ${PIN_LEN}-number PIN`, { note: 'Only grown-ups should know it.' });
    if (!a) return null;
    const b = await askPin('Type it again');
    if (!b) return null;
    if (a === b) return a;
    await new Promise((r) => setTimeout(r, 0));
    alert('Those two did not match. Let’s try again.');
  }
}

/** Grown-ups corner: Lock the app (choosing a PIN first time). Resolves true when locked. */
export async function startLock() {
  if (!hasPin()) {
    const pin = await chooseNewPin();
    if (!pin) return false;
    await setPin(pin);
  }
  store.set({ locked: true });
  apply();
  document.documentElement.requestFullscreen?.().catch(() => {}); // Android Chrome: hides the browser bars
  return true;
}

export async function changePin() {
  const ok = await askPin('Enter your current PIN', { check: checkPin });
  if (!ok) return false;
  const pin = await chooseNewPin();
  if (!pin) return false;
  await setPin(pin);
  return true;
}

async function unlockFlow(onUnlocked) {
  if (!await askPin('Grown-ups: enter the PIN', { check: checkPin })) return;
  store.set({ locked: false });
  apply();
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  onUnlocked?.();
}

/* ---- while locked ---- */
let onUnlocked = null;
let badge = null;

const keepIn = () => { history.pushState(null, '', location.href); }; // back / swipe-back stays in the app
const warnLeave = (e) => { e.preventDefault(); e.returnValue = ''; };

function makeBadge() {
  let timer;
  const b = el('button', { class: 'lock-badge', type: 'button', 'aria-label': 'Locked. Grown-ups: press and hold to unlock.' }, '🔒');
  const start = (e) => { e.preventDefault(); b.classList.add('holding'); timer = setTimeout(() => { b.classList.remove('holding'); unlockFlow(onUnlocked); }, 1200); };
  const stop = () => { b.classList.remove('holding'); clearTimeout(timer); };
  b.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => b.addEventListener(ev, stop));
  b.addEventListener('contextmenu', (e) => e.preventDefault());
  return b;
}

/** Make the page match the saved lock state. */
function apply() {
  const locked = isLocked();
  document.body.classList.toggle('locked', locked);
  window.removeEventListener('popstate', keepIn);
  window.removeEventListener('beforeunload', warnLeave);
  badge?.remove(); badge = null;
  if (!locked) return;
  keepIn();
  window.addEventListener('popstate', keepIn);
  window.addEventListener('beforeunload', warnLeave);
  badge = makeBadge();
  document.body.append(badge);
}

/** Call once at start-up. `afterUnlock` runs when a grown-up unlocks (to refresh the screen). */
export function installLock(afterUnlock) {
  onUnlocked = afterUnlock;
  if (store.get().locked && !hasPin()) store.set({ locked: false }); // never trap her without a way out
  apply();
}
