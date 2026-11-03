// Simple hash router:  #/  (home)   #/world/<id>   #/play/<gameId>   #/stickers   #/sound-check   #/print   #/worksheets   #/worksheet/<id>
import { hush } from './core/voice.js';
import { runChoiceGame } from './core/choice-game.js';
import { renderStickerBook } from './core/stickers.js';
import { renderSoundCheck } from './core/sound-check.js';
import { games, worlds, worldOf } from './games/index.js';
import { renderWorksheets, renderWorksheet } from './worksheets/hub.js';
import { renderPrintShop } from './print/shop.js';
import { applyTheme } from './core/themes.js';
import { renderHome, renderWorld } from './ui/home.js';
import { grownUpsButton, openGrownUps } from './ui/grownups.js';

const app = document.getElementById('app');
applyTheme();
let cleanup = null;

function go(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

const grownUps = () => grownUpsButton(() => openGrownUps({ go, done: route }));

function route() {
  cleanup?.();
  cleanup = null;
  hush();
  const [, page, id] = location.hash.replace(/^#\/?/, '#/').split('/');
  document.body.dataset.page = page || 'home';
  const game = page === 'play' && games.find((g) => g.id === id && !g.paused);
  const world = page === 'world' && worlds.find((w) => w.id === id);
  if (game) {
    const run = game.run || runChoiceGame;
    const w = worldOf(game.id);
    const back = () => go(w ? `#/world/${w}` : '#/');
    // "Play again" goes back through route() so the old round is fully stopped first.
    cleanup = run(app, game, { onHome: () => go('#/'), onBack: back, onRestart: route, onStickers: () => go('#/stickers') });
  } else if (world) {
    cleanup = renderWorld(app, world, { go, onHome: () => go('#/'), onPlay: (gid) => go(`#/play/${gid}`) });
  } else if (page === 'stickers') {
    cleanup = renderStickerBook(app, { onHome: () => go('#/') });
  } else if (page === 'print') {
    cleanup = renderPrintShop(app, { onHome: () => go('#/') });
  } else if (page === 'worksheets') {
    cleanup = renderWorksheets(app, { onHome: () => go('#/'), onOpen: (wid) => go(`#/worksheet/${wid}`) });
  } else if (page === 'worksheet' && /^[0-9a-f-]{36}$/i.test(id || '')) {
    cleanup = renderWorksheet(app, id, { onBack: () => go('#/worksheets'), onSignedOut: () => go('#/worksheets') });
  } else if (page === 'sound-check') {
    cleanup = renderSoundCheck(app, { onHome: () => go('#/') });
  } else {
    renderHome(app, { go, onGrownUps: grownUps() });
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
