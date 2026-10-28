// Little synthesized sound effects — no audio files to host.
import { store } from './store.js';

let ctx;
function audio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx ||= new AC();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, start, dur, type = 'triangle', vol = 0.18) {
  const c = audio();
  if (!c || !store.get().sound) return;
  const t0 = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + dur + 0.05);
}

export const sfx = {
  tap() { tone(660, 0, 0.08); tone(990, 0.04, 0.08); },
  yes() { [523, 659, 784].forEach((f, i) => tone(f, i * 0.09, 0.28)); },
  oops() { tone(330, 0, 0.16, 'sine', 0.14); tone(262, 0.13, 0.22, 'sine', 0.14); },
  fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.13, 0.32)); },
};
