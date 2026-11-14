// Big full-screen moments: a secret found, an egg hatching.
import { el } from '../core/util.js';
import { sfx } from '../core/sfx.js';
import { speak } from '../core/voice.js';
import { burst } from '../core/confetti.js';
import { hatById, powerById, TREASURES, rewardLine } from './secrets.js';

const rewardOf = (s) => {
  const r = s.reward;
  if (r.hat) { const h = hatById(r.hat); return [h.emoji, `Pip can wear it!`]; }
  if (r.power) { const p = powerById(r.power); return [p.emoji, `New magic: ${p.name}`]; }
  const t = TREASURES.find((x) => x.emoji === r.treasure); return [t.emoji, `A ${t.name} for your world`];
};

function overlay(build, onDone) {
  const o = el('div', { class: 'secret-overlay', role: 'dialog' });
  const card = el('div', { class: 'secret-card' });
  o.append(card); document.body.append(o);
  const close = () => { o.remove(); onDone?.(); };
  build(card, close);
}

/** Shows each newly found secret in turn, then calls onDone. */
export function celebrateSecrets(list, onDone) {
  if (!list.length) { onDone?.(); return; }
  const [s, ...rest] = list;
  overlay((card, close) => {
    const [icon, text] = rewardOf(s);
    const all = s.id === 'all';
    card.append(
      el('div', { class: 'secret-badge' }, all ? '👑 YOU FOUND EVERY SECRET! 👑' : '🤫 SECRET FOUND! 🤫'),
      el('div', { class: 'secret-icon' }, s.icon),
      el('div', { class: 'secret-name' }, s.name),
      el('div', { class: 'secret-reward' }, el('span', { class: 'big' }, icon), el('span', {}, text)),
      el('div', {}, el('button', { class: 'big-btn again', onclick: close }, '✨ Yay!')));
    sfx.fanfare(); burst({ count: all ? 320 : 200 });
    speak([all ? 'You found every secret! You are the secret keeper!' : 'You found a secret!', rewardLine(s)]);
  }, () => celebrateSecrets(rest, onDone));
}

/** The egg hatching: crack, crack, then the creature. */
export function celebrateHatch(c, onDone) {
  overlay((card, close) => {
    card.append(
      el('div', { class: 'secret-badge' }, c.golden ? '🌟 LEGENDARY FRIEND! 🌟' : '🐣 IT HATCHED! 🐣'),
      el('div', { class: 'secret-icon' }, c.emoji),
      el('div', { class: 'secret-name' }, c.name),
      el('div', {}, el('button', { class: 'big-btn again', onclick: close }, '💛 Hello!')));
    sfx.fanfare(); burst({ count: c.golden ? 360 : 200 });
    speak([c.golden ? 'Wow! A legendary friend!' : 'Your egg hatched!', `It's ${/^[aeiou]/.test(c.name) ? 'an' : 'a'} ${c.name}!`]);
  }, onDone);
}
