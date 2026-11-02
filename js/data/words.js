// Shared picture words, one per letter. Each must clearly start with its letter
// when a child names it. Q and X have no picture a 5-year-old would name that way
// (👸 reads as "princess", 🦊 is "fox"), so they're only ever wrong-answer choices.
export const WORDS = {
  A: ['apple', '🍎'], B: ['banana', '🍌'], C: ['cat', '🐱'], D: ['dog', '🐶'], E: ['egg', '🥚'],
  F: ['fish', '🐟'], G: ['grapes', '🍇'], H: ['hat', '🎩'], I: ['ice cream', '🍦'], J: ['juice', '🧃'],
  K: ['kite', '🪁'], L: ['lion', '🦁'], M: ['moon', '🌙'], N: ['nose', '👃'], O: ['octopus', '🐙'],
  P: ['pig', '🐷'], R: ['rainbow', '🌈'], S: ['sun', '☀️'], T: ['tiger', '🐯'],
  U: ['umbrella', '☂️'], V: ['volcano', '🌋'], W: ['whale', '🐳'], Y: ['yo-yo', '🪀'], Z: ['zebra', '🦓'],
};

export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

/** Answer choices grow by one every two levels, up to max. */
export function choiceCount(level, min, max) {
  return Math.min(min + Math.floor((level - 1) / 2), max);
}
