// Memory Match — flip two cards to find matching pairs. Just for fun.
import { el, shuffle } from '../core/util.js';
import { store } from '../core/store.js';
import { speak, hush, soundToggle } from '../core/voice.js';
import { sfx } from '../core/sfx.js';
import { burstAt } from '../core/confetti.js';
import { renderFinish } from '../core/finish.js';

const PICS = ['🐶', '🐱', '🦁', '🐸', '🐼', '🦄', '🐙', '🦋', '🐢', '🐬', '🐝', '🐞', '🐧', '🦊', '🐰'];
const SIZES = [{ pairs: 6, cols: 3 }, { pairs: 8, cols: 4 }, { pairs: 10, cols: 4 }]; // First Steps, Growing Strong, Super Star

/** The shuffled deck: each picture twice. */
export function makeDeck(pairs, rnd) {
  const pics = shuffle(PICS).slice(0, pairs);
  return shuffle([...pics, ...pics]);
}

export default {
  id: 'memory',
  title: 'Memory Match',
  emoji: '🃏',
  color: '#8e5bd9',
  blurb: 'Flip cards, find the pairs',
  fun: true,
  maxLevels: [1, 1, 1],

  run(root, game, nav) {
    const { pairs, cols } = SIZES[store.getDifficulty()];
    const deck = makeDeck(pairs);
    let alive = true, busy = false, first = null, found = 0, tries = 0;
    const timers = [];
    const later = (fn, ms) => { const t = setTimeout(() => alive && fn(), ms); timers.push(t); };

    root.innerHTML = '';
    root.className = `screen game theme-${game.id} memory`;
    root.style.setProperty('--accent', game.color);
    const status = el('h2', { class: 'prompt' }, 'Find the matching pairs!');
    const cards = deck.map((pic, i) => {
      const card = el('button', { class: 'mem-card', 'data-pic': pic, 'aria-label': 'Card' },
        el('span', { class: 'mem-inner' }, el('span', { class: 'mem-face mem-back' }, '❓'), el('span', { class: 'mem-face mem-front' }, pic)));
      card.addEventListener('click', () => flip(card));
      return card;
    });
    root.append(
      el('header', { class: 'topbar' },
        el('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: nav.onBack || nav.onHome }, nav.onBack ? '⬅️' : '🏠'),
        el('div', { class: 'star-count' }, `🃏 ${pairs} pairs`),
        el('div', { class: 'topbar-right' }, soundToggle())),
      status,
      el('div', { class: 'mem-grid', style: { '--cols': cols } }, cards));

    function flip(card) {
      if (!alive || busy || card.classList.contains('up') || card.classList.contains('matched')) return;
      card.classList.add('up'); sfx.tap();
      if (!first) { first = card; return; }
      tries++;
      const a = first, b = card; first = null;
      if (a.dataset.pic === b.dataset.pic) {
        found++;
        later(() => { a.classList.add('matched'); b.classList.add('matched'); sfx.yes(); burstAt(b, 30); }, 350);
        if (found === pairs) later(() => renderFinish(root, game, nav, { alive: () => alive, perfect: tries <= pairs + 2 }), 1500);
      } else {
        busy = true;
        later(() => { a.classList.remove('up'); b.classList.remove('up'); busy = false; }, 1000);
      }
    }

    speak('Find the matching pairs!');
    return () => { alive = false; timers.forEach(clearTimeout); hush(); };
  },
};
