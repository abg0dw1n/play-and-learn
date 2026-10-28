// Letter Hunt — hear a letter, tap it. Levels: 3 capitals → 4 capitals → 3 lowercase → 4 lowercase.
import { el, pick, shuffle } from '../core/util.js';

const WORDS = {
  A: ['apple', '🍎'], B: ['ball', '⚽'], C: ['cat', '🐱'], D: ['dog', '🐶'], E: ['egg', '🥚'],
  F: ['fish', '🐟'], G: ['grapes', '🍇'], H: ['hat', '🎩'], I: ['ice cream', '🍦'], J: ['juice', '🧃'],
  K: ['kite', '🪁'], L: ['lion', '🦁'], M: ['moon', '🌙'], N: ['nose', '👃'], O: ['octopus', '🐙'],
  P: ['pig', '🐷'], Q: ['queen', '👸'], R: ['rainbow', '🌈'], S: ['sun', '☀️'], T: ['tiger', '🐯'],
  U: ['umbrella', '☂️'], V: ['volcano', '🌋'], W: ['whale', '🐳'], X: ['fox', '🦊'], Y: ['yo-yo', '🪀'],
  Z: ['zebra', '🦓'],
};
const LETTERS = Object.keys(WORDS);

export default {
  id: 'letters',
  title: 'Letter Hunt',
  emoji: '🔤',
  color: '#ff7a59',
  blurb: 'Find the letter you hear',
  rounds: 8,
  maxLevel: 4,

  makeRound(level, history) {
    const lower = level >= 3;
    const count = level % 2 === 0 ? 4 : 3;
    const recent = history.slice(-4);
    let target;
    do { target = pick(LETTERS); } while (recent.includes(target));

    const others = shuffle(LETTERS.filter((l) => l !== target)).slice(0, count - 1);
    const show = (l) => (lower ? l.toLowerCase() : l);
    const [word, emoji] = WORDS[target];
    const caption = target === 'X' ? `X is in ${word}` : `${show(target)} is for ${word}`;

    return {
      key: target,
      text: lower ? 'Find the little letter!' : 'Find the letter!',
      say: lower ? `Find the little letter ${target}.` : `Find the letter ${target}.`,
      choices: shuffle([target, ...others]).map((l) => ({ label: show(l), correct: l === target, className: 'letter' })),
      render: (v) => v.append(el('div', { class: 'ear' }, '👂')),
      reveal: { emoji, caption },
      praise: target === 'X' ? `Yes! X is in ${word}!` : `Yes! ${target} is for ${word}!`,
    };
  },
};
