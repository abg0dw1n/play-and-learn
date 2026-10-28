// Every game on the home screen. To add one: create js/games/<name>.js and list it here.
import letters from './letters.js';
import counting from './counting.js';

export const games = [letters, counting];

// Shown greyed-out on the home screen until they're built.
export const comingSoon = [
  { id: 'worksheets', title: 'My Worksheets', emoji: '📄', blurb: 'Coming soon' },
];
