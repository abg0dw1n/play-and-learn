// "Print & Color": printable fun sheets (and the colour-by sheets can be coloured right on the screen too).
import { WORLD_SHEETS } from './world.js';
import { el } from '../core/util.js';
import { store } from '../core/store.js';
import { sfx } from '../core/sfx.js';
import { soundToggle } from '../core/voice.js';
import { burst } from '../core/confetti.js';
import { SHEETS, COLORS } from './sheets.js';
import { PRACTICE } from './practice.js';
import { PIP_PAGES } from './pip-pages.js';

const isStandalone = () => window.navigator.standalone === true || window.matchMedia?.('(display-mode: standalone)').matches;

/** Draw the sheet that is on screen into a PNG (white page, 2x size) so it can be shared or printed. */
async function sheetPng(svg) {
  const [, , vw, vh] = (svg.getAttribute('viewBox') || '0 0 750 1000').split(/\s+/).map(Number);
  const W = 1500, H = Math.round(W * vh / vw);
  const clone = svg.cloneNode(true);
  clone.setAttribute('width', W); clone.setAttribute('height', H);
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const img = new Image();
    await new Promise((ok, bad) => { img.onload = ok; img.onerror = () => bad(new Error('draw')); img.src = url; });
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);
    return await new Promise((ok, bad) => canvas.toBlob((b) => (b ? ok(b) : bad(new Error('png'))), 'image/png'));
  } finally { URL.revokeObjectURL(url); }
}

/** Print the sheet. A home-screen app on iPhone ignores window.print(), so there we hand the page to the
 *  share sheet (which has Print, Save and AirDrop); anywhere else the normal print dialog opens. */
async function printSheet(svg, title, say) {
  if (!isStandalone() && typeof window.print === 'function') { window.print(); return; }
  say('Getting the page ready…');
  try {
    const file = new File([await sheetPng(svg)], `${title.replace(/[^\w]+/g, '-')}.png`, { type: 'image/png' });
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title }); say('In the share sheet, tap Print.'); } catch (e) { say(e?.name === 'AbortError' ? '' : 'Could not open the share sheet.'); }
      return;
    }
    const url = URL.createObjectURL(file);
    window.open(url, '_blank');
    say('Press and hold the page, choose Share, then Print.');
    setTimeout(() => URL.revokeObjectURL(url), 120000);
  } catch { say('Could not get the page ready. Try again.'); }
}

