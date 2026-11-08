// Sticker book: every finished game earns a new sticker until she has them all.
import { el, pick } from './util.js';
import { store } from './store.js';
import { speak, soundToggle } from './voice.js';
import { sfx } from './sfx.js';
import { burstAt } from './confetti.js';
import { guide } from './guide.js';
import { RARE, RARE_EMOJIS, rarityOf, recordFinish, unlocked } from './rare.js';

export { RARE };

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
const COMMON_EMOJIS = STICKERS.map(([e]) => e);
const byEmoji = Object.fromEntries([...STICKERS, ...RARE.map((r) => [r.emoji, r.name])]);

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

export const ownedCommon = () => owned().filter((e) => !RARE_EMOJIS.has(e));
export const ownedRare = () => owned().filter((e) => RARE_EMOJIS.has(e));

/** Rare and legendary stickers this finished game unlocks (saved and returned; usually none).
    info: { perfect: no wrong answers, difficulty, now }. */
export async function awardRare(game, { perfect = false, difficulty = store.getDifficulty(), now = new Date() } = {}) {
  const { games, worlds } = await import('../games/index.js'); // loaded on demand: the games themselves import this file
  const have = owned();
  const stats = recordFinish({ game, perfect, difficulty, now });
  const active = games.filter((g) => !g.paused); // a game that is napping can't be required
  const open = worlds.map((w) => ({ ...w, games: w.games.filter((id) => active.some((g) => g.id === id)) }));
  const won = unlocked({ game, perfect, difficulty, now, stats, have: new Set(have), commons: COMMON_EMOJIS, worlds: open, games: active });
  if (won.length) store.set({ stickers: [...have, ...won.map((r) => r.emoji)], newest: won[won.length - 1].emoji });
  return won;
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
const SKY = new Set(['🌈', '⭐', '🌙', '☀️', '🎈', '🚀', '🦋', '🐝', '🎀', '🌠', '🪐', '🐦', '🐉']);
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
    const node = el('button', { class: `scene-item${e === newest ? ' newest' : ''}${RARE_EMOJIS.has(e) ? ` ${rarityOf(e)}` : ''}`, 'aria-label': byEmoji[e], style: { left: `${x}%`, top: `${y}%`, 'font-size': `${size}cqw`, 'z-index': String(Math.round(y)) } }, e);
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

  // Rare and legendary stickers: a mystery until found. Tap one for a hint (grown-ups: that's how to earn it).
  const hint = el('p', { class: 'rare-hint', role: 'status' }, 'Rare stickers are hard to find! Tap a ❓ for a hint.');
  const rareGrid = el('div', { class: 'sticker-grid rare-grid' }, RARE.map((r) => {
    const got = have.includes(r.emoji);
    const cell = el('button', {
      class: `sticker ${r.rarity}${got ? '' : ' mystery'}${r.emoji === newest ? ' newest' : ''}`,
      'aria-label': got ? `${r.name}, ${r.rarity} sticker` : `A ${r.rarity} sticker not found yet`,
    }, got ? r.emoji : '❓');
    cell.addEventListener('click', () => {
      hint.textContent = got ? `${r.emoji} ${r.name}: ${r.hint}` : `Hint: ${r.hint}`;
      if (got) say(r.emoji, cell);
      else { sfx.tap(); speak(`This is ${r.rarity === 'legendary' ? 'a legendary' : 'a rare'} sticker. Can you find it?`); }
    });
    return cell;
  }));

  const commons = ownedCommon().length, rares = ownedRare().length;
  const pip = guide(have.length ? 'happy' : 'think', 90, 'world-pip', store.get().character);
  root.append(
    el('header', { class: 'topbar' },
      el('button', { class: 'icon-btn', 'aria-label': 'Home', onclick: onHome }, '🏠'),
      el('h2', { class: 'book-title' }, '🌈 My World'),
      el('div', { class: 'topbar-right' }, el('div', { class: 'star-count' }, `${commons} / ${STICKERS.length}`), soundToggle())),
    el('div', { class: 'world-row' }, pip,
      el('p', { class: 'bubble' },
        commons === STICKERS.length && rares === RARE.length ? 'You found them all! 🎉'
          : have.length ? 'Look how your world is growing! Finish a game to add more.'
            : 'Finish a game to put the first friend in your world!')),
    scene,
    el('h3', { class: 'collection-title' }, 'All the stickers'),
    grid,
    el('h3', { class: 'collection-title rare-title' }, `✨ Rare & legendary stickers  ${rares} / ${RARE.length}`),
    hint,
    rareGrid);

  if (newest && have.includes(newest)) {
    store.set({ newest: null });
    const item = scene.querySelector('.newest');
    setTimeout(() => item && burstAt(item, 40), 350);
  }
  return () => {};
}
