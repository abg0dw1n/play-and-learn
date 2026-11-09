// Little synthesized sound effects — no audio files to host.
import { store } from './store.js';
import { onFirstTap } from './voice.js';

let ctx;
function audio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx ||= new AC();
  // 'suspended' before the first tap; iPhones also use 'interrupted' after a call or switching apps.
  if (ctx.state !== 'running') ctx.resume?.();
  return ctx;
}

// Phones keep sound off until it's started inside a tap: on every tap until it's running,
// wake the audio engine and play a tiny silent sound.
let audioUnlocked = false;
onFirstTap(() => {
  if (audioUnlocked) return;
  const c = audio();
  if (!c) return;
  const src = c.createBufferSource();
  src.buffer = c.createBuffer(1, 1, 22050);
  src.connect(c.destination);
  src.start(0);
  if (c.state === 'running') audioUnlocked = true;
});

function tone(freq, start, dur, type = 'triangle', vol = 0.18, freqEnd = null) {
  const c = audio();
  if (!c || !store.get().sound) return;
  const t0 = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

// Friendly critter and effect noises, built from a few gliding tones: [start Hz, end Hz, when (s), how long (s), wave, volume].
const SOUNDS = {
  bark: [[420, 190, 0, 0.12, 'sawtooth', 0.12], [420, 170, 0.18, 0.12, 'sawtooth', 0.12]],
  meow: [[520, 880, 0, 0.22, 'triangle', 0.16], [880, 560, 0.22, 0.28, 'triangle', 0.16]],
  roar: [[230, 90, 0, 0.6, 'sawtooth', 0.1], [115, 60, 0, 0.6, 'square', 0.06]],
  squeak: [[1200, 1800, 0, 0.08, 'sine', 0.14], [1800, 1300, 0.09, 0.1, 'sine', 0.14]],
  ribbit: [[180, 260, 0, 0.08, 'square', 0.08], [260, 180, 0.08, 0.08, 'square', 0.08], [180, 260, 0.2, 0.08, 'square', 0.08], [260, 180, 0.28, 0.08, 'square', 0.08]],
  bubble: [[400, 900, 0, 0.1, 'sine', 0.14], [500, 1100, 0.13, 0.1, 'sine', 0.14], [600, 1300, 0.26, 0.1, 'sine', 0.14]],
  buzz: Array.from({ length: 7 }, (_, i) => [i % 2 ? 230 : 190, i % 2 ? 190 : 230, i * 0.06, 0.07, 'sawtooth', 0.06]),
  trumpet: [[300, 430, 0, 0.26, 'sawtooth', 0.1], [430, 290, 0.24, 0.3, 'sawtooth', 0.1]],
  chime: [[784, null, 0, 0.35, 'sine', 0.15], [988, null, 0.1, 0.35, 'sine', 0.15], [1319, null, 0.2, 0.5, 'sine', 0.15]],
  sparkle: [[1568, null, 0, 0.18, 'sine', 0.12], [1976, null, 0.07, 0.18, 'sine', 0.12], [2349, null, 0.14, 0.18, 'sine', 0.12], [2637, null, 0.21, 0.25, 'sine', 0.12]],
  pop: [[640, 200, 0, 0.1, 'sine', 0.2]],
  boing: [[200, 520, 0, 0.15, 'sine', 0.18], [520, 160, 0.15, 0.22, 'sine', 0.18]],
  whoosh: [[200, 1300, 0, 0.4, 'triangle', 0.1]],
  siren: [[600, 900, 0, 0.25, 'square', 0.06], [900, 600, 0.25, 0.25, 'square', 0.06], [600, 900, 0.5, 0.25, 'square', 0.06]],
  chirp: [[1400, 2000, 0, 0.06, 'sine', 0.14], [1800, 2400, 0.09, 0.06, 'sine', 0.14], [1600, 2200, 0.18, 0.07, 'sine', 0.14]],
  hoot: [[420, 350, 0, 0.25, 'sine', 0.18], [420, 340, 0.35, 0.3, 'sine', 0.18]],
  whale: [[150, 300, 0, 0.5, 'sine', 0.2], [300, 170, 0.4, 0.6, 'sine', 0.2]],
  click: [[900, null, 0, 0.03, 'square', 0.08], [900, null, 0.07, 0.03, 'square', 0.08], [900, null, 0.14, 0.03, 'square', 0.08]],
  yip: [[620, 900, 0, 0.07, 'square', 0.07], [900, 700, 0.1, 0.07, 'square', 0.07]],
  dolphin: [[1800, 2600, 0, 0.08, 'sine', 0.12], [1800, 2700, 0.12, 0.08, 'sine', 0.12], [1900, 2800, 0.24, 0.1, 'sine', 0.12]],
  fanfare: [[523, null, 0, 0.2, 'triangle', 0.16], [659, null, 0.15, 0.2, 'triangle', 0.16], [784, null, 0.3, 0.2, 'triangle', 0.16], [1047, null, 0.45, 0.5, 'triangle', 0.18]],
  rustle: [[300, 500, 0, 0.05, 'triangle', 0.05], [500, 280, 0.06, 0.05, 'triangle', 0.05], [320, 520, 0.12, 0.05, 'triangle', 0.05]],
  thump: [[160, 70, 0, 0.14, 'sine', 0.25]],
  swish: [[500, 1400, 0, 0.22, 'triangle', 0.08]],
};

export const sfx = {
  /** A critter noise by name (see SOUNDS); unknown names are just a pop. */
  critter(kind) { (SOUNDS[kind] || SOUNDS.pop).forEach(([f0, f1, t, d, type, v]) => tone(f0, t, d, type, v, f1)); },
  tap() { tone(660, 0, 0.08); tone(990, 0.04, 0.08); },
  yes() { [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.28)); },
  oops() { tone(330, 0, 0.16, 'sine', 0.14); tone(262, 0.13, 0.22, 'sine', 0.14); },
  fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.32)); },
};