export function renderPrintShop(root, { onHome }) {
  root.className = 'screen pr-screen';
  root.style.removeProperty('--accent');
  let diff = store.getDifficulty();

  const grid = (list, color) => el('section', { class: 'tiles pr-ui' }, list.map((s) =>
    el('button', { class: 'tile', style: { '--accent': color }, onclick: () => { sfx.tap(); show(s); } },
      el('span', { class: 'tile-emoji' }, s.emoji),
      el('span', { class: 'tile-title' }, s.title),
      el('span', { class: 'tile-blurb' }, s.blurb))));

  function menu() {
    root.innerHTML = '';
    root.append(
      el('header', { class: 'topbar pr-ui' },
        el('button', { class: 'icon-btn', 'aria-label': 'Home', onclick: onHome }, '🏠'),
        el('h2', { class: 'ws-title' }, 'Print & Color'),
        soundToggle()),
      el('p', { class: 'home-sub pr-ui' }, 'Pick a page! Print it, or color it right here.'),
      el('h3', { class: 'pr-group pr-ui' }, '📚 Practice pages'),
      grid(PRACTICE, '#4d96ff'),
      el('h3', { class: 'pr-group pr-ui' }, '🎨 Fun pages'),
      grid(SHEETS, '#ff7aa8'),
      el('h3', { class: 'pr-group pr-ui' }, '🖍️ Coloring pages'),
      grid(PIP_PAGES, '#ffb400'),
      el('h3', { class: 'pr-group pr-ui' }, '🌈 My World'),
      grid(WORLD_SHEETS, '#43b05c'));
  }

  function show(sheet) {
    const made = sheet.make(diff);
    const crayons = el('div', { class: 'crayons pr-ui' });
    root.innerHTML = '';
    const holder = el('div', { class: 'pr-sheet' });
    holder.innerHTML = made.svg;
    const svg = holder.querySelector('svg');
    const defaultNote = made.interactive ? 'Tap a color, then tap the boxes to color them!' : made.free ? 'Pick a crayon, then tap a part of the picture. Or print it!' : 'Tap Print to send it to a printer.';
    const note = el('p', { class: 'pr-note pr-ui' }, defaultNote);
    let showingKey = false;
    const keyBtn = made.answerSvg && el('button', { class: 'big-btn home', onclick: () => {
      showingKey = !showingKey; holder.innerHTML = showingKey ? made.answerSvg : made.svg;
      keyBtn.textContent = showingKey ? '📄 Back to the page' : '✅ Answers (grown-ups)';
    } }, '✅ Answers (grown-ups)');
    root.append(
      el('header', { class: 'topbar pr-ui' },
        el('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: menu }, '⬅️'),
        el('h2', { class: 'ws-title' }, sheet.title),
        soundToggle()),
      note, ...(made.free ? [crayons] : []), holder,
      el('div', { class: 'pr-actions pr-ui' },
        el('button', { class: 'big-btn', onclick: () => printSheet(holder.querySelector('svg'), sheet.title, (t) => { note.textContent = t || defaultNote; }) }, '🖨️ Print'),
        el('button', { class: 'big-btn home', onclick: () => { sfx.tap(); show(sheet); } }, '🔄 New one'),
        keyBtn));
    if (made.interactive) colorOnScreen(svg, note);
    if (made.free) freeColor(svg, crayons);
  }

  menu();
  return () => {};
}

/* Color-by sheets: pick a crayon (the circles at the bottom), then tap boxes with that number/word/sum. */
/** Free coloring: pick any crayon, tap any part of the picture (tap again with white to erase). */
function freeColor(svg, crayons) {
  const list = [...Object.entries(COLORS), ['white', '#ffffff']];
  let color = list[0][1];
  const btns = list.map(([name, hex]) => {
    const b = el('button', { class: 'crayon', 'aria-label': name, style: { '--c': hex } });
    b.addEventListener('click', () => { color = hex; sfx.tap(); btns.forEach((x) => x.classList.toggle('on', x === b)); });
    return b;
  });
  btns[0].classList.add('on');
  crayons.replaceChildren(...btns);
  svg.querySelectorAll('.region').forEach((r) => {
    r.style.cursor = 'pointer';
    r.addEventListener('click', () => { r.setAttribute('fill', color); sfx.tap(); });
  });
}

function colorOnScreen(svg, note) {
  const keys = [...svg.querySelectorAll('.key')];
  const cells = [...svg.querySelectorAll('g[data-code]')];
  let code = keys[0]?.dataset.key;
  const mark = () => keys.forEach((k) => {
    const on = k.dataset.key === code;
    k.querySelector('.swatch').setAttribute('stroke-width', on ? '8' : '3');
    k.querySelector('.swatch').setAttribute('r', on ? '34' : '30');
  });
  mark();
  keys.forEach((k) => { k.style.cursor = 'pointer'; k.addEventListener('click', () => { code = k.dataset.key; sfx.tap(); mark(); }); });
  cells.forEach((g) => {
    g.style.cursor = 'pointer';
    g.addEventListener('click', () => {
      const rect = g.querySelector('rect');
      if (g.dataset.code !== code) {
        sfx.oops();
        rect.setAttribute('stroke', '#e63946');
        setTimeout(() => rect.setAttribute('stroke', '#2b2d42'), 450);
        return;
      }
      const color = keys.find((k) => k.dataset.key === code).dataset.color;
      if (rect.getAttribute('fill') === color) return;
      rect.setAttribute('fill', color);
      sfx.tap();
      const left = cells.filter((c) => c.querySelector('rect').getAttribute('fill') === '#fff').length;
      if (!left) {
        sfx.fanfare();
        burst({ count: 140 });
        note.textContent = '🎉 Beautiful! You colored it all!';
      }
    });
  });
}
