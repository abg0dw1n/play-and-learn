// Spoken prompts using the browser's built-in voice (free, works offline on most tablets).
import { el } from './util.js';
import { store } from './store.js';

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
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

/* Higher score = more natural. Phones and computers ship a few "Premium", "Enhanced" or
   "Natural" voices that sound far more human than the basic ones; prefer those, then
   well-known friendly voices, and English only. */
function voiceScore(v) {
  const n = `${v.name} ${v.voiceURI || ''}`.toLowerCase();
  let score = 0;
  if (/premium/.test(n)) score += 100;
  if (/enhanced/.test(n)) score += 80;
  if (/natural|neural|online/.test(n)) score += 90;       // Edge/Windows natural voices
  if (/google/.test(n) && /us english/.test(n)) score += 50; // Android Chrome's best
  const friendly = ['ava', 'zoe', 'samantha', 'allison', 'susan', 'nicky', 'aria', 'jenny', 'karen', 'serena', 'tessa'];
  if (friendly.some((f) => new RegExp(`\\b${f}\\b`).test(n))) score += 30;
  if (/compact|eloquence|novelty|whisper|bad news|bahh|bells|boing|bubbles|cellos|deranged|good news|hysterical|organ|trinoids|zarvox|albert|fred|junior|kathy|ralph|superstar/.test(n)) score -= 200;
  if (v.lang?.toLowerCase().replace('_', '-').startsWith('en-us')) score += 10;
  if (v.localService) score += 2;
  return score;
}

function chooseVoice() {
  const voices = speechSynthesis.getVoices();
  const picked = store.get().voiceName;
  if (picked) {
    const v = voices.find((x) => x.name === picked);
    if (v) return v;
  }
  const english = voices.filter((v) => v.lang?.toLowerCase().replace('_', '-').startsWith('en'));
  english.sort((a, b) => voiceScore(b) - voiceScore(a));
  return english[0] || null;
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
  if (player && !playerUnlocked && !clipDone) {
    player.src = SILENCE;
    player.play().then(() => { playerUnlocked = true; }).catch(() => {});
  }
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

/* ---- Recorded voice ----
   Every line the games say was pre-made as a clip with a natural AI voice (tools/tts.py) and is
   listed in audio/manifest.json. A line with a clip is played from that; any other line (or if the
   clip can't play) falls back to the device's built-in voice. */
const CLIP_BASE = '/audio/';
let manifest = {};
const manifestReady = fetch(`${CLIP_BASE}manifest.json`).then((r) => (r.ok ? r.json() : {})).then((m) => { manifest = m; }).catch(() => {});

const player = typeof Audio !== 'undefined' ? new Audio() : null; // one element, unlocked by the first tap
player && (player.preload = 'auto');
// 0.1s of silence; playing it inside a tap lets the same element play clips later on iPhones.
const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA=';
let playerUnlocked = false;
let clipDone = null; // ends the clip that's playing now (also used by hush)

function playClip(url) {
  return new Promise((resolve) => {
    clipDone?.(false);
    let over = false;
    const finish = (ok = true) => {
      if (over) return;
      over = true;
      clearTimeout(t);
      player.onended = player.onerror = null;
      if (clipDone === finish) clipDone = null;
      resolve(ok);
    };
    clipDone = finish;
    const t = setTimeout(() => finish(true), 15000);
    player.onended = () => finish(true);
    player.onerror = () => finish(false);
    player.src = url;
    player.play().catch(() => finish(false)); // blocked by the phone: let the caller fall back
  });
}

let activeUtterance = null; // keep a reference: some phones drop the "finished" event otherwise
let speakToken = 0; // bumps whenever new speech starts or hush() is called, to stop a running list
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Speak a line, or a list of lines said one after another with a breath between.
    A list inside the list is one flowing sentence made of short pieces. Resolves when done. */
export async function speak(text, opts = {}) {
  const my = ++speakToken;
  const items = Array.isArray(text) ? text : [text];
  await manifestReady;
  if (my !== speakToken) return;
  // Warm the cache for the clips that come after the first one.
  items.flat().slice(1).forEach((t) => manifest[t] && fetch(CLIP_BASE + manifest[t] + '.mp3').catch(() => {}));
  await speakSeq(items, my, opts.gap ?? 350, opts);
}

async function speakSeq(items, my, gap, opts) {
  for (let i = 0; i < items.length; i++) {
    if (my !== speakToken) return;
    if (Array.isArray(items[i])) await speakSeq(items[i], my, 60, opts);
    else await speakLine(items[i], opts, my);
    if (i < items.length - 1 && my === speakToken) await wait(gap);
  }
}

async function speakLine(text, opts, my) {
  if (!text || (!opts.force && !store.get().sound)) return;
  const id = manifest[text];
  if (id && player) {
    if (supported && (speechSynthesis.speaking || speechSynthesis.pending)) speechSynthesis.cancel();
    if (await playClip(`${CLIP_BASE}${id}.mp3`)) return;
    if (my !== speakToken) return;
  }
  await speakOne(text, opts);
}

function speakOne(text, { rate = 0.9, pitch = 1.0, force = false } = {}) {
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
  speakToken++;
  activeUtterance = null;
  clipDone?.(true);
  player?.pause();
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
