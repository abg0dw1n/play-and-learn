// What My World is made of: collections (sets of 5), places to unlock, decorations from gift boxes,
// and how each friend behaves (how it idles, what it does and sounds like when tapped).
// Plain data and small pure helpers, so it can be tested in Node.

/** Eight collections that together cover all 40 everyday stickers. Finishing one adds its bonus decoration to her world. */
export const SETS = [
  { id: 'pets', name: 'pets', icon: '🐶', members: ['🐶', '🐱', '🐰', '🐢', '🐸'], bonus: { emoji: '🏡', name: 'cozy house' } },
  { id: 'wild', name: 'wild animals', icon: '🦁', members: ['🦁', '🐼', '🐨', '🦒', '🐘'], bonus: { emoji: '🪵', name: 'log' } },
  { id: 'ocean', name: 'ocean', icon: '🐬', members: ['🐙', '🐬', '🐳', '🦀', '🐧'], bonus: { emoji: '🐚', name: 'shell' } },
  { id: 'garden', name: 'garden', icon: '🦋', members: ['🦋', '🐝', '🐞', '🌸', '🌻'], bonus: { emoji: '🌺', name: 'hibiscus' } },
  { id: 'sky', name: 'sky', icon: '🌈', members: ['🌈', '⭐', '🌙', '☀️', '🎈'], bonus: { emoji: '☁️', name: 'cloud' } },
  { id: 'yummy', name: 'yummy', icon: '🍦', members: ['🍓', '🍉', '🧁', '🍦', '🍩'], bonus: { emoji: '🍭', name: 'lollipop' } },
  { id: 'fairy', name: 'fairy tale', icon: '🦄', members: ['🦄', '👑', '🏰', '🎀', '🎠'], bonus: { emoji: '🪄', name: 'magic wand' } },
  { id: 'adventure', name: 'adventure', icon: '🚀', members: ['🦖', '🦊', '🦩', '🚀', '🚒'], bonus: { emoji: '🚩', name: 'flag' } },
];
export const setOf = (emoji) => SETS.find((s) => s.members.includes(emoji)) || null;
export const setCount = (set, have) => set.members.filter((e) => have.includes(e)).length;
export const setsDone = (have) => SETS.filter((s) => setCount(s, have) === s.members.length);
/** The set a sticker just completed (given the stickers she had before and the new one), or null. */
export const completedBy = (emoji, before) => {
  const set = setOf(emoji);
  return set && setCount(set, before) < set.members.length && setCount(set, [...before, emoji]) === set.members.length ? set : null;
};

/** Places for her world. `at` = how many stickers (everyday + rare) unlock it. Space is always night. */
export const SCENES = [
  { id: 'meadow', name: 'meadow', icon: '🌳', at: 0 },
  { id: 'beach', name: 'beach', icon: '🏖️', at: 6 },
  { id: 'space', name: 'space', icon: '🪐', at: 12 },
  { id: 'snow', name: 'snow', icon: '⛄', at: 20 },
  { id: 'candy', name: 'candy land', icon: '🍭', at: 30 },
];
export const sceneById = (id) => SCENES.find((s) => s.id === id) || SCENES[0];
export const unlockedScenes = (total) => SCENES.filter((s) => total >= s.at);
export const nextScene = (total) => SCENES.find((s) => total < s.at) || null;

/** Decorations that come out of gift boxes (placeable, but not stickers). */
export const DECOR = [
  { emoji: '🌳', name: 'tree' }, { emoji: '🌲', name: 'pine tree' }, { emoji: '🌴', name: 'palm tree' }, { emoji: '🍄', name: 'mushroom' },
  { emoji: '🌷', name: 'tulip' }, { emoji: '🌼', name: 'daisy' }, { emoji: '🏠', name: 'house' }, { emoji: '⛲', name: 'fountain' },
  { emoji: '🪁', name: 'kite' }, { emoji: '🧸', name: 'teddy bear' }, { emoji: '⛺', name: 'tent' }, { emoji: '🌵', name: 'cactus' },
  { emoji: '🎡', name: 'ferris wheel' }, { emoji: '⛱️', name: 'umbrella' },
];
export const BONUS_DECOR = SETS.map((s) => s.bonus);
export const decorName = (emoji) => [...DECOR, ...BONUS_DECOR].find((d) => d.emoji === emoji)?.name || '';

/** Things in the sky stay up there; everything else stands on the ground. */
export const SKY = new Set(['🌈', '⭐', '🌙', '☀️', '🎈', '🚀', '🦋', '🐝', '🎀', '🌠', '🪐', '🐦', '🐉', '🪁', '☁️', '🧞', '🦜', '🧚', '🐲']);

