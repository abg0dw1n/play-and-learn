// Letter Hunt — hear the word, find its letter.
// Difficulty: First Steps (2 caps, 2 choices), Growing Strong (3→4 caps/lowers, 3→4 choices), Super Star (3→4 caps/lowers, 4→5 choices)
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

// Difficulty configs: { maxLevel, minChoices, maxChoices, startLowerAtLevel }
const DIFF_CONFIG = {
  0: { maxLevel: 2, minChoices: 2, maxChoices: 2, startLowerAtLevel: 3 },  // First Steps
  1: { maxLevel: 4, minChoices: 3, maxChoices: 4, startLowerAtLevel: 3 },  // Growing Strong (current)
  2: { maxLevel: 6, minChoices: 4, maxChoices: 5, startLowerAtLevel: 3 },  // Super Star
};

export default {
  id: 'letters',
  title: 'Letter Hunt',
  emoji: '🔤',
  color: '#ff7a59',
  blurb: 'Find the letter you hear',
  rounds: 8,
  maxLevel: 4, // will be overridden per difficulty

  makeRound(level, history, difficulty = 1) {
    const cfg = DIFF_CONFIG[difficulty] || DIFF_CONFIG[1];
    const lower = level >= cfg.startLowerAtLevel;
    const count = Math.min(cfg.minChoices + Math.floor((level - 1) / 2), cfg.maxChoices);
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
      say: word,
      sayOnStart: false,
      choices: shuffle([target, ...others]).map((l) => ({ label: show(l), correct: l === target, className: 'letter' })),
      render: (v) => v.append(el('div', { class: 'word-pic' }, el('span', { class: 'word-emoji' }, emoji))),
      reveal: { emoji, caption },
      praise: target === 'X' ? `Yes! X is in ${word}!` : `Yes! ${target} is for ${word}!`,
    };
  },
};
