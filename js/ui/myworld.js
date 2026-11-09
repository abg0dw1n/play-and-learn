// My World: a living scene she can decorate, places to unlock, collections, a daily hunt and gift boxes.
import { el } from '../core/util.js';
import { store } from '../core/store.js';
import { speak, soundToggle } from '../core/voice.js';
import { sfx } from '../core/sfx.js';
import { burstAt } from '../core/confetti.js';
import { guide } from '../core/guide.js';
import { owned, ownedCommon, ownedRare, STICKERS, RARE } from '../core/stickers.js';
import { RARE_EMOJIS, rarityOf } from '../core/rare.js';
import { SETS, setCount, SCENES, sceneById, unlockedScenes, nextScene, decorName, DECOR, BONUS_DECOR } from '../world/data.js';
import { buildScene } from '../world/scene.js';
import { openGiftBox } from '../world/gift.js';
import { dailyToday, goalProgress, DAILY_NEED } from '../world/progress.js';

const NAMES = Object.fromEntries([...STICKERS, ...RARE.map((r) => [r.emoji, r.name]), ...[...DECOR, ...BONUS_DECOR].map((d) => [d.emoji, d.name])]);
export const NEW_FRIEND_LINE = 'Look! A new friend!';

export function renderMyWorld(root, { onHome, onPrint }) {
  const have = owned();
  const st = () => store.get();
  const total = have.length;
  const open = unlockedScenes(total);
  let sceneId = open.some((s) => s.id === st().world?.scene) ? st().world.scene : 'meadow';
  let edit = false;
  let live = null; // the running scene
  let newest = st().newest && have.includes(st().newest) ? st().newest : null;
  if (newest) store.set({ newest: null });

  root.innerHTML = '';
  root.className = 'screen stickers';
  root.style.setProperty('--accent', '#43b05c');

  const saveItem = (emoji, patch) => {
    const w = st().world;
    store.set({ world: { ...w, items: { ...w.items, [emoji]: { ...(w.items[emoji] || {}), ...patch } } } });
  };

  const itemList = () => [
    ...owned().map((e) => ({ emoji: e, name: NAMES[e] || e, shiny: (st().shinies || []).includes(e), rarity: RARE_EMOJIS.has(e) ? rarityOf(e) : null })),
    ...(st().decor || []).map((e) => ({ emoji: e, name: NAMES[e] || decorName(e) || e })),
  ];

  const bubble = el('p', { class: 'bubble' }, '');
  const say = (t) => { bubble.textContent = t; };
  const sceneHost = el('div', { class: 'scene-host' });
  const toolsHost = el('div', { class: 'world-tools' });
  const placesHost = el('div', { class: 'places' });
  const editBar = el('div', { class: 'world-tools' });

  const mountScene = () => {
    live?.stop();
    const w = st().world;
    live = buildScene({
      items: itemList(), world: w, sceneId, edit, newest,
      onTap: (it) => { speak(it.name); say(it.name); },
      onMove: (e, pos) => saveItem(e, pos),
      onSelect: () => drawEdit(),
    });
    sceneHost.replaceChildren(live.node);
  };

  const drawPlaces = () => {
    placesHost.replaceChildren(...SCENES.map((s) => {
      const isOpen = total >= s.at;
      const b = el('button', { class: `place-btn${s.id === sceneId ? ' on' : ''}${isOpen ? '' : ' locked'}`, 'aria-label': isOpen ? s.name : `${s.name}, locked` },
        isOpen ? s.icon : '🔒', el('small', {}, isOpen ? s.name : `${s.at} stickers`));
      b.addEventListener('click', () => {
        if (!isOpen) { sfx.tap(); speak('Keep finding stickers to open this place!'); return; }
        sceneId = s.id; sfx.tap(); store.set({ world: { ...st().world, scene: s.id } });
        drawPlaces(); mountScene(); speak(s.name);
      });
      return b;
    }));
  };

  const drawTools = () => {
    const gifts = st().gifts || 0;
    const dec = el('button', { class: `tool-btn${edit ? ' on' : ''}`, 'aria-label': 'Decorate' }, '✏️', el('small', {}, edit ? 'Done' : 'Decorate'));
    dec.addEventListener('click', () => {
      edit = !edit; sfx.tap(); drawTools(); mountScene(); drawEdit();
      if (edit) { say('Drag your friends where you want them!'); speak('Drag your friends where you want them!'); }
    });
    const gift = el('button', { class: `tool-btn gift-btn${gifts ? ' has' : ''}`, 'aria-label': `Gift boxes: ${gifts}`, disabled: gifts ? null : true }, '🎁', el('small', {}, gifts ? `${gifts} to open` : 'none yet'));
    gift.addEventListener('click', () => openGiftBox({ onClose: () => { drawTools(); drawPlaces(); mountScene(); drawAll(); } }));
    const print = onPrint && el('button', { class: 'tool-btn', 'aria-label': 'Print my world poster', onclick: onPrint }, '🖨️', el('small', {}, 'Poster'));
    toolsHost.replaceChildren(dec, gift, print);
  };

  const drawEdit = () => {
    editBar.replaceChildren();
    if (!edit) return;
    const sel = live?.selected;
    const cur = (sel && st().world.items[sel]) || {};
    const btn = (label, aria, fn) => { const b = el('button', { class: 'tool-btn', 'aria-label': aria, disabled: sel ? null : true }, label); b.addEventListener('click', () => { sfx.tap(); fn(); live.refresh(sel); drawEdit(); }); return b; };
    editBar.append(
      btn('➕', 'Bigger', () => saveItem(sel, { s: Math.min(2.5, +((cur.s || 1) * 1.25).toFixed(2)) })),
      btn('➖', 'Smaller', () => saveItem(sel, { s: Math.max(0.5, +((cur.s || 1) / 1.25).toFixed(2)) })),
      btn('↔️', 'Flip', () => saveItem(sel, { f: !cur.f })),
      el('p', { class: 'bubble' }, sel ? NAMES[sel] || sel : 'Tap a friend, then drag it!'));
  };

  const trailHost = el('div');
  const drawTrail = () => {
    const nx = nextScene(total);
    const prev = [...open].pop().at;
    const pct = nx ? Math.round(((total - prev) / (nx.at - prev)) * 100) : 100;
    trailHost.replaceChildren(el('div', { class: 'panel' },
      el('h3', {}, nx ? `🛤️ Trail to ${nx.name}` : '🛤️ You found every place!'),
      el('div', { class: 'trail' }, `${open[open.length - 1].icon}`, el('div', { class: 'bar' }, el('i', { style: { width: `${pct}%` } })), nx ? nx.icon : '🏆'),
      nx && el('div', { class: 'bar-note' }, el('span', {}, `${total} stickers`), el('span', {}, `${nx.at - total} to go`))));
  };

  const daily = dailyToday();
  const goal = goalProgress();
  const panels = el('div', {},
    el('div', { class: 'panel' }, el('h3', {}, '🔎 Today\'s sticker hunt'),
      el('div', { class: 'pips' }, ...Array.from({ length: DAILY_NEED }, (_, i) => el('span', { class: i < daily.games.length ? 'on' : '' }, '🎮')), el('span', { class: daily.claimed ? 'on' : '' }, '🎁')),
      el('div', { class: 'bar-note' }, el('span', {}, daily.claimed ? 'You did it! 🎉' : `Play ${DAILY_NEED} different games for a gift!`))),
    goal && el('div', { class: 'panel' }, el('h3', {}, `${goal.icon} ${goal.label}`),
      el('div', { class: 'bar' }, el('i', { style: { width: `${Math.round((goal.have / goal.need) * 100)}%` } })),
      el('div', { class: 'bar-note' }, el('span', {}, goal.reached ? 'You did it! Show a grown-up! 🎉' : `${goal.left} more ${goal.left === 1 ? 'sticker' : 'stickers'}`))));

  const say2 = (e, node) => {
    node.classList.remove('wiggle'); void node.offsetWidth; node.classList.add('wiggle');
    sfx.tap(); speak(NAMES[e] || e);
  };
  const collections = el('div');
  const drawCollections = () => {
    collections.replaceChildren(...SETS.map((set) => {
      const n = setCount(set, have), done = n === set.members.length;
      return el('div', { class: `set${done ? ' done' : ''}` },
        el('div', { class: 'set-head' }, el('span', {}, set.icon), el('span', {}, set.name), el('div', { class: 'bar' }, el('i', { style: { width: `${(n / 5) * 100}%` } })), el('span', {}, `${n}/5`)),
        el('div', { class: 'set-row' },
          ...set.members.map((e) => {
            const got = have.includes(e);
            const c = el('button', { class: `sticker${got ? '' : ' locked'}${(st().shinies || []).includes(e) ? ' shiny' : ''}`, 'aria-label': got ? NAMES[e] : 'Not found yet' }, e);
            c.addEventListener('click', () => (got ? say2(e, c) : (sfx.tap(), speak('Play a game to find this one!'))));
            return c;
          }),
          el('button', { class: 'sticker bonus', 'aria-label': done ? set.bonus.name : 'Finish the set for a surprise' }, done ? set.bonus.emoji : '🎁')));
    }));
  };

  const hint = el('p', { class: 'rare-hint', role: 'status' }, 'Rare stickers are hard to find! Tap a ❓ for a hint.');
  const rareGrid = el('div', { class: 'sticker-grid rare-grid' }, RARE.map((r) => {
    const got = have.includes(r.emoji);
    const cell = el('button', { class: `sticker ${r.rarity}${got ? '' : ' mystery'}`, 'aria-label': got ? `${r.name}, ${r.rarity} sticker` : `A ${r.rarity} sticker not found yet` }, got ? r.emoji : '❓');
    cell.addEventListener('click', () => {
      hint.textContent = got ? `${r.emoji} ${r.name}: ${r.hint}` : `Hint: ${r.hint}`;
      if (got) say2(r.emoji, cell);
      else { sfx.tap(); speak(`This is ${r.rarity === 'legendary' ? 'a legendary' : 'a rare'} sticker. Can you find it?`); }
    });
    return cell;
  }));

  const commons = ownedCommon().length, rares = ownedRare().length;
  const drawAll = () => { drawTrail(); drawCollections(); };
  say(commons === STICKERS.length && rares === RARE.length ? 'You found them all! 🎉'
    : have.length ? 'Look how your world is growing! Tap your friends.' : 'Finish a game to put the first friend in your world!');

  root.append(
    el('header', { class: 'topbar' },
      el('button', { class: 'icon-btn', 'aria-label': 'Home', onclick: onHome }, '🏠'),
      el('h2', { class: 'book-title' }, '🌈 My World'),
      el('div', { class: 'topbar-right' }, el('div', { class: 'star-count' }, `${commons} / ${STICKERS.length}`), soundToggle())),
    el('div', { class: 'world-row' }, guide(have.length ? 'happy' : 'think', 90, 'world-pip', st().character), bubble),
    placesHost, sceneHost, editBar, toolsHost, trailHost, panels,
    el('h3', { class: 'collection-title' }, 'My collections'), collections,
    el('h3', { class: 'collection-title rare-title' }, `✨ Rare & legendary stickers  ${rares} / ${RARE.length}`), hint, rareGrid);

  drawPlaces(); mountScene(); drawTools(); drawAll();

  if (newest) {
    const name = NAMES[newest] || '';
    say(`${NEW_FRIEND_LINE} ${name}`);
    speak([NEW_FRIEND_LINE, name]);
    const item = sceneHost.querySelector('.newest');
    setTimeout(() => item && burstAt(item, 50), 1200);
  }
  return () => live?.stop();
}