// idle: how it moves on its own (CSS class idle-<x>).  tap: what it does when tapped (tap-<x>).  sound: see sfx.critter().
const b = (idle, tap, sound) => ({ idle, tap, sound });
export const BEHAVIOR = {
  '🦄': b('bob', 'jump', 'sparkle'), '🐶': b('hop', 'jump', 'bark'), '🐱': b('bob', 'jump', 'meow'), '🦁': b('bob', 'shake', 'roar'),
  '🐼': b('bob', 'spin', 'squeak'), '🐨': b('sway', 'wiggle', 'squeak'), '🐸': b('hop', 'jump', 'ribbit'), '🐙': b('sway', 'wiggle', 'bubble'),
  '🦋': b('flutter', 'zoom', 'sparkle'), '🐢': b('crawl', 'shake', 'boing'), '🐬': b('leap', 'jump', 'dolphin'), '🦖': b('bob', 'shake', 'roar'),
  '🐧': b('sway', 'jump', 'squeak'), '🦊': b('bob', 'jump', 'yip'), '🐰': b('hop', 'jump', 'squeak'), '🐝': b('flutter', 'zoom', 'buzz'),
  '🐞': b('crawl', 'spin', 'boing'), '🦒': b('sway', 'wiggle', 'squeak'), '🐘': b('sway', 'shake', 'trumpet'), '🦩': b('sway', 'wiggle', 'chirp'),
  '🐳': b('swim', 'jump', 'whale'), '🦀': b('crawl', 'shake', 'click'), '🌈': b('pulse', 'grow', 'chime'), '⭐': b('twinkle', 'spin', 'sparkle'),
  '🌙': b('pulse', 'grow', 'chime'), '☀️': b('spin', 'grow', 'chime'), '🌸': b('sway', 'spin', 'pop'), '🌻': b('sway', 'jump', 'pop'),
  '🍓': b('bob', 'jump', 'pop'), '🍉': b('bob', 'jump', 'boing'), '🧁': b('bob', 'jump', 'pop'), '🍦': b('sway', 'jump', 'pop'),
  '🍩': b('bob', 'spin', 'boing'), '🎈': b('drift', 'zoom', 'squeak'), '🎀': b('pulse', 'spin', 'sparkle'), '👑': b('pulse', 'jump', 'chime'),
  '🚀': b('launch', 'zoom', 'whoosh'), '🚒': b('drive', 'shake', 'siren'), '🎠': b('bob', 'spin', 'chime'), '🏰': b('pulse', 'grow', 'chime'),
  // rare and legendary
  '💎': b('twinkle', 'spin', 'sparkle'), '🥇': b('pulse', 'grow', 'chime'), '🧩': b('bob', 'jump', 'pop'), '🦸': b('float', 'zoom', 'whoosh'),
  '🔥': b('flicker', 'grow', 'whoosh'), '🐦': b('flutter', 'jump', 'chirp'), '🎓': b('bob', 'jump', 'chime'), '🦉': b('bob', 'wiggle', 'hoot'),
  '🧠': b('pulse', 'jump', 'boing'), '🎯': b('pulse', 'spin', 'pop'), '🏆': b('pulse', 'grow', 'chime'), '🎪': b('sway', 'jump', 'chime'),
  '🐉': b('float', 'shake', 'roar'), '🌠': b('twinkle', 'zoom', 'sparkle'), '🪐': b('spin', 'grow', 'chime'), '🧞': b('float', 'zoom', 'sparkle'),
  '🦚': b('sway', 'spin', 'chime'),
};
// Egg creatures and treasures from secrets.
Object.assign(BEHAVIOR, {
  '🐣': b('hop', 'jump', 'chirp'), '🦔': b('crawl', 'spin', 'squeak'), '🦦': b('swim', 'wiggle', 'squeak'), '🐹': b('hop', 'jump', 'squeak'),
  '🦥': b('sway', 'wiggle', 'hoot'), '🦜': b('flutter', 'spin', 'chirp'), '🦢': b('swim', 'grow', 'chirp'), '🦭': b('bob', 'jump', 'bark'),
  '🐿️': b('hop', 'jump', 'squeak'), '🦘': b('leap', 'jump', 'boing'), '🐲': b('flutter', 'zoom', 'roar'), '🦕': b('sway', 'grow', 'trumpet'),
  '🧜‍♀️': b('swim', 'spin', 'sparkle'), '🧚': b('flutter', 'zoom', 'chime'), '💰': b('pulse', 'shake', 'chime'), '🏮': b('sway', 'grow', 'chime'),
  '🗺️': b('bob', 'wiggle', 'rustle'), '🪺': b('bob', 'jump', 'chirp'),
});
export const behaviorOf = (emoji) => BEHAVIOR[emoji] || b('bob', 'jump', 'pop'); // decorations just bob and pop

/** Part of the day, from her device's clock: the world follows it. */
export function phaseOf(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 10) return 'morning';
  if (h >= 10 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'sunset';
  return 'night';
}

/** Things Pip says when she taps him in her world. */
export const PIP_WORLD_LINES = ['Hello, friends!', 'Look at all your friends!', 'What a happy world!', 'I love it here!', 'Tap a friend to say hi!'];
