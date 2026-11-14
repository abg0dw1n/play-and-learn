// Secrets, magic and the magic egg: rewards that aren't stickers.
// Secrets are found by poking around My World (tickle the sun, dig in the ground...). Each one gives Pip something to wear,
// a magic power for the world, or a treasure to place. Legendary stickers unlock magic too, and every few games the
// magic egg hatches a new creature (every 4th egg is golden, with a legendary creature inside).
import { store } from '../core/store.js';

/** Hats (things Pip can wear). pos: where it sits on Pip. */
export const HATS = [
  { id: 'bow', emoji: '🎀', name: 'bow', pos: 'top' },
  { id: 'shades', emoji: '🕶️', name: 'pair of sunglasses', pos: 'eyes' },
  { id: 'cap', emoji: '🧢', name: 'cap', pos: 'top' },
  { id: 'sunhat', emoji: '👒', name: 'sun hat', pos: 'top' },
  { id: 'magic', emoji: '🎩', name: 'magic hat', pos: 'top' },
  { id: 'starclip', emoji: '🌟', name: 'star clip', pos: 'top' },
  { id: 'crown', emoji: '👑', name: 'golden crown', pos: 'top' },
];
export const hatById = (id) => HATS.find((h) => h.id === id) || null;

/** Magic powers: tap to make something happen in the world. */
export const POWERS = [
  { id: 'bubbles', emoji: '🫧', name: 'bubbles' },
  { id: 'snow', emoji: '❄️', name: 'snowfall' },
  { id: 'hearts', emoji: '💖', name: 'love hearts' },
  { id: 'fireworks', emoji: '🎆', name: 'fireworks' },
  { id: 'dragon', emoji: '🐉', name: 'dragon flight', legendary: '🐉' },
  { id: 'stars', emoji: '🌠', name: 'star shower', legendary: '🌠' },
  { id: 'float', emoji: '🪐', name: 'float away', legendary: '🪐' },
  { id: 'wish', emoji: '🧞', name: 'magic wish', legendary: '🧞' },
  { id: 'disco', emoji: '🪩', name: 'rainbow party', legendary: '🦚' },
];
export const powerById = (id) => POWERS.find((p) => p.id === id) || null;

/** Treasures: things for her world that only secrets give. */
export const TREASURES = [
  { emoji: '💰', name: 'treasure bag' },
  { emoji: '🏮', name: 'lantern' },
  { emoji: '🗺️', name: 'treasure map' },
  { emoji: '🪺', name: 'nest' },
];

/** The secrets. hint is what a ❓ says when tapped (spoken). reward: { hat | power | treasure }. */
export const SECRETS = [
  { id: 'sun', icon: '☀️', name: 'Sun tickle', hint: 'The sun is ticklish! Tap it three times.', reward: { hat: 'shades' } },
  { id: 'moon', icon: '🌙', name: 'Moon tickle', hint: 'Visit at night and tickle the moon!', reward: { power: 'snow' } },
  { id: 'pipdance', icon: '💃', name: 'Pip dance', hint: 'Pip loves lots of taps! Tap Pip five times.', reward: { power: 'bubbles' } },
  { id: 'cloud', icon: '☁️', name: 'Fluffy cloud', hint: 'Clouds are fluffy. Tap a cloud three times!', reward: { power: 'hearts' } },
  { id: 'rainbow', icon: '🌈', name: 'Rainbow catch', hint: 'After the rain, catch the rainbow!', reward: { treasure: '💰' } },
  { id: 'dig', icon: '⛏️', name: 'Buried treasure', hint: 'Something is buried in the grass. Tap the ground five times!', reward: { hat: 'cap' } },
  { id: 'party', icon: '🥳', name: 'Friend party', hint: 'Friends love to be close. Put three friends together!', reward: { power: 'fireworks' } },
  { id: 'night', icon: '🦉', name: 'Night owl', hint: 'Come and visit your world at night time.', reward: { treasure: '🏮' } },
  { id: 'morning', icon: '🌅', name: 'Early riser', hint: 'Come and visit your world in the morning.', reward: { hat: 'sunhat' } },
  { id: 'traveler', icon: '🧭', name: 'Explorer', hint: 'Visit every place you have opened.', reward: { treasure: '🗺️' } },
  { id: 'gifts', icon: '🎁', name: 'Gift opener', hint: 'Open five gift boxes.', reward: { hat: 'magic' } },
  { id: 'hatch', icon: '🐣', name: 'First hatch', hint: 'Help your magic egg hatch!', reward: { treasure: '🪺' } },
  { id: 'star', icon: '⭐', name: 'Star catcher', hint: 'Tap the stars in the night sky.', reward: { hat: 'starclip' } },
  { id: 'all', icon: '👑', name: 'Secret keeper', hint: 'Find every other secret!', reward: { hat: 'crown' } },
];
export const secretById = (id) => SECRETS.find((s) => s.id === id) || null;

