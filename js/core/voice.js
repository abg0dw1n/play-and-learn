// Spoken prompts using the browser's built-in voice (free, works offline on most tablets).
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
export function speak(text, { rate = 0.88, pitch = 1.1 } = {}) {
  return new Promise((resolve) => {
    if (!supported || !store.get().sound || !text) return resolve();
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
