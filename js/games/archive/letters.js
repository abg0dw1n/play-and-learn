// Letter Hunt — see a picture, hear its name, find the letter it starts with.
// First Steps: capitals, 2 choices. Growing Strong: 3→4 choices, lowercase from level 3.
// Super Star: 4→5 choices, lowercase from level 3.
import { el, pick, shuffle } from '../../core/util.js';
import { WORDS, ALPHABET, choiceCount } from '../../data/words.js';

const TARGETS = Object.keys(WORDS);

const DIFF_CONFIG = [
  { minChoices: 2, maxChoices: 2 }, // First Steps (max level 2, so always capitals)
  { minChoices: 3, maxChoices: 4 }, // Growing Strong
  { minChoices: 4, maxChoices: 5 }, // Super Star
];
const LOWERCASE_FROM_LEVEL = 3;

export default {
  id: 'letters',
  title: 'Letter Hunt',
  emoji: '🔤',
  color: '#ff7a59',
  blurb: 'What letter does it start with?',
  rounds: 8,
  maxLevels: [2, 4, 6],

  makeRound(level, history, difficulty = 1) {
    const cfg = DIFF_CONFIG[difficulty] || DIFF_CONFIG[1];
    const lower = level >= LOWERCASE_FROM_LEVEL;
    const count = choiceCount(level, cfg.minChoices, cfg.maxChoices);
    const recent = history.slice(-4);
    let target;
    do { target = pick(TARGETS); } while (recent.includes(target));

    const others = shuffle(ALPHABET.filter((l) => l !== target)).slice(0, count - 1);
    const show = (l) => (lower ? l.toLowerCase() : l);
    const [word, emoji] = WORDS[target];

    return {
      key: target,
      text: lower ? 'Find the little letter!' : 'Find the letter!',
      say: `${word}! What letter does ${word} start with?`,
      choices: shuffle([target, ...others]).map((l) => ({ label: show(l), correct: l === target, className: 'letter' })),
      render: (v) => v.append(el('div', { class: 'word-pic' }, el('span', { class: 'word-emoji' }, emoji))),
      reveal: { emoji, caption: `${show(target)} is for ${word}` },
      praise: `Yes! ${target} is for ${word}!`,
    };
  },
};
