// The living scene: friends that move on their own, react (and make sounds) when tapped, follow the time of day,
// get rained on and then see a rainbow, and can be dragged around in decorate mode.
import { el, pick } from '../core/util.js';
import { guide } from '../core/guide.js';
import { speak } from '../core/voice.js';
import { sfx } from '../core/sfx.js';
import { SKY, behaviorOf, phaseOf, PIP_WORLD_LINES } from './data.js';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
// A steady scatter: the same friend always starts in the same spot, so her world doesn't shuffle when she gets a new one.
const hash = (str, salt) => {
  let h = 2166136261 ^ salt;
  for (const ch of str) { h = Math.imul(h ^ ch.codePointAt(0), 16777619) >>> 0; }
  h ^= h >>> 13; h = Math.imul(h, 1274126177) >>> 0;
  return (h >>> 8) / 16777216;
};
// Sky friends start between the moon (left) and the sun (right) so both stay easy to tap.
export const defaultSpot = (emoji) => (SKY.has(emoji)
  ? { x: 30 + hash(emoji, 1) * 40, y: 6 + hash(emoji, 2) * 32 }
  : { x: 6 + hash(emoji, 3) * 88, y: 54 + hash(emoji, 4) * 38 });
export const baseSize = (emoji, y) => (SKY.has(emoji) ? 9 : 7.5 + ((y - 52) / 40) * 6);

/** items: [{ emoji, name, shiny, rarity }]. layout(): the saved { emoji: { x, y, s, f, away } }, read fresh each time
    so a friend stays where she dropped it. Tap = react, drag = move.
    Returns { node, select(emoji|null), refresh(emoji), stop() }. */
