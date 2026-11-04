// Heavy or Light — compare how much things weigh. Early levels pick a very heavy thing against a
// very light one; later levels need closer comparisons and ordering three things.
import { el, pick, shuffle } from '../core/util.js';

// [emoji, name, rough weight in kg] — chosen so every comparison below has a clear winner.
const ITEMS = [
  ['🪶', 'feather', 0.001], ['🦋', 'butterfly', 0.002], ['🎈', 'balloon', 0.005], ['🐭', 'mouse', 0.03],
  ['🍎', 'apple', 0.2], ['🧸', 'teddy bear', 0.5], ['🐱', 'cat', 4], ['🍉', 'watermelon', 6], ['🐶', 'dog', 25],
  ['🐑', 'sheep', 80], ['🐻', 'bear', 300], ['🐄', 'cow', 600], ['🦒', 'giraffe', 1200], ['🚗', 'car', 1500],
  ['🐘', 'elephant', 5000], ['🚌', 'bus', 12000], ['🐳', 'whale', 100000],
];
const an = (name) => (/^[aeiou]/.test(name) ? `an ${name}` : `a ${name}`);
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// n things, which to pick, and how different they must be (each is at least `min` times heavier than the next).
const LEVELS = [
  [{ n: 2, dir: 'heavier', min: 100 }, { n: 2, dir: 'lighter', min: 100 }, { n: 2, dir: 'heavier', min: 20 }],            // First Steps
  [{ n: 2, dir: 'heavier', min: 20 }, { n: 2, dir: 'lighter', min: 10 }, { n: 3, dir: 'heaviest', min: 8 }, { n: 3, dir: 'lightest', min: 8 }], // Growing Strong
  [{ n: 2, dir: 'either', min: 5 }, { n: 3, dir: 'heaviest', min: 5 }, { n: 3, dir: 'lightest', min: 5 }],               // Super Star
];

/** Pick n items in a random order where each is at least `min` times heavier than the next lighter one. */
function pickItems(n, min) {
  for (let tries = 0; tries < 200; tries++) {
    const got = shuffle(ITEMS).slice(0, n).sort((x, y) => x[2] - y[2]);
    if (got.every((it, i) => i === 0 || it[2] / got[i - 1][2] >= min)) return got; // lightest → heaviest
  }
  // Always valid: feather < dog < whale (each thousands of times heavier than the last).
  const dog = ITEMS.find((it) => it[1] === 'dog');
  return n === 3 ? [ITEMS[0], dog, ITEMS[ITEMS.length - 1]] : [ITEMS[0], ITEMS[ITEMS.length - 1]];
}

export default {
  id: 'weight',
  title: 'Heavy or Light',
  emoji: '⚖️',
  color: '#3a86ff',
  blurb: 'Which weighs more? Which weighs less?',
  rounds: 8,
  maxLevels: LEVELS.map((l) => l.length),

  makeRound(level, history, difficulty = 1) {
    const set = LEVELS[difficulty] || LEVELS[1];
    const cfg = set[Math.min(level, set.length) - 1];
    const dir = cfg.dir === 'either' ? pick(['heavier', 'lighter']) : cfg.dir;
    let items, key;
    do {
      items = pickItems(cfg.n, cfg.min);
      key = items.map((i) => i[1]).sort().join('/') + dir;
    } while (history.slice(-4).includes(key));

    const heavy = items[items.length - 1];
    const light = items[0];
    const wantHeavy = dir === 'heavier' || dir === 'heaviest';
    const answer = wantHeavy ? heavy : light;
    const question = { heavier: 'Which one is heavier?', lighter: 'Which one is lighter?',
      heaviest: 'Which one is the heaviest?', lightest: 'Which one is the lightest?' }[dir];
    const other = wantHeavy ? light : heavy;

    return {
      key,
      text: question,
      say: [question],
      retrySay: [question],
      choices: shuffle(items).map((it) => ({ label: it[0], correct: it === answer, className: 'pic' })),
      render(v) { v.append(el('div', { class: 'word-pic' }, el('span', { class: 'word-emoji' }, '⚖️'))); },
      reveal: {
        emoji: `${answer[0]} ${wantHeavy ? '▶' : '◀'} ${other[0]}`,
        caption: cfg.n === 2
          ? `${cap(an(answer[1]))} is ${dir === 'either' ? (wantHeavy ? 'heavier' : 'lighter') : dir} than ${an(other[1])}!`
          : `${cap(an(answer[1]))} is the ${wantHeavy ? 'heaviest' : 'lightest'}!`,
      },
      praise: ['Yes!', cfg.n === 2
        ? [cap(an(answer[1])), wantHeavy ? 'is heavier than' : 'is lighter than', `${an(other[1])}.`]
        : [cap(an(answer[1])), wantHeavy ? 'is the heaviest.' : 'is the lightest.']],
    };
  },
};
