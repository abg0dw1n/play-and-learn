// Count It! — tap each object to count out loud, then pick the number.
// Levels: up to 5 (3 choices) → up to 10 (3 choices) → up to 10 (4 choices).
import { el, pick, rand, shuffle } from '../core/util.js';
import { speak } from '../core/voice.js';
import { sfx } from '../core/sfx.js';

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

export default {
  id: 'counting',
  title: 'Count It!',
  emoji: '🍎',
  color: '#3fb950',
  blurb: 'Tap to count, then pick the number',
  rounds: 8,
  maxLevel: 3,

  makeRound(level, history) {
    const max = level === 1 ? 5 : 10;
    const count = level === 3 ? 4 : 3;
    let n;
    do { n = 1 + rand(max); } while (history.slice(-2).includes(n));
    const [emoji, one, many] = pick(THINGS);

    return {
      key: n,
      text: `How many ${many}?`,
      say: `How many ${many}? Tap them to count!`,
      choices: choicesFor(n, max, count).map((x) => ({ label: String(x), correct: x === n, className: 'number' })),
      praise: `Yes! ${n} ${n === 1 ? one : many}!`,
      render(visual) {
        let counted = 0;
        const grid = el('div', { class: 'count-grid', 'data-n': n });
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
