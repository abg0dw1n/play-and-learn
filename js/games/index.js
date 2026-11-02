// Every game on the home screen. To add one: create js/games/<name>.js and list it here.
import letters from './letters.js';
import sounds from './sounds.js';
import counting from './counting.js';
import rhymes from './rhymes.js';

export const games = [letters, sounds, counting, rhymes];

// Shown greyed-out on the home screen until they're built.
export const comingSoon = [
  { id: 'worksheets', title: 'My Worksheets', emoji: '📄', blurb: 'Coming soon' },
];