export function buildScene({ items, layout, sceneId, newest = null, onTap, onMove, onSelect, onPip, onScene, character, now = new Date() }) {
  const night = sceneId === 'space' ? 'night' : phaseOf(now);
  const nodes = new Map();
  let selected = null;
  const timers = [];

  const place = (it, node) => {
    const saved = layout()[it.emoji] || {};
    const d = defaultSpot(it.emoji);
    const x = saved.x ?? d.x, y = saved.y ?? d.y, s = saved.s ?? 1;
    node.style.left = `${x}%`; node.style.top = `${y}%`;
    node.style.fontSize = `${baseSize(it.emoji, y) * s}cqw`;
    node.style.zIndex = String(Math.round(y));
    node.firstChild.style.setProperty('--flip', saved.f ? '-1' : '1');
  };

  const makeItem = (it) => {
    const beh = behaviorOf(it.emoji);
    const emo = el('span', { class: `emo idle-${beh.idle}`, style: { 'animation-delay': `${-(hash(it.emoji, 9) * 4).toFixed(2)}s` } }, it.emoji);
    const node = el('button', { class: `scene-item${it.shiny ? ' shiny' : ''}${it.rarity ? ` ${it.rarity}` : ''}${it.emoji === newest ? ' newest' : ''}`, 'aria-label': it.name, 'data-emoji': it.emoji }, emo);
    place(it, node);
    nodes.set(it.emoji, node);
    // One gesture does both: a quick tap makes the friend react, dragging moves it (no special mode needed).
    let drag = null;
    node.addEventListener('pointerdown', (e) => {
      drag = { r: box.getBoundingClientRect(), x0: e.clientX, y0: e.clientY, moved: false };
      node.setPointerCapture(e.pointerId);
    });
    node.addEventListener('pointermove', (e) => {
      if (!drag) return;
      if (!drag.moved && Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 8) return;
      if (!drag.moved) { drag.moved = true; node.classList.add('lifted'); api.select(it.emoji); sfx.tap(); }
      const x = Math.max(3, Math.min(97, ((e.clientX - drag.r.left) / drag.r.width) * 100));
      const y = Math.max(5, Math.min(95, ((e.clientY - drag.r.top) / drag.r.height) * 100));
      node.style.left = `${x}%`; node.style.top = `${y}%`; node.style.zIndex = '999';
      drag.x = x; drag.y = y;
    });
    const react = () => {
      for (const c of ['jump', 'spin', 'grow', 'shake', 'zoom', 'wiggle']) emo.classList.remove(`tap-${c}`);
      void emo.offsetWidth;
      emo.classList.add(`tap-${beh.tap}`);
      sfx.critter(beh.sound);
      api.select(api.selected === it.emoji ? null : it.emoji);
      onTap?.(it, node);
    };
    const end = (cancel) => {
      if (!drag) return;
      const d = drag; drag = null;
      node.classList.remove('lifted');
      // Save even when the browser cancels the touch (iPhone can do that mid-drag), so the friend stays put.
      if (d.moved && d.x != null) {
        onMove?.(it.emoji, { x: Math.round(d.x * 10) / 10, y: Math.round(d.y * 10) / 10 });
        place(it, node); node.classList.add('dropped'); setTimeout(() => node.classList.remove('dropped'), 400);
        // Three friends close together make a party (a secret).
        const near = [...nodes.values()].filter((n) => n !== node && n.isConnected
          && Math.abs(parseFloat(n.style.left) - d.x) < 10 && Math.abs(parseFloat(n.style.top) - d.y) < 10);
        if (near.length >= 2) onScene?.('party', [node, ...near]);
      } else if (!cancel) react();
    };
    // Belt and braces for iPhone: never let a finger on a friend scroll the page or start a text selection.
    node.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
    node.addEventListener('pointerup', () => end(false));
    node.addEventListener('pointercancel', () => end(true));
    node.addEventListener('lostpointercapture', () => end(true));
    node.addEventListener('click', (e) => { if (e.detail === 0) react(); }); // keyboard (Enter / Space)
    return node;
  };

  const pip = el('button', { class: 'scene-pip', 'aria-label': 'Pip' }, guide('happy', 64, '', character));
  pip.addEventListener('click', () => {
    pip.classList.remove('hop'); void pip.offsetWidth; pip.classList.add('hop');
    sfx.tap();
    if (onPip?.(pip)) return; // the page decided what Pip says
    speak(pick(PIP_WORLD_LINES));
  });

  // Bits of the world that can be poked (some of them hide secrets).
  const poke = (kind, cls) => {
    const n = el('div', { class: `${cls} pokeable` });
    n.addEventListener('pointerdown', (e) => { e.stopPropagation(); api.select(null); n.classList.remove('poked'); void n.offsetWidth; n.classList.add('poked'); sfx.critter(kind === 'dig' ? 'thump' : 'sparkle'); onScene?.(kind, n); });
    return n;
  };
  const sky = el('div', { class: 'scene-sky' }, poke('sun', 'scene-sun'), poke('stars', 'scene-stars'), poke('moon', 'scene-moon'),
    poke('cloud', 'scene-cloud c1'), poke('cloud', 'scene-cloud c2'));
  const fx = el('div', { class: 'scene-fx', 'aria-hidden': 'true' });
  const rain = el('div', { class: 'scene-rain' });
  const rainbow = poke('rainbow', 'scene-rainbow');
  const box = el('div', { class: `scene scene-${sceneId} phase-${night}`, role: 'group', 'aria-label': 'Your world' },
    sky, el('div', { class: 'scene-hill back' }), poke('dig', 'scene-hill front'), rainbow, rain,
    items.filter((i) => !(layout()[i.emoji] || {}).away).map(makeItem), pip, fx);
  box.addEventListener('pointerdown', (e) => { if (e.target === box || e.target.classList.contains('scene-hill') || e.target.classList.contains('scene-sky')) api.select(null); });

  // Light rain, then a rainbow (never at night, in space, or when motion is reduced).
  if (!reduced() && night !== 'night' && sceneId !== 'space') {
    const cycle = () => {
      box.classList.add('raining');
      timers.push(setTimeout(() => { box.classList.remove('raining'); box.classList.add('rainbowing'); }, 7000));
      timers.push(setTimeout(() => { box.classList.remove('rainbowing'); timers.push(setTimeout(cycle, 70000)); }, 17000));
    };
    timers.push(setTimeout(cycle, 22000));
  }

  const api = {
    node: box,
    select(emoji) {
      for (const n of nodes.values()) n.classList.remove('selected');
      selected = emoji && nodes.has(emoji) ? emoji : null;
      if (selected) nodes.get(selected).classList.add('selected');
      onSelect?.(selected);
    },
    get selected() { return selected; },
    refresh(emoji) { const n = nodes.get(emoji); const it = items.find((i) => i.emoji === emoji); if (n && it) place(it, n); },
    stop() { timers.forEach(clearTimeout); },
    /** Magic: make something happen across the whole world. */
    effect(id) {
      const add = (cls, txt, style, ms = 4200) => { const n = el('span', { class: `fx ${cls}`, style }, txt); fx.append(n); timers.push(setTimeout(() => n.remove(), ms)); };
      const many = (cls, list, count, dur = [2.5, 4]) => {
        for (let i = 0; i < count; i++) {
          add(cls, list[i % list.length], { left: `${Math.random() * 96}%`, 'animation-delay': `${(Math.random() * 1.6).toFixed(2)}s`, 'animation-duration': `${(dur[0] + Math.random() * (dur[1] - dur[0])).toFixed(2)}s`, 'font-size': `${5 + Math.random() * 4}cqw` }, (dur[1] + 2) * 1000);
        }
      };
      const whole = (cls, ms) => { box.classList.remove(cls); void box.offsetWidth; box.classList.add(cls); timers.push(setTimeout(() => box.classList.remove(cls), ms)); };
      if (id === 'bubbles') many('fx-rise', ['🫧'], 22);
      else if (id === 'snow') many('fx-fall', ['❄️', '❄️', '⛄'], 28);
      else if (id === 'hearts') many('fx-rise', ['💖', '💗', '💕', '💓'], 22);
      else if (id === 'stars') many('fx-shoot', ['🌠', '⭐', '✨'], 20, [1.4, 2.4]);
      else if (id === 'fireworks') {
        for (let i = 0; i < 9; i++) add('fx-boom', ['🎆', '🎇', '✨'][i % 3], { left: `${10 + Math.random() * 80}%`, top: `${8 + Math.random() * 40}%`, 'animation-delay': `${(i * 0.35).toFixed(2)}s` }, 6000);
      } else if (id === 'dragon') add('fx-fly', '🐉', {}, 5200);
      else if (id === 'float') whole('zero-g', 4200);
      else if (id === 'wish') { whole('wishing', 2600); many('fx-fall', ['✨', '⭐', '💫'], 18, [1.5, 2.5]); }
      else if (id === 'disco') whole('disco', 5000);
    },
  };
  return api;
}
