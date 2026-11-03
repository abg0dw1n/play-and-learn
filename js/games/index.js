// Every game on the home screen. To add one: create js/games/<name>.js and list it here.
// (Games she has outgrown live in js/games/archive/ — not listed, but kept in case they're wanted again.)
import spell from './spell.js';
import read from './read.js';
import sight from './sight.js';
import story from './story.js';
import compare from './compare.js';
import weight from './weight.js';
import addsub from './addsub.js';
import sounds from './sounds.js';

export const games = [spell, read, sight, story, addsub, compare, weight, sounds];

// Shown greyed-out on the home screen until they're built. (My Worksheets is a real tile now.)
export const comingSoon = [];

// The home screen shows these "worlds"; each one opens a page with its games.
export const worlds = [
  { id: 'reading', title: 'Reading World', emoji: '📖', color: '#ff6fb5', say: 'Reading World. Pick a game!', games: ['spell', 'read', 'sight', 'story', 'sounds'] },
  { id: 'math', title: 'Math World', emoji: '🔢', color: '#4d96ff', say: 'Math World. Pick a game!', games: ['addsub', 'compare', 'weight'] },
];
export const worldOf = (gameId) => worlds.find((w) => w.games.includes(gameId))?.id;
