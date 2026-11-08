// Rare and legendary stickers. Unlike the everyday stickers (one per finished game, picked at random), each of
// these is earned by doing something specific: a game with no wrong answers, trying every game, coming back on
// different days, playing at the harder levels... so playing one game over and over won't find them.
// Pure rules live here; stickers.js hands them what she has and saves what she wins.
import { store, levelCap } from './store.js';

// event: true = decided by this very finish (how she did, the time, which game), so it must be given now or it is lost.
// Otherwise it is based on everything she has done so far, so it can wait for a later game.
const rare = (emoji, name, hint, test, event = false) => ({ emoji, name, rarity: 'rare', hint, test, event });
const legendary = (emoji, name, hint, test) => ({ emoji, name, rarity: 'legendary', hint, test });

const count = (o) => Object.keys(o || {}).length;
const dayOfWeek = (iso) => new Date(`${iso}T12:00:00`).getDay();

/** c: { game, perfect, difficulty, now, stats, have (Set of emojis), commons (all everyday emojis), worlds, games } */
export const RARE = [
  rare('💎', 'diamond', 'Finish a game without a single wrong answer (Growing Strong or Super Star).', (c) => c.perfect && c.difficulty >= 1, true),
  rare('🥇', 'gold medal', 'Finish a game with no wrong answers in 3 different games.', (c) => count(c.stats.perfect) >= 3),
  rare('🧩', 'puzzle piece', 'Play every game in one world (Reading, Math or Fun).', (c) => c.worlds.some((w) => w.games.every((id) => (store.game(id).plays || 0) > 0))),
  rare('🦸', 'superhero', 'Finish a game on Super Star.', (c) => c.difficulty === 2, true),
  rare('🔥', 'flame', 'Play on 3 different days.', (c) => c.stats.days.length >= 3),
  rare('🐦', 'early bird', 'Finish a game before 8 in the morning.', (c) => c.now.getHours() < 8, true),
  rare('🎓', 'graduation cap', 'Reach the top level of a game (Growing Strong or Super Star).', (c) => c.games.some((g) => [1, 2].some((d) => levelCap(g, d) > 1 && store.level(g.id, d) >= levelCap(g, d)))),
  rare('🦉', 'wise owl', 'Finish a game with no wrong answers in Reading, Math and Fun World.', (c) => c.worlds.length > 0 && c.worlds.every((w) => w.games.some((id) => c.stats.perfect[id]))),
  rare('🧠', 'brain', 'Finish Memory Match with almost no wrong guesses.', (c) => c.perfect && c.game.id === 'memory' && c.difficulty >= 1, true),
  rare('🎯', 'bullseye', 'Pop every balloon in Balloon Pop (Growing Strong or Super Star).', (c) => c.perfect && c.game.id === 'pop' && c.difficulty >= 1, true),
  rare('🏆', 'trophy', 'Win Tic-Tac-Toe on Super Star.', (c) => c.perfect && c.game.id === 'tictactoe' && c.difficulty === 2, true),
  rare('🎪', 'circus tent', 'Play on a Saturday and on a Sunday.', (c) => c.stats.days.some((d) => dayOfWeek(d) === 6) && c.stats.days.some((d) => dayOfWeek(d) === 0)),
  legendary('🐉', 'dragon', 'Find all 12 rare stickers.', (c) => RARE.filter((r) => r.rarity === 'rare').every((r) => c.have.has(r.emoji))),
  legendary('🌠', 'shooting star', 'Play on 7 different days.', (c) => c.stats.days.length >= 7),
  legendary('🪐', 'planet', 'Finish a game with no wrong answers in 6 different games.', (c) => count(c.stats.perfect) >= 6),
  legendary('🧞', 'genie', 'Finish a game with no wrong answers on Super Star in 3 different games.', (c) => count(c.stats.perfectSS) >= 3),
  legendary('🦚', 'peacock', 'Find every other sticker, all 40 everyday ones and all the rare and legendary ones.',
    (c) => c.commons.every((e) => c.have.has(e)) && RARE.filter((r) => r.emoji !== '🦚').every((r) => c.have.has(r.emoji))),
];
export const RARE_EMOJIS = new Set(RARE.map((r) => r.emoji));
export const rarityOf = (emoji) => RARE.find((r) => r.emoji === emoji)?.rarity || 'common';

const localDay = (d) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD in her own time zone

/** What she has done so far (kept small: the last 60 days played, and which games she has aced). */
export function readStats() {
  const s = store.get().stats || {};
  const obj = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? { ...o } : {});
  return { days: Array.isArray(s.days) ? s.days.filter((d) => /^\d{4}-\d\d-\d\d$/.test(d)) : [], perfect: obj(s.perfect), perfectSS: obj(s.perfectSS) };
}

/** Write down today's play. A "perfect" only counts on Growing Strong or harder, so the easy mode can't unlock them. */
export function recordFinish({ game, perfect, difficulty, now }) {
  const st = readStats();
  const day = localDay(now);
  if (!st.days.includes(day)) st.days = [...st.days, day].sort().slice(-60);
  if (perfect && difficulty >= 1) st.perfect[game.id] = (st.perfect[game.id] || 0) + 1;
  if (perfect && difficulty === 2) st.perfectSS[game.id] = (st.perfectSS[game.id] || 0) + 1;
  store.set({ stats: st });
  return st;
}

/** Which rare/legendary stickers does this finish unlock? Ones decided by this finish all count; ones that were already
 *  earned from past play (like after an update) are handed out one per finish so they don't all pile up at once.
 *  Legendary ones can build on a rare one given in the same finish. */
export function unlocked(ctx) {
  const have = new Set(ctx.have);
  const won = [];
  let backlog = 0;
  for (let again = true; again;) {
    again = false;
    for (const r of RARE) {
      if (have.has(r.emoji) || !r.test({ ...ctx, have })) continue;
      if (!r.event && backlog >= MAX_BACKLOG_PER_FINISH) continue;
      if (!r.event) backlog++;
      have.add(r.emoji); won.push(r); again = true;
    }
  }
  return won;
}
const MAX_BACKLOG_PER_FINISH = 1;
