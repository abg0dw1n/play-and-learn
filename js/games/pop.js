// Balloon Pop — tap the balloons before they float away. Just for fun, nothing to lose.
import { el, rand } from '../core/util.js';
import { store } from '../core/store.js';
import { speak, hush, soundToggle } from '../core/voice.js';
import { sfx } from '../core/sfx.js';
import { burstAt } from '../core/confetti.js';
import { renderFinish } from '../core/finish.js';

const COLORS = ['#ff5d6c', '#ff9f1c', '#ffd23f', '#43b05c', '#4d96ff', '#8e5bd9', '#ff6fb5'];
// First Steps: slow balloons, fewer. Super Star: quicker.
const SETTINGS = [{ total: 12, rise: [9, 11], every: 1500 }, { total: 14, rise: [7, 9], every: 1300 }, { total: 16, rise: [5.5, 7.5], every: 1100 }];

export default {
  id: 'pop',
  title: 'Balloon Pop',
  emoji: '🎈',
  color: '#ff5d6c',
  blurb: 'Pop all the balloons!',
  fun: true,
  maxLevels: [1, 1, 1],

  run(root, game, nav) {
    const cfg = SETTINGS[store.getDifficulty()];
    let alive = true, spawned = 0, popped = 0, gone = 0, timer = null;
    root.innerHTML = '';
    root.className = `screen game theme-${game.id} pop`;
    root.style.setProperty('--accent', game.color);
    const count = el('div', { class: 'star-count' }, '🎈 0');
    const field = el('div', { class: 'pop-field' });
    root.append(
      el('header', { class: 'topbar' },
        el('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: nav.onBack || nav.onHome }, nav.onBack ? '⬅️' : '🏠'),
        count, el('div', { class: 'topbar-right' }, soundToggle())),
      el('h2', { class: 'prompt' }, 'Pop the balloons!'), field);

    function settle() {
      gone++;
      if (alive && spawned >= cfg.total && gone >= cfg.total) {
        setTimeout(() => alive && renderFinish(root, game, nav, {
          alive: () => alive,
          title: `You popped ${popped}!`,
          say: `You popped ${popped} ${popped === 1 ? 'balloon' : 'balloons'}!`,
        }), 500);
      }
    }

    function spawn() {
      if (!alive) return;
      const color = COLORS[rand(COLORS.length)];
      const b = el('button', { class: 'balloon', 'aria-label': 'Balloon', style: { '--c': color, left: `${4 + rand(78)}%`, 'animation-duration': `${cfg.rise[0] + Math.random() * (cfg.rise[1] - cfg.rise[0])}s` } });
      b.addEventListener('pointerdown', (e) => {
        if (b.classList.contains('popped')) return;
        e.preventDefault();
        b.classList.add('popped'); popped++; count.textContent = `🎈 ${popped}`;
        sfx.yes(); burstAt(b, 24);
        setTimeout(() => { b.remove(); settle(); }, 180);
      });
      b.addEventListener('animationend', () => { if (!b.classList.contains('popped')) { b.remove(); settle(); } });
      field.append(b);
      spawned++;
      if (spawned < cfg.total) timer = setTimeout(spawn, cfg.every * (0.7 + Math.random() * 0.6));
    }

    speak('Pop the balloons!');
    timer = setTimeout(spawn, 500);
    return () => { alive = false; clearTimeout(timer); hush(); };
  },
};
