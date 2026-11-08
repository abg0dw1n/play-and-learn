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
    let alive = true, spawned = 0, popped = 0, gone = 0;
    const timers = [];
    const later = (fn, ms) => { timers.push(setTimeout(() => alive && fn(), ms)); };
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
        later(() => renderFinish(root, game, nav, {
          alive: () => alive,
          perfect: popped >= cfg.total,
          title: `You popped ${popped}!`,
          say: `You popped ${popped} ${popped === 1 ? 'balloon' : 'balloons'}!`,
        }), 500);
      }
    }

    function spawn() {
      if (!alive) return;
      const color = COLORS[rand(COLORS.length)];
      const rise = cfg.rise[0] + Math.random() * (cfg.rise[1] - cfg.rise[0]); // seconds to float off the top
      const b = el('button', { class: 'balloon', 'aria-label': 'Balloon', style: { '--c': color, '--rise': `${rise}s`, left: `${4 + rand(78)}%` } });
      // Each balloon leaves exactly once: popped, floated off the top, or (backup) its time ran out.
      // The backup matters when the browser never reports the float finishing (e.g. the tab was hidden).
      let left = false;
      const leave = () => { if (left) return; left = true; b.remove(); settle(); };
      b.addEventListener('pointerdown', (e) => {
        if (left || b.classList.contains('popped')) return;
        e.preventDefault();
        b.classList.add('popped'); popped++; count.textContent = `🎈 ${popped}`;
        sfx.yes(); burstAt(b, 24);
        later(leave, 180);
      });
      b.addEventListener('animationend', () => { if (!b.classList.contains('popped')) leave(); });
      later(() => { if (!b.classList.contains('popped')) leave(); }, rise * 1000 + 800);
      field.append(b);
      spawned++;
      if (spawned < cfg.total) later(spawn, cfg.every * (0.7 + Math.random() * 0.6));
    }

    speak('Pop the balloons!');
    later(spawn, 500);
    return () => { alive = false; timers.forEach(clearTimeout); hush(); };
  },
};
