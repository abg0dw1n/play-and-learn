// Letter Sounds — listen for the first sound of a word, tap the letter that makes it.
// Consonants only for now. Unlike Letter Hunt, the picture stays hidden: she has to listen.
// (The picture appears as a clue after a wrong tap.)
//
// The voice only ever says real words. Device voices can't say bare sounds: they spell
// "sss" or "zuh" out as letters ("Z U H"), so we never ask them to.
//
// First Steps: 8 common sounds, capitals, 2 choices. Growing Strong: all consonants, 3→4
// choices, lowercase from level 3. Super Star: 4→5 choices, lowercase from level 3.
import { el, pick, shuffle } from '../core/util.js';
import { speak } from '../core/voice.js';
import { WORDS, choiceCount } from '../data/words.js';

const ALL = ['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'Y', 'Z'];
const FIRST_SOUNDS = ['M', 'S', 'T', 'B', 'P', 'F', 'N', 'D'];
// C and K make the same sound, so never show both in one round.
const SAME_SOUND = { C: 'K', K: 'C' };

const DIFF_CONFIG = [
  { targets: FIRST_SOUNDS, minChoices: 2, maxChoices: 2 }, // First Steps
  { targets: ALL, minChoices: 3, maxChoices: 4 },          // Growing Strong
  { targets: ALL, minChoices: 4, maxChoices: 5 },          // Super Star
];
const LOWERCASE_FROM_LEVEL = 3;

export default {
  id: 'sounds',
  title: 'Letter Sounds',
  emoji: '👂',
  color: '#9b5de5',
  blurb: 'Listen for the first sound',
  rounds: 8,
  maxLevels: [2, 4, 6],

  makeRound(level, history, difficulty = 1) {
    const cfg = DIFF_CONFIG[difficulty] || DIFF_CONFIG[1];
    const lower = level >= LOWERCASE_FROM_LEVEL;
    const count = choiceCount(level, cfg.minChoices, cfg.maxChoices);
    const recent = history.slice(-4);
    let target;
    do { target = pick(cfg.targets); } while (recent.includes(target));

    const pool = cfg.targets.filter((l) => l !== target && l !== SAME_SOUND[target]);
    const others = shuffle(pool).slice(0, count - 1);
    const show = (l) => (lower ? l.toLowerCase() : l);
    const [word, emoji] = WORDS[target];
    const say = `Listen. ${word}. Which letter makes the first sound in ${word}?`;

    return {
      key: target,
      text: lower ? 'Which little letter makes the first sound?' : 'Which letter makes the first sound?',
      say,
      retrySay: `Listen again. ${word}. ${word}.`,
      choices: shuffle([target, ...others]).map((l) => ({ label: show(l), correct: l === target, className: 'letter' })),
      render(v) {
        v.append(el('button', {
          class: 'listen-btn',
          'aria-label': 'Hear the word again',
          onclick: () => speak(say, { force: true }),
        }, '👂'));
      },
      // After a miss, show the picture clue next to the ear.
      onMiss(v) {
        if (!v.querySelector('.clue')) v.append(el('div', { class: 'clue' }, emoji));
      },
      reveal: { emoji, caption: `${word} starts with ${show(target)}` },
      praise: `Yes! ${word} starts with ${target}!`,
    };
  },
};
