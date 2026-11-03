// Home screen + simple hash router:  #/  (home)   #/play/<gameId>   #/stickers   #/sound-check
import { el } from './core/util.js';
import { store, levelCap, DIFFICULTY_NAMES } from './core/store.js';
import { speak, hush, soundToggle } from './core/voice.js';
import { sfx } from './core/sfx.js';
import { runChoiceGame } from './core/choice-game.js';
import { owned, STICKERS, renderStickerBook } from './core/stickers.js';
import { renderSoundCheck } from './core/sound-check.js';
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
  const game = page === 'play' && games.find((g) => g.id === id && !g.paused);
  if (game) {
    const run = game.run || runChoiceGame;
    // "Play again" goes back through route() so the old round is fully stopped first.
    cleanup = run(app, game, { onHome: () => go('#/'), onRestart: route, onStickers: () => go('#/stickers') });
  } else if (page === 'stickers') {
    cleanup = renderStickerBook(app, { onHome: () => go('#/') });
  } else if (page === 'sound-check') {
    cleanup = renderSoundCheck(app, { onHome: () => go('#/') });
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

  const tiles = games.map((g) => g.paused
    ? el('div', { class: 'tile soon', 'aria-disabled': 'true' },
      el('span', { class: 'tile-emoji' }, g.emoji),
      el('span', { class: 'tile-title' }, g.title),
      el('span', { class: 'tile-blurb' }, 'Taking a nap — back soon!'))
    : el('button', {
      class: 'tile',
      style: { '--accent': g.color },
      onclick: () => { sfx.tap(); go(`#/play/${g.id}`); },
    },
    el('span', { class: 'tile-emoji' }, g.emoji),
    el('span', { class: 'tile-title' }, g.title),
    el('span', { class: 'tile-blurb' }, g.blurb)));

  const book = el('button', {
    class: 'tile book-tile',
    style: { '--accent': '#f4a100' },
    onclick: () => { sfx.tap(); go('#/stickers'); },
  },
  el('span', { class: 'tile-emoji' }, '📒'),
  el('span', { class: 'tile-title' }, 'My Stickers'),
  el('span', { class: 'tile-blurb' }, `${owned().length} of ${STICKERS.length} found`));

  const soon = comingSoon.map((g) =>
    el('div', { class: 'tile soon', 'aria-disabled': 'true' },
      el('span', { class: 'tile-emoji' }, g.emoji),
      el('span', { class: 'tile-title' }, g.title),
      el('span', { class: 'tile-blurb' }, g.blurb)));

  app.append(
    el('header', { class: 'home-head' },
      el('h1', {}, name ? `Hi, ${name}!` : 'Play & Learn'),
      el('div', { class: 'star-count', 'aria-label': `${stars} stars` }, '⭐ ', stars),
      soundToggle(),
      difficultyPicker()),
    el('p', { class: 'home-sub' }, 'Pick a game!'),
    el('section', { class: 'tiles' }, tiles, book, soon),
    grownUpsButton());
}

// Difficulty picker (shown in header) — three segment buttons
function difficultyPicker() {
  const wrap = el('div', { class: 'difficulty-picker' });
  const current = store.getDifficulty();
  DIFFICULTY_NAMES.forEach((label, i) => {
    const btn = el('button', {
      class: `diff-btn${i === current ? ' on' : ''}`,
      'aria-label': `Difficulty: ${label}`,
      'aria-pressed': String(i === current),
      onclick: () => {
        store.setDifficulty(i);
        wrap.querySelectorAll('.diff-btn').forEach((b) => {
          b.classList.toggle('on', b === btn);
          b.setAttribute('aria-pressed', String(b === btn));
        });
        speak(label);
      },
    }, label);
    wrap.append(btn);
  });
  return wrap;
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
  const d = store.getDifficulty();
  const nameInput = el('input', { type: 'text', value: s.name, maxlength: 20, placeholder: "Child's first name", autocomplete: 'off' });
  const levels = games.map((g) => el('li', {},
    `${g.emoji} ${g.title}: level ${Math.min(store.level(g.id, d), levelCap(g, d))} of ${levelCap(g, d)}, played ${store.game(g.id).plays || 0}×`));

  const dialog = el('dialog', { class: 'settings' },
    el('form', { method: 'dialog' },
      el('h2', {}, 'Grown-ups'),
      el('label', {}, 'Name (used in the greeting)', nameInput),
      // type=button so pressing Enter in the name box saves (Done) instead of opening Sound Check
      el('button', { type: 'button', class: 'sc-link', onclick: () => dialog.close('soundcheck') }, '🔊 Sound Check: voice and letter sounds'),
      el('h3', {}, `Progress on this device (${DIFFICULTY_NAMES[d]})`),
      el('ul', {}, levels, el('li', {}, `⭐ ${s.stars} stars, 📒 ${owned().length} of ${STICKERS.length} stickers`)),
      el('div', { class: 'settings-actions' },
        el('button', { type: 'button', class: 'link-danger', onclick: () => {
          if (confirm('Reset stars, stickers and levels on this device?')) { store.reset(); dialog.close(); }
        } }, 'Reset progress'),
        el('button', { value: 'save', class: 'big-btn' }, 'Done'))));

  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'save' || dialog.returnValue === 'soundcheck') store.set({ name: nameInput.value.trim() });
    dialog.remove();
    if (dialog.returnValue === 'soundcheck') go('#/sound-check');
    else renderHome();
  });
  document.body.append(dialog);
  dialog.showModal();
}

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
