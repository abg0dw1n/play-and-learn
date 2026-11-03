// Spoken prompts using the browser's built-in voice (free, works offline on most tablets).
import { el } from './util.js';
import { store } from './store.js';

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
const PREFERRED = ['Samantha', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Ava', 'Allison', 'Karen'];
let voice = null;

/** English voices installed on this device (for the Grown-ups voice picker). */
export function englishVoices() {
  if (!supported) return [];
  return speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('en'));
}

/** Use a specific voice by name ('' = automatic). Saved on this device. */
export function setVoice(name) {
  store.set({ voiceName: name || '' });
  voice = chooseVoice();
}

export function currentVoiceName() { return voice?.name || ''; }

/** Run fn now and again whenever the device finishes loading its voices.
    Returns a function that stops listening. */
export function onVoicesReady(fn) {
  if (!supported) return () => {};
  fn();
  speechSynthesis.addEventListener?.('voiceschanged', fn);
  return () => speechSynthesis.removeEventListener?.('voiceschanged', fn);
}

function chooseVoice() {
  const voices = speechSynthesis.getVoices();
  const picked = store.get().voiceName;
  if (picked) {
    const v = voices.find((x) => x.name === picked);
    if (v) return v;
  }
  for (const name of PREFERRED) {
    const v = voices.find((x) => x.name.includes(name));
    if (v) return v;
  }
  return voices.find((v) => v.lang?.startsWith('en-US')) || voices.find((v) => v.lang?.startsWith('en')) || null;
}

if (supported) {
  voice = chooseVoice();
  speechSynthesis.addEventListener?.('voiceschanged', () => { voice = chooseVoice(); });
}

/* Phones only let a page start speech and sound during a tap. Our questions are spoken just
   after a tap (once the next screen is drawn), which iPhones block until the page has spoken
   once inside a real tap. So on every tap until that works, quietly "speak" a silent word and
   wake the sound-effects engine. */
let speechUnlocked = false;
let lastTap = 0;
const unlockHooks = [];
/** Let other modules (sound effects) run their own unlock inside the same tap. */
export function onFirstTap(fn) { unlockHooks.push(fn); }
function unlockOnTap() {
  // One tap fires both touchend and click; only act once per tap.
  const now = Date.now();
  if (now - lastTap < 400) return;
  lastTap = now;
  unlockHooks.forEach((fn) => { try { fn(); } catch { /* ignore */ } });
  if (!supported || speechUnlocked) return;
  if (!voice) voice = chooseVoice();
  const u = new SpeechSynthesisUtterance('.');
  u.volume = 0;
  if (voice) u.voice = voice;
  u.onstart = u.onend = () => { speechUnlocked = true; };
  // "not-allowed" means the phone still wants a tap; any other result means speech is usable.
  u.onerror = (e) => { if (e.error !== 'not-allowed') speechUnlocked = true; };
  speechSynthesis.speak(u);
}
for (const ev of ['touchend', 'click', 'keydown']) {
  window.addEventListener(ev, unlockOnTap, { capture: true, passive: true });
}

let activeUtterance = null; // keep a reference: some phones drop the "finished" event otherwise

/** Speak text; resolves when finished (or after a safety timeout). */
export function speak(text, { rate = 0.88, pitch = 1.1, force = false } = {}) {
  return new Promise((resolve) => {
    if (!supported || (!force && !store.get().sound) || !text) return resolve();
    if (!voice) voice = chooseVoice(); // phones often load voices late and never announce it
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'en-US';
    u.rate = rate;
    u.pitch = pitch;
    const done = () => { clearTimeout(t); if (activeUtterance === u) activeUtterance = null; resolve(); };
    u.onend = done;
    u.onerror = done;
    const t = setTimeout(done, 1500 + text.length * 90);
    activeUtterance = u;
    // Only stop speech if something is actually playing: on iPhones and some Androids a new
    // line started right after a stop gets dropped, so then we wait a moment before speaking.
    const busy = speechSynthesis.speaking || speechSynthesis.pending;
    if (busy) speechSynthesis.cancel();
    speechSynthesis.resume?.(); // Android Chrome can get stuck "paused" after the app was in the background
    if (busy) setTimeout(() => activeUtterance === u && speechSynthesis.speak(u), 80);
    else speechSynthesis.speak(u);
  });
}

export function hush() {
  activeUtterance = null;
  if (supported && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
}

/** A small bell button that turns voice + sound effects on/off.
    (A bell, so it can't be mistaken for the 🔊 "say it again" button.) */
export function soundToggle() {
  const on = () => store.get().sound;
  const label = (v) => (v ? 'Sounds on' : 'Sounds off');
  const btn = el('button', { class: 'sound-btn', 'aria-label': label(on()), 'aria-pressed': String(on()) }, on() ? '🔔' : '🔕');
  btn.addEventListener('click', () => {
    const next = !on();
    store.set({ sound: next });
    btn.textContent = next ? '🔔' : '🔕';
    btn.setAttribute('aria-label', label(next));
    btn.setAttribute('aria-pressed', String(next));
    btn.classList.toggle('off', !next);
    if (!next) hush();
  });
  if (!on()) btn.classList.add('off');
  return btn;
}
