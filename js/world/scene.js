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
export const defaultSpot = (emoji) => (SKY.has(emoji)
  ? { x: 8 + hash(emoji, 1) * 84, y: 6 + hash(emoji, 2) * 32 }
  : { x: 6 + hash(emoji, 3) * 88, y: 54 + hash(emoji, 4) * 38 });
export const baseSize = (emoji, y) => (SKY.has(emoji) ? 9 : 7.5 + ((y - 52) / 40) * 6);

/** items: [{ emoji, name, shiny, rarity }]. layout(): the saved { emoji: { x, y, s, f, away } }, read fresh each time
    so a friend stays where she dropped it. Tap = react, drag = move.
    Returns { node, select(emoji|null), refresh(emoji), stop() }. */
export function buildScene({ items, layout, sceneId, newest = null, onTap, onMove, onSelect, onPip, now = new Date() }) {
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

  const pip = el('button', { class: 'scene-pip', 'aria-label': 'Pip' }, guide('happy', 64, '', undefined));
  pip.addEventListener('click', () => {
    pip.classList.remove('hop'); void pip.offsetWidth; pip.classList.add('hop');
    sfx.tap();
    const line = pick(PIP_WORLD_LINES);
    onPip?.(line);
    speak(line);
  });

  const sky = el('div', { class: 'scene-sky' }, el('div', { class: 'scene-sun' }), el('div', { class: 'scene-moon' }), el('div', { class: 'scene-stars' }),
    el('div', { class: 'scene-cloud c1' }), el('div', { class: 'scene-cloud c2' }));
  const rain = el('div', { class: 'scene-rain' });
  const rainbow = el('div', { class: 'scene-rainbow' });
  const box = el('div', { class: `scene scene-${sceneId} phase-${night}`, role: 'group', 'aria-label': 'Your world' },
    sky, el('div', { class: 'scene-hill back' }), el('div', { class: 'scene-hill front' }), rainbow, rain,
    items.filter((i) => !(layout()[i.emoji] || {}).away).map(makeItem), pip);
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
  };
  return api;
}
