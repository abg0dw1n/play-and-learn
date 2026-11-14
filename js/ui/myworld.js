// My World: a living scene she can arrange, places to unlock, collections, a daily hunt, gift boxes,
// hidden secrets, magic powers, a magic egg and things for Pip to wear.
import { el } from '../core/util.js';
import { store } from '../core/store.js';
import { speak, soundToggle } from '../core/voice.js';
import { sfx } from '../core/sfx.js';
import { burstAt } from '../core/confetti.js';
import { guide, applyHat, CHARACTERS } from '../core/guide.js';
import { owned, ownedCommon, ownedRare, STICKERS, RARE } from '../core/stickers.js';
import { RARE_EMOJIS, rarityOf } from '../core/rare.js';
import { SETS, setCount, SCENES, unlockedScenes, nextScene, decorName, DECOR, BONUS_DECOR } from '../world/data.js';
import { isLocked } from '../core/lock.js';
import { buildScene } from '../world/scene.js';
import { openGiftBox } from '../world/gift.js';
import { dailyToday, goalProgress, DAILY_NEED } from '../world/progress.js';
import { SECRETS, HATS, POWERS, TREASURES, allCreatures, isLegendaryCreature, findSecret, foundSecrets, hatsOwned, powersOwned, treasuresOwned, eggState, hatchEgg } from '../world/secrets.js';
import { celebrateSecrets, celebrateHatch } from '../world/celebrate.js';

const NAMES = Object.fromEntries([...STICKERS, ...RARE.map((r) => [r.emoji, r.name]), ...[...DECOR, ...BONUS_DECOR, ...TREASURES, ...allCreatures()].map((d) => [d.emoji, d.name])]);
// Taps needed on a part of the world to find its secret.
const POKES = { sun: 3, moon: 3, cloud: 3, stars: 3, dig: 5, rainbow: 1 };
export const eggLine = (left) => `Play ${left} more ${left === 1 ? 'game' : 'games'} to hatch your egg!`;
const NEW_FRIEND_LINE = 'Look! A new friend!';

let activeStop = null;

