// Build a Word — hear a word, see its picture, and tap the letters in order to spell it.
// Short sounded-out words first (cat), then longer ones (frog, apple).
import { el, pick, shuffle } from '../core/util.js';
import { BY_LENGTH, LOWER, VOWELS } from '../data/reading.js';

// Per difficulty, one entry per level: word length and how many letters to choose from.
const LEVELS = [
  [{ len: 3, n: 3 }, { len: 3, n: 4 }, { len: 4, n: 4 }],                       // First Steps
  [{ len: 3, n: 4 }, { len: 4, n: 4 }, { len: 4, n: 5 }, { len: 5, n: 5 }],     // Growing Strong
  [{ len: 4, n: 5 }, { len: 5, n: 5 }, { len: 5, n: 5 }],                       // Super Star
];

/** The letters to choose from for one spot: the right one plus look-alike wrong ones. */
function lettersFor(correct, n) {
  // A vowel spot gets other vowels as wrong choices, so she has to know the vowel, not just guess.
  const pool = VOWELS.includes(correct) ? [...VOWELS, ...LOWER] : LOWER.filter((l) => !VOWELS.includes(l) || Math.random() < 0.25);
  const wrong = [];
  for (const l of shuffle(pool)) {
    if (wrong.length === n - 1) break;
    if (l !== correct && !wrong.includes(l)) wrong.push(l);
  }
  return shuffle([correct, ...wrong]).map((l) => ({ label: l, correct: l === correct, className: 'letter' }));
}

export default {
  id: 'spell',
  title: 'Build a Word',
  emoji: '🧱',
  color: '#ff7a59',
  blurb: 'Tap the letters to spell it',
  rounds: 6,
  maxLevels: LEVELS.map((l) => l.length),

  makeRound(level, history, difficulty = 1) {
    const cfg = (LEVELS[difficulty] || LEVELS[1])[Math.min(level, (LEVELS[difficulty] || LEVELS[1]).length) - 1];
    const list = BY_LENGTH[cfg.len];
    let entry;
    do { entry = pick(list); } while (history.slice(-4).includes(entry[0]) && list.length > 5);
    const [word, emoji] = entry;
    let pos = 0;

    const slots = el('div', { class: 'slots' });
    const draw = () => {
      slots.innerHTML = '';
      [...word].forEach((l, i) => slots.append(el('span', { class: `slot${i < pos ? ' filled' : i === pos ? ' now' : ''}` }, i < pos ? l : '')));
    };
    draw();

    return {
      key: word,
      text: 'Spell the word!',
      // Getters: what's said depends on which letter she's up to (also for 🔊 and after a miss).
      get say() { return pos === 0 ? [`Let's spell ${word}.`, `${word}.`, 'What is the first letter?'] : [`${word}.`, 'What letter comes next?']; },
      get retrySay() { return [`${word}.`, pos === 0 ? 'What is the first letter?' : 'What letter comes next?']; },
      choices: lettersFor(word[0], cfg.n),
      render(v) {
        v.append(el('div', { class: 'spell-box' }, el('div', { class: 'word-emoji' }, emoji), slots));
      },
      advance() {
        pos++;
        draw();
        if (pos >= word.length) return null;
        return { choices: lettersFor(word[pos], cfg.n), say: pos === word.length - 1 ? 'And the last letter?' : 'What letter comes next?' };
      },
      reveal: { emoji, caption: [...word].join(' ') + `  —  ${word}!` },
      praise: ['Yes!', `${[...word].join(', ')}.`, `${word}!`],
    };
  },
};
