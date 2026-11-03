// Home screen (4 big picture tiles + Pip) and the world pages that list each world's games.
import { el } from '../core/util.js';
import { store } from '../core/store.js';
import { speak, soundToggle } from '../core/voice.js';
import { sfx } from '../core/sfx.js';
import { guide, setPose } from '../core/guide.js';
import { owned, STICKERS } from '../core/stickers.js';
import { games, worlds } from '../games/index.js';

export const PIP_GREETING = "Hi! I'm Pip. What do you want to play?";

/** Pip you can tap: waves, winks and says something. */
function tappablePip(size, line) {
  const pip = guide('happy', size, 'pip-tap');
  pip.setAttribute('role', 'button');
  pip.setAttribute('aria-label', 'Pip');
  pip.removeAttribute('aria-hidden');
  pip.addEventListener('click', () => {
    sfx.tap();
    setPose(pip, 'wink');
    pip.classList.remove('hop'); void pip.offsetWidth; pip.classList.add('hop');
    speak(line); // stays quiet until sound is turned on
    setTimeout(() => setPose(pip, 'happy'), 1500);
  });
  return pip;
}

export function renderHome(root, { go, onGrownUps }) {
  root.className = 'screen home';
  root.style.removeProperty('--accent');
  root.innerHTML = '';
  const { stars } = store.get();

  const tile = (emoji, title, color, hash, extra = '') => el('button', {
    class: 'tile world-tile', style: { '--accent': color }, 'aria-label': title,
    onclick: () => { sfx.tap(); go(hash); },
  }, el('span', { class: 'tile-emoji' }, emoji), el('span', { class: 'tile-title' }, title), extra && el('span', { class: 'tile-blurb' }, extra));

  root.append(
    el('header', { class: 'home-head' },
      tappablePip(120, PIP_GREETING),
      el('div', { class: 'bubble' }, PIP_GREETING),
      el('div', { class: 'home-right' },
        el('div', { class: 'star-count', 'aria-label': `${stars} stars` }, '⭐ ', stars),
        soundToggle({ label: true }))),
    el('section', { class: 'tiles worlds' },
      ...worlds.map((w) => tile(w.emoji, w.title, w.color, `#/world/${w.id}`)),
      tile('🖍️', 'Print & Color', '#ff9f1c', '#/print'),
      tile('🌈', 'My World', '#43b05c', '#/stickers', `${owned().length} of ${STICKERS.length}`)),
    onGrownUps);
}

export function renderWorld(root, world, { go, onHome, onPlay, grownUps }) {
  root.className = 'screen world';
  root.style.setProperty('--accent', world.color);
  root.innerHTML = '';
  const list = world.games.map((id) => games.find((g) => g.id === id)).filter(Boolean);

  const gameTile = (g) => g.paused
    ? el('div', { class: 'tile soon', 'aria-disabled': 'true' },
      el('span', { class: 'tile-emoji' }, g.emoji), el('span', { class: 'tile-title' }, g.title),
      el('span', { class: 'tile-blurb' }, 'Taking a nap — back soon!'))
    : el('button', { class: 'tile', style: { '--accent': g.color }, onclick: () => { sfx.tap(); onPlay(g.id); } },
      el('span', { class: 'tile-emoji' }, g.emoji), el('span', { class: 'tile-title' }, g.title), el('span', { class: 'tile-blurb' }, g.blurb));

  root.append(
    el('header', { class: 'topbar' },
      el('button', { class: 'icon-btn', 'aria-label': 'Home', onclick: onHome }, '🏠'),
      el('h2', { class: 'world-title' }, `${world.emoji} ${world.title}`),
      tappablePip(70, world.say)),
    el('section', { class: 'tiles world-games' }, list.map(gameTile)));
  setTimeout(() => speak(world.say), 250);
  return () => {};
}
