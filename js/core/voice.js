// Spoken prompts using the browser's built-in voice (free, works offline on most tablets).
import { el } from './util.js';
import { store } from './store.js';

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
const PREFERRED = ['Samantha', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Ava', 'Allison', 'Karen'];
let voice = null;

function chooseVoice() {
  const voices = speechSynthesis.getVoices();
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

/** Speak text; resolves when finished (or after a safety timeout). */
export function speak(text, { rate = 0.88, pitch = 1.1, force = false } = {}) {
  return new Promise((resolve) => {
    if (!supported || (!force && !store.get().sound) || !text) return resolve();
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'en-US';
    u.rate = rate;
    u.pitch = pitch;
    const done = () => { clearTimeout(t); resolve(); };
    u.onend = done;
    u.onerror = done;
    const t = setTimeout(resolve, 1500 + text.length * 90);
    speechSynthesis.speak(u);
  });
}

export function hush() {
  if (supported) speechSynthesis.cancel();
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
