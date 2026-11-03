// Greater or Less — which number is greater, which is less, and which sign goes in the box (> < =).
// The signs get a hint: the hungry alligator's mouth opens toward the bigger number.
import { el, pick, rand, shuffle } from '../core/util.js';

// t: 'greater' | 'less' (pick a number) | 'sign' (numbers) | 'groups' (pictures). eq: "=" is a possible answer.
const LEVELS = [
  [{ t: 'greater', max: 10 }, { t: 'less', max: 10 }, { t: 'sign', max: 10 }],                                   // First Steps
  [{ t: 'greater', max: 20 }, { t: 'sign', max: 10 }, { t: 'sign', max: 20, eq: true }, { t: 'groups', max: 10, eq: true }], // Growing Strong
  [{ t: 'sign', max: 20, eq: true }, { t: 'groups', max: 12, eq: true }, { t: 'sign', max: 30, eq: true }],      // Super Star
];
const THINGS = ['🍎', '⭐', '🐟', '🌸', '🐞', '🍪', '🎈', '🐸'];
const SIGN_WORD = { '>': 'is greater than', '<': 'is less than', '=': 'is equal to' };
const signFor = (a, b) => (a > b ? '>' : a < b ? '<' : '=');

export default {
  id: 'compare',
  title: 'Greater or Less',
  emoji: '🐊',
  color: '#06a77d',
  blurb: 'Which is more? Which sign fits?',
  rounds: 8,
  maxLevels: LEVELS.map((l) => l.length),

  makeRound(level, history, difficulty = 1) {
    const set = LEVELS[difficulty] || LEVELS[1];
    const cfg = set[Math.min(level, set.length) - 1];
    const min = cfg.t === 'groups' ? 1 : 0;
    let a, b, key;
    do {
      a = min + rand(cfg.max - min + 1);
      b = min + rand(cfg.max - min + 1);
      if (cfg.eq && Math.random() < 0.2) b = a;
      if (!cfg.eq && a === b) b = a === cfg.max ? a - 1 : a + 1;
      key = `${cfg.t}:${a}:${b}`;
    } while ((a === b && !cfg.eq) || history.slice(-5).includes(key));

    const big = Math.max(a, b);
    const small = Math.min(a, b);

    if (cfg.t === 'greater' || cfg.t === 'less') {
      const want = cfg.t === 'greater' ? big : small;
      const word = cfg.t === 'greater' ? 'greater' : 'less';
      return {
        key,
        text: `Which number is ${word}?`,
        say: [`Which number is ${word}?`],
        retrySay: [`Which number is ${word}?`],
        choices: shuffle([a, b]).map((n) => ({ label: String(n), correct: n === want, className: 'number' })),
        reveal: { emoji: cfg.t === 'greater' ? '⬆️' : '⬇️', caption: `${big} is greater than ${small}` },
        praise: ['Yes!', `${big} is greater than ${small}.`],
      };
    }

    const sign = signFor(a, b);
    const signs = cfg.eq ? ['>', '<', '='] : ['>', '<'];
    const emoji = pick(THINGS);
    const box = el('span', { class: 'sign-box' }, '?');
    return {
      key,
      text: 'Which sign goes in the box?',
      say: cfg.t === 'groups'
        ? ['Count each group.', 'Which sign goes in the box?']
        : ['Which sign goes in the box?', `${a}.`, 'box.', `${b}.`],
      retrySay: ['Which sign goes in the box?'],
      choices: signs.map((s) => ({ label: s, correct: s === sign, className: 'sign' })),
      render(v) {
        const side = (n) => (cfg.t === 'groups'
          ? el('div', { class: 'group' }, Array.from({ length: n }, () => el('span', {}, emoji)))
          : el('div', { class: 'num' }, String(n)));
        v.append(el('div', { class: `compare${cfg.t === 'groups' ? ' groups' : ''}` }, side(a), box, side(b)));
      },
      onMiss(v) {
        if (v.querySelector('.gator')) return;
        v.append(el('div', { class: 'gator' }, '🐊 The hungry alligator opens his mouth to eat the bigger number!'));
      },
      reveal: { emoji: '🐊', caption: `${a} ${sign} ${b}` },
      praise: ['Yes!', `${a} ${SIGN_WORD[sign]} ${b}.`],
    };
  },
};