export function renderMyWorld(root, opts) {
  const { onHome, onPrint } = opts;
  const have = owned();
  const st = () => store.get();
  const total = have.length;
  const open = unlockedScenes(total);
  let sceneId = open.some((s) => s.id === st().world?.scene) ? st().world.scene : 'meadow';
  let live = null; // the running scene
  let newest = st().newest || null;
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
    ...(st().hatched || []).map((e) => ({ emoji: e, name: NAMES[e] || e, rarity: isLegendaryCreature(e) ? 'legendary' : null })),
    ...treasuresOwned().map((t) => ({ emoji: t.emoji, name: t.name })),
  ];
  if (newest && !itemList().some((i) => i.emoji === newest)) newest = null;

  const rerender = () => { live?.stop(); renderMyWorld(root, opts); };
  // A secret found: celebrate it, then redraw (it may have given a hat, magic or a treasure).
  const secret = (id) => {
    if (document.querySelector('.secret-overlay')) { setTimeout(() => root.isConnected && secret(id), 1500); return false; } // one celebration at a time
    const found = findSecret(id);
    if (found.length) { live?.stop(); celebrateSecrets(found, rerender); }
    return found.length > 0;
  };
  const pokes = {};
  let pipTaps = [];
  const unfound = () => SECRETS.filter((x) => x.id !== 'all' && !foundSecrets().includes(x.id));

  const bubble = el('p', { class: 'bubble' }, '');
  const say = (t) => { bubble.textContent = t; };
  const sceneHost = el('div', { class: 'scene-host' });
  const toolsHost = el('div', { class: 'world-tools' });
  const placesHost = el('div', { class: 'places' });
  const editBar = el('div', { class: 'world-tools' });

  const mountScene = () => {
    live?.stop();
    live = buildScene({
      items: itemList(), layout: () => st().world.items, sceneId, newest,
      onTap: (it) => { speak(it.name); say(it.name); },
      onMove: (e, pos) => saveItem(e, pos),
      onSelect: () => drawEdit(),
      character: st().character,
      onScene: (kind, node) => {
        if (kind === 'party') { if (!foundSecrets().includes('party')) { node.forEach((n) => n.classList.add('dropped')); speak('Party time!'); setTimeout(() => secret('party'), 900); } return; }
        pokes[kind] = (pokes[kind] || 0) + 1;
        if (pokes[kind] >= POKES[kind]) secret(kind);
      },
      onPip: (pipNode) => {
        const now = Date.now();
        pipTaps = [...pipTaps.filter((t) => now - t < 4000), now];
        if (pipTaps.length >= 5 && !foundSecrets().includes('pipdance')) {
          pipNode.classList.add('dance'); speak('Pip is dancing!'); setTimeout(() => secret('pipdance'), 1600); return true;
        }
        const left = unfound();
        if (left.length && Math.random() < 0.5) { const h = left[Math.floor(Math.random() * left.length)]; say(`Psst! ${h.hint}`); speak(['Psst!', h.hint]); return true; }
        return false;
      },
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
        visit(s.id);
      });
      return b;
    }));
  };

  const visit = (id) => {
    const v = st().visited || [];
    const seen = v.includes(id) ? v : [...v, id];
    if (seen !== v) store.set({ visited: seen });
    if (open.length >= 2 && open.every((o) => seen.includes(o.id))) setTimeout(() => secret('traveler'), 1200);
  };

  // ---- magic, the egg, Pip's wardrobe and the secrets list ----
  const magicPanel = () => {
    const mine = powersOwned(owned()).map((p) => p.id);
    return el('div', { class: 'panel' }, el('h3', {}, `🪄 Magic  ${mine.length} / ${POWERS.length}`),
      el('div', { class: 'magic-row' }, POWERS.map((p) => {
        const has = mine.includes(p.id);
        const b = el('button', { class: `magic-btn${has ? '' : ' locked'}`, 'aria-label': has ? p.name : 'Locked magic' }, has ? p.emoji : '🔒');
        b.addEventListener('click', () => {
          if (!has) { sfx.tap(); speak('Find secrets and legendary stickers to unlock more magic!'); say('Find secrets and legendary stickers to unlock more magic!'); return; }
          sfx.critter('sparkle'); live?.effect(p.id); speak(p.name); say(`${p.emoji} ${p.name}!`);
          sceneHost.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        return b;
      })));
  };
  const eggPanel = () => {
    const e = eggState();
    if (e.done) return el('div', { class: 'panel egg-panel' }, el('h3', {}, '🥚 Magic egg'), el('p', {}, 'All your eggs have hatched! 🎉'));
    let taps = 0;
    const egg = el('button', { class: `egg${e.golden ? ' golden' : ''}${e.ready ? ' ready' : ''}`, 'aria-label': e.ready ? 'Tap the egg to hatch it' : 'Your magic egg' }, '🥚');
    egg.addEventListener('click', () => {
      if (!e.ready) { sfx.tap(); speak(eggLine(e.need - e.n)); return; }
      taps++; sfx.critter('click'); egg.classList.remove('cracking'); void egg.offsetWidth; egg.classList.add('cracking');
      if (taps < 3) return;
      const c = hatchEgg();
      if (!c) return;
      live?.stop();
      celebrateHatch(c, () => { const f = findSecret('hatch'); celebrateSecrets(f, rerender); });
    });
    return el('div', { class: 'panel egg-panel' }, el('h3', {}, e.golden ? '🌟 Golden magic egg' : '🥚 Magic egg'), egg,
      el('div', { class: 'egg-dots' }, Array.from({ length: e.need }, (_, i) => el('span', { class: i < e.n ? 'on' : '' }, '⭐'))),
      el('p', { class: 'bar-note' }, e.ready ? 'Tap the egg three times to hatch it!' : `Finish ${e.need - e.n} more ${e.need - e.n === 1 ? 'game' : 'games'} to hatch it.`),
      e.hatched.length ? el('p', {}, `Hatched: ${e.hatched.join(' ')}`) : null);
  };
  const wardrobePanel = () => {
    const mine = hatsOwned();
    const wear = (id, name) => {
      store.set({ hat: id }); sfx.yes();
      document.querySelectorAll('.guide').forEach((g) => applyHat(g, id));
      speak(name); root.querySelectorAll('.wear-btn').forEach((b) => b.classList.toggle('on', b.dataset.hat === String(id)));
    };
    const btn = (id, emoji, name) => { const b = el('button', { class: `wear-btn${st().hat === id ? ' on' : ''}`, 'aria-label': name, 'data-hat': String(id) }, emoji); b.addEventListener('click', () => wear(id, name)); return b; };
    // She picks which friend Pip is (also in Grown-ups).
    const pick = (c) => {
      const b = el('button', { class: `char-pick${st().character === c.id ? ' on' : ''}`, 'aria-label': c.name }, guide('happy', 52, '', c.id));
      b.addEventListener('click', () => { if (st().character === c.id) return; store.set({ character: c.id }); sfx.yes(); speak(c.name); rerender(); });
      return b;
    };
    return el('div', { class: 'panel' }, el('h3', {}, '🐾 Pick your Pip'), el('div', { class: 'char-row' }, CHARACTERS.map(pick)),
      el('h3', {}, `👗 Pip's wardrobe  ${mine.length} / ${HATS.length}`),
      el('div', { class: 'wear-row' }, btn(null, '🙂', 'No hat'), mine.map((h) => btn(h.id, h.emoji, h.name)),
        HATS.filter((h) => !mine.includes(h)).map(() => {
          const b = el('button', { class: 'wear-btn locked', 'aria-label': 'Not found yet' }, '❓');
          b.addEventListener('click', () => { sfx.tap(); speak('Find more secrets for Pip to wear!'); });
          return b;
        })));
  };
  const secretsPanel = () => {
    const found = foundSecrets();
    const note = el('p', { class: 'bar-note' }, 'Tap a ❓ for a clue!');
    return el('div', { class: 'panel secret-panel' }, el('h3', {}, `🤫 Secrets  ${found.length} / ${SECRETS.length}`),
      el('div', { class: 'secret-row' }, SECRETS.map((x) => {
        const got = found.includes(x.id);
        const b = el('button', { class: `secret-btn${got ? ' found' : ' locked'}`, 'aria-label': got ? x.name : 'Secret not found yet' }, got ? x.icon : '❓');
        b.addEventListener('click', () => { sfx.tap(); note.textContent = got ? `${x.icon} ${x.name}` : `Clue: ${x.hint}`; speak(got ? x.name : x.hint); });
        return b;
      })), note);
  };

  const drawTools = () => {
    const gifts = st().gifts || 0;
    const gift = el('button', { class: `tool-btn gift-btn${gifts ? ' has' : ''}`, 'aria-label': `Gift boxes: ${gifts}`, disabled: gifts ? null : true }, '🎁', el('small', {}, gifts ? `${gifts} to open` : 'none yet'));
    // A gift can add a sticker, a decoration or a new place, so redraw the whole page afterwards.
    gift.addEventListener('click', () => openGiftBox({ onClose: () => { live?.stop(); renderMyWorld(root, opts); } }));
    const print = onPrint && !isLocked() && el('button', { class: 'tool-btn', 'aria-label': 'Print my world poster', onclick: onPrint }, '🖨️', el('small', {}, 'Poster'));
    const reset = el('button', { class: 'tool-btn', 'aria-label': 'Tidy up my world' }, '🧹', el('small', {}, 'Tidy up'));
    reset.addEventListener('click', () => { sfx.tap(); store.set({ world: { ...st().world, items: {} } }); mountScene(); drawEdit(); speak('All tidy!'); say('All tidy!'); });
    toolsHost.replaceChildren(...[gift, reset, print].filter(Boolean)); // print is left out while play-locked
  };

  const trayHost = el('div');
  const drawEdit = () => {
    const sel = live?.selected;
    const cur = (sel && st().world.items[sel]) || {};
    editBar.replaceChildren();
    const btn = (label, aria, fn) => { const b = el('button', { class: 'tool-btn', 'aria-label': aria, disabled: sel ? null : true }, label); b.addEventListener('click', () => { sfx.tap(); fn(); }); return b; };
    const resize = (f) => () => { saveItem(sel, { s: Math.max(0.5, Math.min(2.5, +((cur.s || 1) * f).toFixed(2))) }); live.refresh(sel); drawEdit(); };
    if (!sel) { editBar.append(el('p', { class: 'world-hint' }, '👆 Drag a friend to move it. Tap it for more!')); } else editBar.append(
      btn('➕', 'Bigger', resize(1.25)), btn('➖', 'Smaller', resize(0.8)),
      btn('↔️', 'Flip', () => { saveItem(sel, { f: !cur.f }); live.refresh(sel); drawEdit(); }),
      btn('📦', 'Put away', () => { saveItem(sel, { away: true }); mountScene(); drawEdit(); }),
      el('p', { class: 'bubble' }, NAMES[sel] || sel));
    const away = Object.entries(st().world.items).filter(([, v]) => v.away).map(([e]) => e).filter((e) => itemList().some((i) => i.emoji === e));
    trayHost.replaceChildren(...(away.length ? [el('p', { class: 'tray-title' }, '📦 Put away. Tap to bring back!'), el('div', { class: 'tray' }, away.map((e) => {
      const c = el('button', { class: 'sticker', 'aria-label': `Bring back ${NAMES[e] || e}` }, e);
      c.addEventListener('click', () => { saveItem(e, { away: false, x: undefined, y: undefined }); sfx.yes(); mountScene(); drawEdit(); speak(NAMES[e] || e); });
      return c;
    }))] : []));
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
      el('div', { class: 'hunt-pips' }, ...Array.from({ length: DAILY_NEED }, (_, i) => el('span', { class: i < daily.games.length ? 'on' : '' }, '🎮')), el('span', { class: daily.claimed ? 'on' : '' }, '🎁')),
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
    placesHost, sceneHost, editBar, trayHost, toolsHost, magicPanel(), eggPanel(), wardrobePanel(), secretsPanel(), trailHost, panels,
    el('h3', { class: 'collection-title' }, 'My collections'), collections,
    el('h3', { class: 'collection-title rare-title' }, `✨ Rare & legendary stickers  ${rares} / ${RARE.length}`), hint, rareGrid);

  drawPlaces(); mountScene(); drawTools(); drawAll(); drawEdit();

  const newestShown = !!newest;
  if (newest) {
    const name = NAMES[newest] || '';
    say(`${NEW_FRIEND_LINE} ${name}`);
    speak([NEW_FRIEND_LINE, name]);
    const item = sceneHost.querySelector('.newest');
    setTimeout(() => item && burstAt(item, 50), 1200);
    newest = null; // only the first time: moving things around later shouldn't replay the arrival
  }
  // Secrets for visiting at the right time of day.
  const h = new Date().getHours();
  const timeSecret = h >= 19 || h < 5 ? 'night' : h >= 5 && h < 9 ? 'morning' : null;
  if (timeSecret && !foundSecrets().includes(timeSecret)) setTimeout(() => { if (root.isConnected) secret(timeSecret); }, newestShown ? 3500 : 1200);
  visit(sceneId);
  activeStop = () => live?.stop();
  return () => activeStop?.();
}
