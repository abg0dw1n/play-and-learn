// Every game on the home screen. To add one: create js/games/<name>.js and list it here.
// (Games she has outgrown live in js/games/archive/ — not listed, but kept in case they're wanted again.)
import spell from './spell.js';
import read from './read.js';
import sight from './sight.js';
import story from './story.js';
import compare from './compare.js';
import weight from './weight.js';
import sounds from './sounds.js';

export const games = [spell, read, sight, story, compare, weight, sounds];

// Shown greyed-out on the home screen until they're built.
export const comingSoon = [
  { id: 'worksheets', title: 'My Worksheets', emoji: '📄', blurb: 'Coming soon' },
];