/** Creatures from the magic egg. Golden eggs hold the legendary ones. */
export const HATCHLINGS = [
  { emoji: '🐣', name: 'chick' }, { emoji: '🦔', name: 'hedgehog' }, { emoji: '🦦', name: 'otter' }, { emoji: '🐹', name: 'hamster' },
  { emoji: '🦥', name: 'sloth' }, { emoji: '🦜', name: 'parrot' }, { emoji: '🦢', name: 'swan' }, { emoji: '🦭', name: 'seal' },
  { emoji: '🐿️', name: 'chipmunk' }, { emoji: '🦘', name: 'kangaroo' },
];
export const LEGENDARY_HATCHLINGS = [
  { emoji: '🐲', name: 'baby dragon' }, { emoji: '🦕', name: 'long neck dinosaur' }, { emoji: '🧜‍♀️', name: 'mermaid' }, { emoji: '🧚', name: 'fairy' },
];
export const EGG_NEEDS = 4; // finished games per egg
export const isGoldenEgg = (hatchedCount) => hatchedCount % 4 === 3;

const get = () => store.get();
export const foundSecrets = () => (get().secrets || []).filter((id) => secretById(id));
export const hasSecret = (id) => foundSecrets().includes(id);

/** Marks a secret found. Returns the list of newly found secrets (the last one may be "all"), or []. */
export function findSecret(id) {
  if (!secretById(id) || hasSecret(id)) return [];
  const list = [...foundSecrets(), id];
  const out = [secretById(id)];
  if (!list.includes('all') && SECRETS.every((s) => s.id === 'all' || list.includes(s.id))) { list.push('all'); out.push(secretById('all')); }
  store.set({ secrets: list });
  return out;
}

export const hatsOwned = () => HATS.filter((h) => h.id === 'bow' || foundSecrets().some((id) => secretById(id).reward.hat === h.id));
export function powersOwned(owned = []) {
  return POWERS.filter((p) => (p.legendary && owned.includes(p.legendary)) || foundSecrets().some((id) => secretById(id).reward.power === p.id));
}
export const treasuresOwned = () => TREASURES.filter((t) => foundSecrets().some((id) => secretById(id).reward.treasure === t.emoji));
export const allCreatures = () => [...HATCHLINGS, ...LEGENDARY_HATCHLINGS];
export const creatureName = (e) => allCreatures().find((c) => c.emoji === e)?.name;
export const isLegendaryCreature = (e) => LEGENDARY_HATCHLINGS.some((c) => c.emoji === e);

/** The magic egg: how far along it is. */
export function eggState() {
  const hatched = get().hatched || [];
  const golden = isGoldenEgg(hatched.length);
  const pool = (golden ? LEGENDARY_HATCHLINGS : HATCHLINGS).filter((c) => !hatched.includes(c.emoji));
  const done = pool.length === 0 && allCreatures().every((c) => hatched.includes(c.emoji));
  const n = Math.min(get().eggN || 0, EGG_NEEDS);
  return { n, need: EGG_NEEDS, ready: !done && n >= EGG_NEEDS, golden, done, hatched };
}

/** One finished game warms the egg. Returns true when this game made it ready to hatch. */
export function warmEgg() {
  const e = eggState();
  if (e.done || e.ready) return false;
  store.set({ eggN: e.n + 1 });
  return e.n + 1 >= EGG_NEEDS;
}

/** Hatch it: returns the creature (and marks it), or null if the egg isn't ready. */
export function hatchEgg(rng = Math.random) {
  const e = eggState();
  if (!e.ready) return null;
  let pool = (e.golden ? LEGENDARY_HATCHLINGS : HATCHLINGS).filter((c) => !e.hatched.includes(c.emoji));
  if (!pool.length) pool = allCreatures().filter((c) => !e.hatched.includes(c.emoji));
  if (!pool.length) return null;
  const c = pool[Math.floor(rng() * pool.length) % pool.length];
  store.set({ hatched: [...e.hatched, c.emoji], eggN: 0, newest: c.emoji });
  return { ...c, golden: e.golden };
}

/** Lines the voice says when a secret is found (clips exist for all of these). */
export function rewardLine(secret) {
  const r = secret.reward;
  if (r.hat) return `Pip got ${withA(hatById(r.hat).name)}!`;
  if (r.power) return `New magic: ${powerById(r.power).name}!`;
  return `${cap(withA(TREASURES.find((t) => t.emoji === r.treasure).name))} for your world!`;
}
const withA = (n) => (/^[aeiou]/.test(n) ? `an ${n}` : `a ${n}`);
const cap = (s) => s[0].toUpperCase() + s.slice(1);
