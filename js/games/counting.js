// Count It! — tap each object to count out loud, then pick the number.
// First Steps: up to 3 → 5. Growing Strong: up to 5 → 10. Super Star: up to 10 → 20.
import { el, pick, rand, shuffle } from '../core/util.js';
import { speak } from '../core/voice.js';
import { sfx } from '../core/sfx.js';
import { choiceCount } from '../data/words.js';

const THINGS = [
  ['🍎', 'apple', 'apples'], ['🐞', 'ladybug', 'ladybugs'], ['⭐', 'star', 'stars'],
  ['🐟', 'fish', 'fish'], ['🦋', 'butterfly', 'butterflies'], ['🍓', 'strawberry', 'strawberries'],
  ['🐥', 'chick', 'chicks'], ['🌸', 'flower', 'flowers'], ['🚗', 'car', 'cars'],
  ['🎈', 'balloon', 'balloons'], ['🐸', 'frog', 'frogs'], ['🍪', 'cookie', 'cookies'],
];

function choicesFor(n, max, count) {
  const near = shuffle([n - 2, n - 1, n + 1, n + 2].filter((x) => x >= 1 && x <= max));
  const set = new Set([n, ...near.slice(0, count - 1)]);
  while (set.size < count) set.add(1 + rand(max));
  return [...set].sort((a, b) => a - b);
}

// Per difficulty: the biggest number at each level, and answer choices (grow by one every two levels).
const DIFF_CONFIG = [
  { maxPerLevel: [3, 5], minChoices: 2, maxChoices: 2 },             // First Steps
  { maxPerLevel: [5, 10, 10], minChoices: 3, maxChoices: 4 },        // Growing Strong
  { maxPerLevel: [10, 15, 20, 20], minChoices: 4, maxChoices: 5 },   // Super Star
];

export default {
  id: 'counting',
  title: 'Count It!',
  emoji: '🍎',
  color: '#3fb950',
  blurb: 'Tap to count, then pick the number',
  rounds: 8,
  maxLevels: DIFF_CONFIG.map((c) => c.maxPerLevel.length),

  makeRound(level, history, difficulty = 1) {
    const cfg = DIFF_CONFIG[difficulty] || DIFF_CONFIG[1];
    const max = cfg.maxPerLevel[Math.min(level - 1, cfg.maxPerLevel.length - 1)];
    const count = choiceCount(level, cfg.minChoices, cfg.maxChoices);
    let n;
    do { n = 1 + rand(max); } while (history.slice(-2).includes(n));
    const [emoji, one, many] = pick(THINGS);

    return {
      key: n,
      text: `How many ${many}?`,
      say: `How many ${many}? Tap to count!`,
      choices: choicesFor(n, max, count).map((x) => ({ label: String(x), correct: x === n, className: 'number' })),
      praise: `Yes! ${n} ${n === 1 ? one : many}!`,
      render(visual) {
        let counted = 0;
        const grid = el('div', { class: `count-grid${n > 10 ? ' many' : ''}`, 'data-n': n });
        for (let i = 0; i < n; i++) {
          const item = el('button', { class: 'count-item', 'aria-label': one }, emoji);
          item.addEventListener('click', () => {
            if (item.dataset.count) { speak(item.dataset.count); return; }
            counted++;
            item.dataset.count = counted;
            item.append(el('span', { class: 'badge' }, counted));
            sfx.tap();
            speak(String(counted), { rate: 1 });
          });
          grid.append(item);
        }
        visual.append(grid);
      },
    };
  },
};
