// Home screen + simple hash router:  #/  (home)   #/play/<gameId>
import { el } from './core/util.js';
import { store } from './core/store.js';
import { speak, hush } from './core/voice.js';
import { sfx } from './core/sfx.js';
import { runChoiceGame } from './core/choice-game.js';
import { games, comingSoon } from './games/index.js';

const app = document.getElementById('app');
let cleanup = null;

function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

function route() {
  cleanup?.();
  cleanup = null;
  hush();
  const [, page, id] = location.hash.replace(/^#\/?/, '#/').split('/');
  const game = page === 'play' && games.find((g) => g.id === id);
  if (game) {
    const run = game.run || runChoiceGame;
    cleanup = run(app, game, { onHome: () => go('#/') });
  } else {
    renderHome();
  }
  window.scrollTo(0, 0);
}

function renderHome() {
  const { name, stars } = store.get();
  app.className = 'screen home';
  app.style.removeProperty('--accent');
  app.innerHTML = '';

  const tiles = games.map((g) =>
    el('button', {
      class: 'tile',
      style: { '--accent': g.color },
      onclick: () => { sfx.tap(); speak(g.title); go(`#/play/${g.id}`); },
    },
    el('span', { class: 'tile-emoji' }, g.emoji),
    el('span', { class: 'tile-title' }, g.title),
    el('span', { class: 'tile-blurb' }, g.blurb)));

  const soon = comingSoon.map((g) =>
    el('div', { class: 'tile soon', 'aria-disabled': 'true' },
      el('span', { class: 'tile-emoji' }, g.emoji),
      el('span', { class: 'tile-title' }, g.title),
      el('span', { class: 'tile-blurb' }, g.blurb)));

  app.append(
    el('header', { class: 'home-head' },
      el('h1', {}, name ? `Hi, ${name}!` : 'Play & Learn'),
      el('div', { class: 'star-count', 'aria-label': `${stars} stars` }, '⭐ ', stars)),
    el('p', { class: 'home-sub' }, 'Pick a game!'),
    el('section', { class: 'tiles' }, tiles, soon),
    grownUpsButton());
}

// Press-and-hold so little fingers don't wander into settings.
function grownUpsButton() {
  let timer;
  const btn = el('button', { class: 'grownups' }, 'Grown-ups (hold)');
  const start = (e) => { e.preventDefault(); btn.classList.add('holding'); timer = setTimeout(openSettings, 1200); };
  const stop = () => { btn.classList.remove('holding'); clearTimeout(timer); };
  btn.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  return btn;
}

function openSettings() {
  const s = store.get();
  const nameInput = el('input', { type: 'text', value: s.name, maxlength: 20, placeholder: "Child's first name", autocomplete: 'off' });
  const soundInput = el('input', { type: 'checkbox', ...(s.sound ? { checked: true } : {}) });
  const levels = games.map((g) => el('li', {}, `${g.emoji} ${g.title}: level ${store.game(g.id).level || 1} of ${g.maxLevel || 1}, played ${store.game(g.id).plays || 0}×`));

  const dialog = el('dialog', { class: 'settings' },
    el('form', { method: 'dialog' },
      el('h2', {}, 'Grown-ups'),
      el('label', {}, 'Name (used in the greeting)', nameInput),
      el('label', { class: 'row' }, soundInput, 'Voice and sounds on'),
      el('h3', {}, 'Progress on this device'),
      el('ul', {}, levels, el('li', {}, `⭐ ${s.stars} stars`)),
      el('div', { class: 'settings-actions' },
        el('button', { type: 'button', class: 'link-danger', onclick: () => {
          if (confirm('Reset stars and levels on this device?')) { store.reset(); dialog.close(); renderHome(); }
        } }, 'Reset progress'),
        el('button', { value: 'save', class: 'big-btn' }, 'Done'))));

  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'save') store.set({ name: nameInput.value.trim(), sound: soundInput.checked });
    dialog.remove();
    renderHome();
  });
  document.body.append(dialog);
  dialog.showModal();
}

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
