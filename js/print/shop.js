// "Print & Color": printable fun sheets (and the colour-by sheets can be coloured right on the screen too).
import { el } from '../core/util.js';
import { store } from '../core/store.js';
import { sfx } from '../core/sfx.js';
import { burst } from '../core/confetti.js';
import { SHEETS } from './sheets.js';
import { PRACTICE } from './practice.js';

export function renderPrintShop(root, { onHome }) {
  root.className = 'screen pr-screen';
  root.style.removeProperty('--accent');
  let open = null; // which sheet type is showing, or null for the menu
  let diff = store.getDifficulty();

  const grid = (list, color) => el('section', { class: 'tiles pr-ui' }, list.map((s) =>
    el('button', { class: 'tile', style: { '--accent': color }, onclick: () => { sfx.tap(); show(s); } },
      el('span', { class: 'tile-emoji' }, s.emoji),
      el('span', { class: 'tile-title' }, s.title),
      el('span', { class: 'tile-blurb' }, s.blurb))));

  function menu() {
    open = null;
    root.innerHTML = '';
    root.append(
      el('header', { class: 'topbar pr-ui' },
        el('button', { class: 'icon-btn', 'aria-label': 'Home', onclick: onHome }, '🏠'),
        el('h2', { class: 'ws-title' }, 'Print & Color'),
        el('div', { class: 'ws-top-gap' })),
      el('p', { class: 'home-sub pr-ui' }, 'Pick a page! Print it, or color it right here.'),
      el('h3', { class: 'pr-group pr-ui' }, '📚 Practice pages'),
      grid(PRACTICE, '#4d96ff'),
      el('h3', { class: 'pr-group pr-ui' }, '🎨 Fun pages'),
      grid(SHEETS, '#ff7aa8'));
  }

  function show(sheet) {
    open = sheet;
    const made = sheet.make(diff);
    root.innerHTML = '';
    const holder = el('div', { class: 'pr-sheet' });
    holder.innerHTML = made.svg;
    const svg = holder.querySelector('svg');
    const note = el('p', { class: 'pr-note pr-ui' }, made.interactive ? 'Tap a color, then tap the boxes to color them!' : 'Tap Print to send it to a printer.');
    let showingKey = false;
    const keyBtn = made.answerSvg && el('button', { class: 'big-btn home', onclick: () => {
      showingKey = !showingKey; holder.innerHTML = showingKey ? made.answerSvg : made.svg;
      keyBtn.textContent = showingKey ? '📄 Back to the page' : '✅ Answers (grown-ups)';
    } }, '✅ Answers (grown-ups)');
    root.append(
      el('header', { class: 'topbar pr-ui' },
        el('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: menu }, '⬅️'),
        el('h2', { class: 'ws-title' }, sheet.title),
        el('div', { class: 'ws-top-gap' })),
      note, holder,
      el('div', { class: 'pr-actions pr-ui' },
        el('button', { class: 'big-btn', onclick: () => window.print() }, '🖨️ Print'),
        el('button', { class: 'big-btn home', onclick: () => { sfx.tap(); show(sheet); } }, '🔄 New one'),
        keyBtn));
    if (made.interactive) colorOnScreen(svg, note);
  }

  menu();
  return () => { open = null; };
}

/* Color-by sheets: pick a crayon (the circles at the bottom), then tap boxes with that number/word/sum. */
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
