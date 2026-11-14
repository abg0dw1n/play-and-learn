// The rules behind the rewards around stickers: shiny stickers, gift boxes, the daily hunt, finished collections,
// new places and a grown-up's reward goal. Everything here saves into the same device storage as the rest of the app.
import { store } from '../core/store.js';
import { SETS, setsDone, unlockedScenes, DECOR, completedBy } from './data.js';

export const GIFT_EVERY = 3;   // finished games per gift box
export const DAILY_NEED = 2;   // different games for the day's hunt
export const SHINY_CHANCE = 0.4;

export const dayKey = (d = new Date()) => d.toLocaleDateString('en-CA'); // YYYY-MM-DD, in her own time zone

/** Only a game with no wrong answers on Growing Strong or harder can make a shiny sticker. */
export const rollShiny = ({ perfect, difficulty }, rng = Math.random) => !!perfect && difficulty >= 1 && rng() < SHINY_CHANCE;

export function addDecor(emoji) {
  const have = store.get().decor || [];
  if (!have.includes(emoji)) store.set({ decor: [...have, emoji] });
}

export function makeShiny(emoji) {
  const have = store.get().shinies || [];
  if (!have.includes(emoji)) store.set({ shinies: [...have, emoji] });
}

/** Today's hunt: play DAILY_NEED different games. */
export function dailyToday(now = new Date()) {
  const d = store.get().daily;
  const day = dayKey(now);
  const games = d && d.day === day ? d.games : [];
  return { day, games, need: DAILY_NEED, done: games.length >= DAILY_NEED, claimed: !!(d && d.day === day && d.claimed) };
}

/** Everything that changes because a game was finished. Returns what happened, so the finish screen can celebrate it.
 *  before / after: the stickers she had (everyday + rare) at the start and end of this finish. */
export function afterFinish({ game, before, after, now = new Date() }) {
  const out = { gifts: 0, giftFrom: [], set: null, scenes: [], goalReached: false, daily: null };

  const doneBefore = new Set(setsDone(before).map((s) => s.id));
  out.set = setsDone(after).find((s) => !doneBefore.has(s.id)) || null;

  const sceneBefore = new Set(unlockedScenes(before.length).map((s) => s.id));
  out.scenes = unlockedScenes(after.length).filter((s) => !sceneBefore.has(s.id));

  let gifts = store.get().gifts || 0;
  let tick = (store.get().giftTick || 0) + 1;
  if (tick >= GIFT_EVERY) { tick = 0; gifts++; out.gifts++; out.giftFrom.push('games'); }

  const daily = dailyToday(now);
  const games = daily.games.includes(game.id) ? daily.games : [...daily.games, game.id];
  let claimed = daily.claimed;
  if (games.length >= DAILY_NEED && !claimed) { claimed = true; gifts++; out.gifts++; out.giftFrom.push('daily'); }
  out.daily = { count: Math.min(games.length, DAILY_NEED), need: DAILY_NEED, justDone: out.giftFrom.includes('daily'), started: daily.games.length === 0 };

  const patch = { gifts: Math.min(gifts, 99), giftTick: tick, daily: { day: daily.day, games, claimed } };
  if (out.set) addDecor(out.set.bonus.emoji);
  const goal = store.get().goal;
  if (goal && !goal.reached && after.length >= goal.base + goal.need) { patch.goal = { ...goal, reached: true }; out.goalReached = true; }
  store.set(patch);
  return out;
}

/** What a gift box holds: a new sticker, a decoration, or a shiny upgrade; a mix so every box feels like a surprise. */
export function chooseGiftPrize({ commons, have, decor, shinies }, rng = Math.random) {
  const newStickers = commons.filter(([e]) => !have.includes(e));
  const newDecor = DECOR.filter((d) => !decor.includes(d.emoji));
  const upgradable = have.filter((e) => commons.some(([c]) => c === e) && !shinies.includes(e));
  const options = [];
  if (newDecor.length) options.push(['decor', 55]);
  if (newStickers.length) options.push(['sticker', 30]);
  if (upgradable.length) options.push(['shiny', 15]);
  if (!options.length) return { kind: 'none' };
  let r = rng() * options.reduce((n, [, w]) => n + w, 0);
  const kind = (options.find(([, w]) => (r -= w) < 0) || options[0])[0];
  const choose = (list) => list[Math.floor(rng() * list.length) % list.length];
  if (kind === 'decor') { const d = choose(newDecor); return { kind, emoji: d.emoji, name: d.name }; }
  if (kind === 'sticker') { const [emoji, name] = choose(newStickers); return { kind, emoji, name }; }
  const emoji = choose(upgradable);
  return { kind, emoji, name: commons.find(([c]) => c === emoji)[1] };
}

/** A grown-up's reward goal: "N more stickers for <label>". */
export function setGoal({ label, icon, need }) {
  const total = (store.get().stickers || []).length;
  store.set({ goal: { label: String(label).trim().slice(0, 40), icon: icon || '🎁', need: Math.max(1, Math.min(200, Math.round(need))), base: total, reached: false } });
}
export const clearGoal = () => store.set({ goal: undefined });
export function goalProgress() {
  const g = store.get().goal;
  if (!g) return null;
  const have = Math.max(0, (store.get().stickers || []).length - g.base);
  return { ...g, have: Math.min(have, g.need), left: Math.max(0, g.need - have) };
}

export { SETS };

/** Give a sticker from a gift box. Returns the collection it completed (its bonus decoration is added), or null. */
export function grantSticker(emoji) {
  const have = store.get().stickers || [];
  if (have.includes(emoji)) return null;
  const set = completedBy(emoji, have);
  store.set({ stickers: [...have, emoji], newest: emoji });
  if (set) addDecor(set.bonus.emoji);
  return set;
}

/** Open one gift box: spends it and applies the prize. Returns { prize, set } or null when there is no box. */
export function openGift(commons, rng = Math.random) {
  const st = store.get();
  if (!(st.gifts > 0)) return null;
  const prize = chooseGiftPrize({ commons, have: st.stickers || [], decor: st.decor || [], shinies: st.shinies || [] }, rng);
  store.set({ gifts: st.gifts - 1 });
  let set = null;
  if (prize.kind === 'decor') addDecor(prize.emoji);
  else if (prize.kind === 'sticker') set = grantSticker(prize.emoji);
  else if (prize.kind === 'shiny') makeShiny(prize.emoji);
  return { prize, set };
}
