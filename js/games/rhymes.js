// Rhyme Time — see a picture, hear "What rhymes with cat?" and the name of each choice,
// then tap the picture that rhymes. The voice names every choice, so no reading is needed.
// First Steps: 2 choices. Growing Strong: 3. Super Star: 3 → 4.
import { el, pick, shuffle } from '../core/util.js';
import { choiceCount } from '../data/words.js';

// Rhyme families. Pictures picked so a 5-year-old names them the way they're written.
const FAMILIES = [
  [['cat', '🐱'], ['hat', '🎩'], ['bat', '🦇']],
  [['dog', '🐶'], ['frog', '🐸'], ['log', '🪵']],
  [['bee', '🐝'], ['tree', '🌳'], ['key', '🔑']],
  [['car', '🚗'], ['star', '⭐']],
  [['moon', '🌙'], ['spoon', '🥄']],
  [['cake', '🎂'], ['snake', '🐍']],
  [['bear', '🐻'], ['chair', '🪑'], ['pear', '🍐']],
  [['boat', '⛵'], ['goat', '🐐'], ['coat', '🧥']],
  [['king', '🤴'], ['ring', '💍']],
  [['house', '🏠'], ['mouse', '🐭']],
  [['clock', '🕐'], ['sock', '🧦'], ['rock', '🪨']],
  [['duck', '🦆'], ['truck', '🚚']],
  [['whale', '🐳'], ['snail', '🐌']],
  [['nose', '👃'], ['rose', '🌹']],
  [['bed', '🛏️'], ['bread', '🍞']],
  [['box', '📦'], ['fox', '🦊']],
  [['pie', '🥧'], ['tie', '👔']],
  [['crown', '👑'], ['clown', '🤡']],
  [['bell', '🔔'], ['shell', '🐚']],
];

const DIFF_CONFIG = [
  { minChoices: 2, maxChoices: 2 }, // First Steps
  { minChoices: 3, maxChoices: 3 }, // Growing Strong
  { minChoices: 3, maxChoices: 4 }, // Super Star
];

export default {
  id: 'rhymes',
  title: 'Rhyme Time',
  emoji: '🎶',
  color: '#0ea5a4',
  blurb: 'Find the picture that rhymes',
  rounds: 8,
  maxLevels: [2, 3, 4],

  makeRound(level, history, difficulty = 1) {
    const cfg = DIFF_CONFIG[difficulty] || DIFF_CONFIG[1];
    const count = choiceCount(level, cfg.minChoices, cfg.maxChoices);
    const recent = history.slice(-5);
    let family;
    do { family = pick(FAMILIES); } while (recent.includes(family[0][0]));

    const [target, answer] = shuffle(family);
    // Wrong choices come from other families, so they never rhyme with the target.
    const others = shuffle(FAMILIES.filter((f) => f !== family)).slice(0, count - 1).map((f) => pick(f));
    const options = shuffle([answer, ...others]);
    const names = options.map(([w]) => w).join('... ');

    return {
      key: family[0][0],
      text: `What rhymes with ${target[0]}?`,
      say: `What rhymes with ${target[0]}? ${names}?`,
      choices: options.map(([w, e]) => ({ label: e, correct: w === answer[0], className: 'pic' })),
      render: (v) => v.append(el('div', { class: 'word-pic' }, el('span', { class: 'word-emoji' }, target[1]))),
      reveal: { emoji: `${target[1]} ${answer[1]}`, caption: `${target[0]} and ${answer[0]} rhyme!` },
      praise: `Yes! ${target[0]}, ${answer[0]}!`,
    };
  },
};
