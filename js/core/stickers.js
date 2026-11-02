// Sticker book: every finished game earns a new sticker until she has them all.
import { el, pick } from './util.js';
import { store } from './store.js';
import { speak } from './voice.js';
import { sfx } from './sfx.js';
import { burstAt } from './confetti.js';

export const STICKERS = [
  ['🦄', 'unicorn'], ['🐶', 'puppy'], ['🐱', 'kitty'], ['🦁', 'lion'], ['🐼', 'panda'],
  ['🐨', 'koala'], ['🐸', 'frog'], ['🐙', 'octopus'], ['🦋', 'butterfly'], ['🐢', 'turtle'],
  ['🐬', 'dolphin'], ['🦖', 'dinosaur'], ['🐧', 'penguin'], ['🦊', 'fox'], ['🐰', 'bunny'],
  ['🐝', 'bee'], ['🐞', 'ladybug'], ['🦒', 'giraffe'], ['🐘', 'elephant'], ['🦩', 'flamingo'],
  ['🐳', 'whale'], ['🦀', 'crab'], ['🌈', 'rainbow'], ['⭐', 'star'], ['🌙', 'moon'],
  ['☀️', 'sun'], ['🌸', 'flower'], ['🌻', 'sunflower'], ['🍓', 'strawberry'], ['🍉', 'watermelon'],
  ['🧁', 'cupcake'], ['🍦', 'ice cream'], ['🍩', 'donut'], ['🎈', 'balloon'], ['🎀', 'bow'],
  ['👑', 'crown'], ['🚀', 'rocket'], ['🚒', 'fire truck'], ['🎠', 'carousel'], ['🏰', 'castle'],
];
const byEmoji = Object.fromEntries(STICKERS);

/** Stickers she owns, in the order she got them. Stars earned before the sticker book
    existed are turned into stickers the first time this runs. */
export function owned() {
  const s = store.get();
  if (!Array.isArray(s.stickers)) {
    const start = [];
    const want = Math.min(s.stars || 0, STICKERS.length);
    while (start.length < want) {
      const [e] = pick(STICKERS);
      if (!start.includes(e)) start.push(e);
    }
    store.set({ stickers: start });
  }
  return store.get().stickers.filter((e) => byEmoji[e]);
}

/** Give a new sticker; returns [emoji, name], or null once she has them all. */
export function awardSticker() {
  const have = owned();
  const left = STICKERS.filter(([e]) => !have.includes(e));
  if (!left.length) return null;
  const won = pick(left);
  store.set({ stickers: [...have, won[0]], newest: won[0] });
  return won;
}

/** "a puppy", "an octopus" (but "a unicorn"). */
export function withArticle(name) {
  return /^[aeio]/.test(name) ? `an ${name}` : `a ${name}`;
}

/** The sticker book page. */
export function renderStickerBook(root, { onHome }) {
  const have = owned();
  const newest = store.get().newest;
  root.innerHTML = '';
  root.className = 'screen stickers';
  root.style.setProperty('--accent', '#f4a100');

  const grid = el('div', { class: 'sticker-grid' }, STICKERS.map(([e, name]) => {
    const got = have.includes(e);
    const cell = el('button', {
      class: `sticker${got ? '' : ' locked'}${e === newest ? ' newest' : ''}`,
      'aria-label': got ? name : 'Not found yet',
    }, e);
    cell.addEventListener('click', () => {
      if (got) {
        cell.classList.remove('wiggle'); void cell.offsetWidth; cell.classList.add('wiggle');
        sfx.tap();
        speak(name);
      } else {
        speak('Play a game to find this one!');
      }
    });
    return cell;
  }));

  root.append(
    el('header', { class: 'topbar' },
      el('button', { class: 'icon-btn', 'aria-label': 'Home', onclick: onHome }, '🏠'),
      el('h2', { class: 'book-title' }, 'My Stickers'),
      el('div', { class: 'star-count' }, `${have.length} / ${STICKERS.length}`)),
    el('p', { class: 'home-sub book-sub' },
      have.length === STICKERS.length ? 'You found them all! 🎉'
        : have.length ? 'Tap a sticker! Finish a game to get a new one.'
          : 'Finish a game to get your first sticker!'),
    grid);

  if (newest && have.includes(newest)) {
    store.set({ newest: null });
    const cell = grid.querySelector('.newest');
    setTimeout(() => cell && burstAt(cell, 30), 300);
  }
  return () => {};
}
