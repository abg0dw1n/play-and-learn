// Word lists for the reading games. Every word has a picture a 5-year-old would name that way.
// [word, emoji]
export const WORDS3 = [
  ['cat', '🐱'], ['dog', '🐶'], ['pig', '🐷'], ['sun', '☀️'], ['hat', '🎩'], ['bus', '🚌'],
  ['bed', '🛏️'], ['fox', '🦊'], ['bat', '🦇'], ['bug', '🐛'], ['hen', '🐔'], ['web', '🕸️'],
  ['van', '🚐'], ['box', '📦'], ['log', '🪵'], ['ant', '🐜'], ['map', '🗺️'], ['nut', '🥜'],
  ['leg', '🦵'], ['pen', '🖊️'], ['gem', '💎'], ['rat', '🐀'],
];
export const WORDS4 = [
  ['frog', '🐸'], ['fish', '🐟'], ['duck', '🦆'], ['crab', '🦀'], ['star', '⭐'], ['moon', '🌙'],
  ['tree', '🌳'], ['boat', '⛵'], ['cake', '🎂'], ['bird', '🐦'], ['ship', '🚢'], ['drum', '🥁'],
  ['bell', '🔔'], ['milk', '🥛'], ['kite', '🪁'], ['book', '📖'], ['hand', '✋'], ['ring', '💍'],
  ['rain', '🌧️'], ['sock', '🧦'], ['bear', '🐻'], ['lion', '🦁'], ['ball', '⚽'], ['bone', '🦴'],
  ['corn', '🌽'], ['rose', '🌹'], ['door', '🚪'], ['nest', '🪺'],
];
export const WORDS5 = [
  ['apple', '🍎'], ['horse', '🐴'], ['tiger', '🐯'], ['zebra', '🦓'], ['snake', '🐍'], ['house', '🏠'],
  ['plane', '✈️'], ['train', '🚂'], ['truck', '🚚'], ['whale', '🐳'], ['shark', '🦈'], ['mouse', '🐭'],
  ['clock', '⏰'], ['cloud', '☁️'], ['bread', '🍞'], ['pizza', '🍕'], ['lemon', '🍋'], ['grape', '🍇'],
  ['eagle', '🦅'], ['sheep', '🐑'], ['spoon', '🥄'], ['heart', '❤️'], ['camel', '🐫'], ['bunny', '🐰'],
  ['robot', '🤖'],
];
export const BY_LENGTH = { 3: WORDS3, 4: WORDS4, 5: WORDS5 };
export const ALL_WORDS = [...WORDS3, ...WORDS4, ...WORDS5];

export const VOWELS = ['a', 'e', 'i', 'o', 'u'];
export const LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');
