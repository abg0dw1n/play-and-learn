// Letter Sounds — hear a letter's sound, tap the letter that makes it.
// Consonants only for now (vowel sounds are hard for the device voice to say on their own).
// First Steps: 8 common sounds, capitals, 2 choices. Growing Strong: all consonants, 3→4 choices,
// lowercase from level 3. Super Star: 4→5 choices, lowercase from level 3.
import { el, pick, shuffle } from '../core/util.js';
import { speak } from '../core/voice.js';
import { WORDS, choiceCount } from '../data/words.js';

// How the device voice says each sound. Every one is a consonant + "uh" syllable, because
// device voices spell out letter-only strings ("sss" comes out as "S S S"), but always read
// a syllable like "suh" as a sound. If one sounds wrong on her device, change it here.
export const SOUNDS = {
  B: 'buh', C: 'kuh', D: 'duh', F: 'fuh', G: 'guh', H: 'huh', J: 'juh', K: 'kuh', L: 'luh',
  M: 'muh', N: 'nuh', P: 'puh', R: 'ruh', S: 'suh', T: 'tuh', V: 'vuh', W: 'wuh', Y: 'yuh', Z: 'zuh',
};
const ALL = Object.keys(SOUNDS);
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
  blurb: 'Which letter makes that sound?',
  rounds: 8,
  maxLevels: [2, 4, 6],

  makeRound(level, history, difficulty = 1) {
    const cfg = DIFF_CONFIG[difficulty] || DIFF_CONFIG[1];
    const lower = level >= LOWERCASE_FROM_LEVEL;
    const count = choiceCount(level, cfg.minChoices, cfg.maxChoices);
    const recent = history.slice(-4);
    let target;
    do { target = pick(cfg.targets); } while (recent.includes(target));

    const pool = (count <= cfg.targets.length ? cfg.targets : ALL)
      .filter((l) => l !== target && l !== SAME_SOUND[target]);
    const others = shuffle(pool).slice(0, count - 1);
    const show = (l) => (lower ? l.toLowerCase() : l);
    const sound = SOUNDS[target];
    const [word, emoji] = WORDS[target];
    const say = `Which letter says, ${sound}? ${sound}.`;

    return {
      key: target,
      text: lower ? 'Which little letter makes this sound?' : 'Which letter makes this sound?',
      say,
      retrySay: `Listen. ${sound}. Like ${word}.`,
      choices: shuffle([target, ...others]).map((l) => ({ label: show(l), correct: l === target, className: 'letter' })),
      render(v) {
        v.append(el('button', {
          class: 'listen-btn',
          'aria-label': 'Hear the sound again',
          onclick: () => speak(say, { force: true }),
        }, '👂'));
      },
      // After a miss, show the picture clue next to the ear.
      onMiss(v) {
        if (!v.querySelector('.clue')) v.append(el('div', { class: 'clue' }, emoji));
      },
      reveal: { emoji, caption: `${show(target)} says ${sound}, like ${word}` },
      praise: `Yes! ${target} says ${sound}!`,
    };
  },
};
