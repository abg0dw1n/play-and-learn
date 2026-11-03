// Add & Take Away — adding and subtracting, starting with pictures you can count and moving to numbers only.
// Every question and answer is a whole recorded sentence ("What is 3 plus 2?"), which sounds far more natural than stitched words.
import { el, pick, rand, shuffle } from '../core/util.js';

// Every step mixes adding and taking away (they alternate). pics: show objects (otherwise just the number sentence).
const STEPS = [
  { max: 5, pics: true },    // 1  adding and taking away, with pictures to count
  { max: 5, pics: false },   // 2  the same, numbers only (pictures appear as a hint after a miss)
  { max: 10, pics: true },   // 3
  { max: 10, pics: false },  // 4
  { max: 20, pics: false },  // 5
];
// First Steps: steps 1–2.  Growing Strong: 1–4.  Super Star: 3–5.
const START = [0, 0, 2];
const COUNT = [2, 4, 3];
const THINGS = ['🍎', '⭐', '🐟', '🌸', '🐞', '🍪', '🎈', '🐸', '🍓', '🚗'];
const SIGN = { '+': '+', '-': '−' };
const WORD = { '+': 'plus', '-': 'minus' };

function group(n, emoji, crossed = 0) {
  return el('div', { class: 'eq-group' }, Array.from({ length: n }, (_, i) =>
    el('span', { class: `eq-item${i >= n - crossed ? ' gone' : ''}` }, emoji)));
}

function drawPics(v, a, b, op, emoji) {
  if (op === '+') v.append(el('div', { class: 'eq-row' }, group(a, emoji), el('span', { class: 'eq-sign' }, '+'), group(b, emoji)));
  else v.append(el('div', { class: 'eq-row' }, group(a, emoji, b)));
}

export default {
  id: 'addsub',
  title: 'Add & Take Away',
  emoji: '➕',
  color: '#ff6f61',
  blurb: 'Put together and take away',
  rounds: 8,
  maxLevels: COUNT,

  makeRound(level, history, difficulty = 1) {
    const step = STEPS[START[difficulty] + Math.min(level, COUNT[difficulty]) - 1];
    let op, a, b, c, key;
    do {
      // alternate between adding and taking away
      const last = history[history.length - 1];
      op = last ? (last.includes('+') ? '-' : '+') : pick(['+', '-']);
      if (op === '+') {
        // pictures: both groups at least 1; numbers: allow a few "add zero / doubles"
        a = 1 + rand(step.max - 1);
        b = 1 + rand(step.max - a);
        c = a + b;
      } else {
        a = 2 + rand(step.max - 1);
        b = 1 + rand(a);          // may take all of them away (answer 0)
        c = a - b;
      }
      key = `${a}${op}${b}`;
    } while (history.slice(-8).includes(key));

    const emoji = pick(THINGS);
    const text = `${a} ${SIGN[op]} ${b} = ?`;
    // Wrong answers close to the right one (and the "wrong operation" answer), kept sensible.
    const cap = Math.max(step.max, c + 2);
    const swapped = op === '+' ? Math.abs(a - b) : a + b;
    const pool = shuffle([c + 1, c - 1, c + 2, c - 2, swapped, a, b]).filter((n, i, arr) => n !== c && n >= 0 && n <= cap && arr.indexOf(n) === i);
    const near = pool.sort((x, y) => Math.abs(x - c) - Math.abs(y - c));
    const wrong = [near[0], near[1] ?? (c + 3)];
    const say = [`What is ${a} ${WORD[op]} ${b}?`];

    return {
      key,
      text,
      say,
      retrySay: say,
      choices: shuffle([c, ...wrong]).map((n) => ({ label: String(n), correct: n === c, className: 'number' })),
      render(v) {
        if (step.pics) drawPics(v, a, b, op, emoji);
        else v.append(el('div', { class: 'eq-big' }, `${a} ${SIGN[op]} ${b}`));
      },
      onMiss(v, misses) {
        // After a miss on a numbers-only question, show the pictures to count.
        if (!step.pics && !v.querySelector('.eq-clue')) {
          const clue = el('div', { class: 'eq-clue' });
          drawPics(clue, a, b, op, emoji);
          v.append(clue);
        }
      },
      reveal: { emoji: step.pics ? emoji : '✅', caption: `${a} ${SIGN[op]} ${b} = ${c}` },
      praise: ['Yes!', `${a} ${WORD[op]} ${b} equals ${c}.`],
    };
  },
};
