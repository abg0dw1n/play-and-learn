// Sticker book: every finished game earns a new sticker until she has them all.
import { el, pick } from './util.js';
import { store } from './store.js';
import { speak, soundToggle } from './voice.js';
import { sfx } from './sfx.js';
import { burstAt } from './confetti.js';
import { guide } from './guide.js';

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

/* ---- My World: a scene that fills up as she earns stickers ---- */
const SKY = new Set(['🌈', '⭐', '🌙', '☀️', '🎈', '🚀', '🦋', '🐝', '🎀']);
// A steady scatter: the same sticker always lands in the same spot, so her world doesn't shuffle.
const hash = (n) => { let x = Math.imul(n + 1, 2654435761) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; return (x >>> 8) / 16777216; };
function spots(count, x0, x1, y0, y1, cols, seed) {
  const rows = Math.ceil(count / cols), out = [];
  for (let i = 0; i < count; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    const x = x0 + ((c + 0.5 + (hash(seed + i) - 0.5) * 0.6) / cols) * (x1 - x0);
    const y = y0 + ((r + 0.5 + (hash(seed + 99 + i) - 0.5) * 0.6) / rows) * (y1 - y0);
    out.push([x, y]);
  }
  // shuffle which spot comes first, so new stickers appear all over the scene
  return out.map((p, i) => [hash(seed + 500 + i), p]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
}
const SKY_SPOTS = spots(12, 6, 94, 4, 38, 4, 7);
const GROUND_SPOTS = spots(40, 4, 96, 52, 92, 8, 21);

function worldScene(have, newest, onTap) {
  let sky = 0, ground = 0;
  const items = have.map((e) => {
    const isSky = SKY.has(e);
    const [x, y] = isSky ? SKY_SPOTS[sky++ % SKY_SPOTS.length] : GROUND_SPOTS[ground++ % GROUND_SPOTS.length];
    const size = isSky ? 9 : 7.5 + ((y - 52) / 40) * 6; // % of the scene's width; nearer (lower) things look bigger
    const node = el('button', { class: `scene-item${e === newest ? ' newest' : ''}`, 'aria-label': byEmoji[e], style: { left: `${x}%`, top: `${y}%`, 'font-size': `${size}cqw`, 'z-index': String(Math.round(y)) } }, e);
    node.addEventListener('click', () => onTap(e, node));
    return node;
  });
  return el('div', { class: 'scene', role: 'group', 'aria-label': 'Your world' },
    el('div', { class: 'scene-sun' }), el('div', { class: 'scene-hill back' }), el('div', { class: 'scene-hill front' }), items);
}

/** My World: the scene on top, and the full sticker collection underneath. */
export function renderStickerBook(root, { onHome }) {
  const have = owned();
  const newest = store.get().newest;
  root.innerHTML = '';
  root.className = 'screen stickers';
  root.style.setProperty('--accent', '#43b05c');

  const say = (e, node) => {
    node.classList.remove('wiggle'); void node.offsetWidth; node.classList.add('wiggle');
    sfx.tap();
    speak(byEmoji[e]);
  };
  const scene = worldScene(have, newest, say);

  const grid = el('div', { class: 'sticker-grid' }, STICKERS.map(([e, name]) => {
    const got = have.includes(e);
    const cell = el('button', {
      class: `sticker${got ? '' : ' locked'}${e === newest ? ' newest' : ''}`,
      'aria-label': got ? name : 'Not found yet',
    }, e);
    cell.addEventListener('click', () => {
      if (got) say(e, cell);
      else speak('Play a game to find this one!');
    });
    return cell;
  }));

  const pip = guide(have.length ? 'happy' : 'think', 90, 'world-pip', store.get().character);
  root.append(
    el('header', { class: 'topbar' },
      el('button', { class: 'icon-btn', 'aria-label': 'Home', onclick: onHome }, '🏠'),
      el('h2', { class: 'book-title' }, '🌈 My World'),
      el('div', { class: 'topbar-right' }, el('div', { class: 'star-count' }, `${have.length} / ${STICKERS.length}`), soundToggle())),
    el('div', { class: 'world-row' }, pip,
      el('p', { class: 'bubble' },
        have.length === STICKERS.length ? 'You found them all! 🎉'
          : have.length ? 'Look how your world is growing! Finish a game to add more.'
            : 'Finish a game to put the first friend in your world!')),
    scene,
    el('h3', { class: 'collection-title' }, 'All the stickers'),
    grid);

  if (newest && have.includes(newest)) {
    store.set({ newest: null });
    const item = scene.querySelector('.newest');
    setTimeout(() => item && burstAt(item, 40), 350);
  }
  return () => {};
}
