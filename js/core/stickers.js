// Sticker book: every finished game earns a new sticker until she has them all.
import { el, pick } from './util.js';
import { store } from './store.js';
import { RARE, RARE_EMOJIS, recordFinish, unlocked } from './rare.js';

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
