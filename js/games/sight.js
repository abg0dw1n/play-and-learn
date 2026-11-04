// Sight Words — the words kindergartners learn to know on sight (the, and, said...).
// Early levels: hear a word, find it among look-alike words.
// Later levels: a sentence with a missing word — pick the word that fits (reading + meaning).
import { el, pick, shuffle } from '../core/util.js';
import { speak } from '../core/voice.js';

const EASY = ['the', 'and', 'is', 'it', 'in', 'a', 'to', 'I', 'my', 'we', 'me', 'he', 'go', 'no', 'so', 'up', 'on', 'at', 'am', 'an', 'do'];
const MORE = ['she', 'like', 'see', 'can', 'you', 'are', 'was', 'said', 'have', 'they', 'look', 'come', 'play', 'with', 'this',
  'that', 'what', 'want', 'here', 'went', 'little', 'for', 'of', 'as', 'his', 'her', 'be', 'but', 'not', 'all', 'out', 'had', 'will', 'yes'];

// [answer, sentence with ___, words that definitely do NOT fit]
const SENTENCES = [
  ['see', 'I ___ a cat.', ['the', 'and', 'to', 'in']],
  ['can', 'I ___ run fast.', ['the', 'is', 'in', 'to']],
  ['like', 'I ___ my dog.', ['the', 'and', 'of', 'is']],
  ['is', 'The cat ___ big.', ['see', 'and', 'to', 'can']],
  ['and', 'I have a hat ___ a bag.', ['the', 'is', 'go', 'he']],
  ['to', 'We go ___ the park.', ['is', 'my', 'a', 'can']],
  ['are', 'You ___ my friend.', ['is', 'can', 'the', 'go']],
  ['have', 'I ___ a red ball.', ['the', 'is', 'to', 'and']],
  ['she', '___ is my mom.', ['see', 'and', 'to', 'go']],
  ['he', '___ can jump.', ['see', 'and', 'to', 'is']],
  ['my', 'I love ___ mom.', ['is', 'and', 'to', 'go']],
  ['go', 'Let us ___ home.', ['the', 'and', 'is', 'my']],
  ['they', '___ can play.', ['is', 'to', 'and', 'in']],
  ['was', 'The dog ___ happy.', ['are', 'see', 'to', 'and']],
  ['look', '___ at the big sun!', ['is', 'and', 'to', 'my']],
  ['said', 'Mom ___ yes.', ['is', 'and', 'to', 'the']],
  ['play', 'I can ___ with you.', ['the', 'is', 'and', 'my']],
  ['with', 'Come ___ me.', ['the', 'is', 'and', 'a']],
  ['come', 'Please ___ here.', ['the', 'and', 'is', 'my']],
  ['what', '___ is that?', ['and', 'to', 'go', 'my']],
  ['do', 'I ___ not like it.', ['the', 'is', 'and', 'to']],
  ['want', 'I ___ a snack.', ['the', 'and', 'is', 'to']],
  ['this', '___ is my hat.', ['and', 'to', 'go', 'is']],
  ['little', 'The ant is ___ .', ['and', 'to', 'go', 'the']],
];

// Per difficulty, per level: 'find' (hear it, find it) or 'fill' (sentence), word pool and choices.
const LEVELS = [
  [{ t: 'find', pool: 'easy', n: 3 }, { t: 'find', pool: 'easy', n: 4 }, { t: 'fill', n: 3 }],            // First Steps
  [{ t: 'find', pool: 'more', n: 4 }, { t: 'fill', n: 3 }, { t: 'fill', n: 4 }, { t: 'fill', n: 5 }],     // Growing Strong
  [{ t: 'find', pool: 'more', n: 5 }, { t: 'fill', n: 4 }, { t: 'fill', n: 5 }],                         // Super Star
];

const say = (w) => (w === 'I' ? 'I' : w);
const sentenceWith = (s, w) => s.replace('___', w).replace(/\s+([.!?])/, '$1');

export default {
  id: 'sight',
  title: 'Sight Words',
  emoji: '👀',
  color: '#e63946',
  blurb: 'Find the word. Finish the sentence.',
  rounds: 8,
  maxLevels: LEVELS.map((l) => l.length),

  makeRound(level, history, difficulty = 1) {
    const set = LEVELS[difficulty] || LEVELS[1];
    const cfg = set[Math.min(level, set.length) - 1];

    if (cfg.t === 'find') {
      const pool = cfg.pool === 'easy' ? EASY : [...EASY, ...MORE];
      let target;
      do { target = pick(pool); } while (history.slice(-5).includes(target));
      // Look-alikes first (same first letter or same length), then anything else.
      const rest = shuffle(pool.filter((w) => w !== target && w.toLowerCase() !== target.toLowerCase()));
      const close = rest.filter((w) => w[0].toLowerCase() === target[0].toLowerCase() || w.length === target.length);
      const wrong = [...new Set([...close, ...rest])].slice(0, cfg.n - 1);
      return {
        key: target,
        text: 'Find the word',
        say: ['Find the word.', `${say(target)}.`],
        retrySay: ['Find the word.', `${say(target)}.`],
        choices: shuffle([target, ...wrong]).map((w) => ({ label: w, correct: w === target, className: 'word' })),
        render(v) {
          v.append(el('button', { class: 'listen-btn', 'aria-label': 'Hear the word again', onclick: () => speak(`${say(target)}.`, { force: true }) }, '👂'));
        },
        reveal: { emoji: '👀', caption: `${target}!` },
        praise: ['Yes!', `${say(target)}!`],
      };
    }

    // Fill in the missing word.
    let item;
    do { item = pick(SENTENCES); } while (history.slice(-6).includes(item[0]));
    const [answer, sentence, nope] = item;
    const wrong = shuffle(nope).slice(0, cfg.n - 1);
    const [before, after] = sentence.split('___').map((x) => x.trim());
    // (pieces that are only punctuation, like the "." after a blank at the end, aren't spoken)
    const spoken = ['Which word fits?', before, 'blank,', after].filter((x) => /[a-z0-9]/i.test(x || ''));
    return {
      key: answer,
      text: 'Which word fits?',
      say: spoken,
      retrySay: spoken,
      choices: shuffle([answer, ...wrong]).map((w) => ({ label: w, correct: w === answer, className: 'word' })),
      render(v) {
        v.append(el('div', { class: 'sentence-wrap' },
          el('div', { class: 'sentence' }, sentence.replace('___', '＿＿＿')),
          el('button', { class: 'hear-btn', type: 'button', 'aria-label': 'Hear the sentence again', onclick: () => speak(spoken.slice(1), { force: true }) }, '🔊 Read it again')));
      },
      reveal: { emoji: '📝', caption: sentenceWith(sentence, answer) },
      praise: ['Yes!', sentenceWith(sentence, answer)],
    };
  },
};
