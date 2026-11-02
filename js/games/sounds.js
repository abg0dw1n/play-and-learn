// Letter Sounds — hear the sound a letter makes ("buh"), tap the letter.
// Consonants only for now. The picture stays hidden (she has to listen) and appears as a
// clue after a wrong tap.
//
// The device voice says each sound from a spelling like "buh". Some voices spell short
// made-up words out as letters ("zuh" -> "Z U H"), and which ones do it depends on the
// device, so each letter has a few spellings to choose from. A grown-up picks the ones that
// sound right on the Sound Check page (Grown-ups panel); the choice is saved on the device.
//
// First Steps: 8 common sounds, capitals, 2 choices. Growing Strong: all consonants, 3→4
// choices, lowercase from level 3. Super Star: 4→5 choices, lowercase from level 3.
import { el, pick, shuffle } from '../core/util.js';
import { speak } from '../core/voice.js';
import { store } from '../core/store.js';
import { WORDS, choiceCount } from '../data/words.js';

// Spelling options per letter; the first is the default.
export const SOUND_OPTIONS = {
  B: ['buh', 'buhh', 'bubb', 'bah'],
  C: ['kuh', 'kuhh', 'cuh', 'kah'],
  D: ['duh', 'duhh', 'dud', 'dah'],
  F: ['fuh', 'fuhh', 'fff', 'ffuh'],
  G: ['guh', 'guhh', 'gug', 'gah'],
  H: ['huh', 'huhh', 'hah'],
  J: ['juh', 'juhh', 'jug', 'jah'],
  K: ['kuh', 'kuhh', 'kah'],
  L: ['luh', 'luhh', 'lll', 'lah'],
  M: ['muh', 'mmm', 'muhh', 'mah'],
  N: ['nuh', 'nnn', 'nuhh', 'nah'],
  P: ['puh', 'puhh', 'pup', 'pah'],
  R: ['ruh', 'rrr', 'ruhh', 'rah'],
  S: ['suh', 'sss', 'suhh', 'ssuh'],
  T: ['tuh', 'tuhh', 'tut', 'tah'],
  V: ['vuh', 'vuhh', 'vvv', 'vah'],
  W: ['wuh', 'wuhh', 'wah'],
  Y: ['yuh', 'yuhh', 'yah'],
  Z: ['zuh', 'zuhh', 'zzz', 'zzuh', 'zah'],
};

/** The spelling the voice uses for a letter's sound on this device. */
export function soundFor(letter) {
  const chosen = store.get().soundSpellings?.[letter];
  return SOUND_OPTIONS[letter].includes(chosen) ? chosen : SOUND_OPTIONS[letter][0];
}

/** What the game says to ask about a sound (also used by Sound Check to preview). */
export function soundPrompt(letter, spelling = soundFor(letter)) {
  return `Which letter says, ${spelling}? ${spelling}.`;
}

const ALL = Object.keys(SOUND_OPTIONS);
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

    const pool = cfg.targets.filter((l) => l !== target && l !== SAME_SOUND[target]);
    const others = shuffle(pool).slice(0, count - 1);
    const show = (l) => (lower ? l.toLowerCase() : l);
    const sound = soundFor(target);
    const [word, emoji] = WORDS[target];
    const say = soundPrompt(target, sound);

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
      reveal: { emoji, caption: `${show(target)} is for ${word}` },
      praise: `Yes! ${target} says ${sound}!`,
    };
  },
};
