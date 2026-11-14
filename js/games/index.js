// Every game on the home screen. To add one: create js/games/<name>.js and list it here.
import spell from './spell.js';
import read from './read.js';
import sight from './sight.js';
import story from './story.js';
import compare from './compare.js';
import weight from './weight.js';
import addsub from './addsub.js';
import tictactoe from './tictactoe.js';
import memory from './memory.js';
import pop from './pop.js';
import sounds from './sounds.js';

export const games = [spell, read, sight, story, addsub, compare, weight, tictactoe, memory, pop, sounds];

// Shown greyed-out on the home screen until they're built. (My Worksheets is a real tile now.)

// The home screen shows these "worlds"; each one opens a page with its games.
export const worlds = [
  { id: 'reading', title: 'Reading World', emoji: '📖', color: '#ff6fb5', say: 'Reading World. Pick a game!', games: ['spell', 'read', 'sight', 'story', 'sounds'] },
  { id: 'math', title: 'Math World', emoji: '🔢', color: '#4d96ff', say: 'Math World. Pick a game!', games: ['addsub', 'compare', 'weight'] },
  { id: 'fun', title: 'Fun World', emoji: '🎈', color: '#ff9f1c', say: 'Fun World. Pick a game!', games: ['tictactoe', 'memory', 'pop'],
    links: [{ emoji: '🖍️', title: 'Print & Color', blurb: 'Color-by, mazes, word search', hash: '#/print', color: '#ff9f1c' }] },
];
export const worldOf = (gameId) => worlds.find((w) => w.games.includes(gameId))?.id;
