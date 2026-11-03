// Read the Word — a word is shown (no voice reading it!); sound it out and tap the matching picture.
// Level 1 shows the letters spaced and coloured to help her blend; later words are plain, longer,
// and the wrong pictures start to look-alike (same first letter).
import { el, pick, shuffle } from '../core/util.js';
import { BY_LENGTH, ALL_WORDS } from '../data/reading.js';

// Per difficulty, per level: word length, number of pictures, spaced letters, wrong pictures share the first letter.
const LEVELS = [
  [{ len: 3, n: 2, spaced: true }, { len: 3, n: 3, spaced: true }, { len: 3, n: 3, similar: true }],     // First Steps
  [{ len: 3, n: 3, similar: true }, { len: 4, n: 3, spaced: true }, { len: 4, n: 4, similar: true }, { len: 5, n: 4 }], // Growing Strong
  [{ len: 4, n: 4, similar: true }, { len: 5, n: 4, similar: true }, { len: 5, n: 5, similar: true }],  // Super Star
];
const COLORS = ['#e63946', '#2f7de1', '#2a9d4a', '#9b5de5', '#f4a100'];

export default {
  id: 'read',
  title: 'Read the Word',
  emoji: '📖',
  color: '#2a9d8f',
  blurb: 'Sound it out and find the picture',
  rounds: 8,
  maxLevels: LEVELS.map((l) => l.length),

  makeRound(level, history, difficulty = 1) {
    const set = LEVELS[difficulty] || LEVELS[1];
    const cfg = set[Math.min(level, set.length) - 1];
    const list = BY_LENGTH[cfg.len];
    let entry;
    do { entry = pick(list); } while (history.slice(-4).includes(entry[0]));
    const [word, emoji] = entry;

    // Wrong pictures: never the same picture, and never a word that starts AND ends the same
    // way as the answer's (keeps each round to one clear answer).
    const pool = shuffle(ALL_WORDS.filter(([w, e]) => w !== word && e !== emoji));
    const sameStart = pool.filter(([w]) => w[0] === word[0]);
    const others = [];
    for (const o of cfg.similar ? [...sameStart, ...pool] : pool) {
      if (others.length === cfg.n - 1) break;
      if (!others.includes(o)) others.push(o);
    }

    return {
      key: word,
      text: 'Read the word',
      say: ['Sound it out.', 'Which picture matches this word?'],
      retrySay: 'Sound it out. Which picture matches?',
      choices: shuffle([[word, emoji], ...others]).map(([w, e]) => ({ label: e, correct: w === word, className: 'pic' })),
      render(v) {
        const letters = [...word].map((l, i) => el('span', { class: 'rw-letter', style: cfg.spaced ? { color: COLORS[i % COLORS.length] } : {} }, l));
        v.append(el('div', { class: `read-word${cfg.spaced ? ' spaced' : ''}` }, letters));
      },
      reveal: { emoji, caption: `${[...word].join(' ')}  —  ${word}!` },
      praise: ['Yes!', `${word}!`],
    };
  },
};
