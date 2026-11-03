// The grown-ups corner: opened by pressing and holding the button on the home screen.
// Everything that isn't for her lives here (name, challenge level, look, voice check, worksheets, progress).
import { el } from '../core/util.js';
import { store, levelCap, DIFFICULTY_NAMES } from '../core/store.js';
import { sfx } from '../core/sfx.js';
import { owned, STICKERS } from '../core/stickers.js';
import { THEMES, setTheme, currentTheme } from '../core/themes.js';
import { games } from '../games/index.js';

/** Press-and-hold so little fingers don't wander in. */
export function grownUpsButton(open) {
  let timer;
  const btn = el('button', { class: 'grownups' }, '🔒 Grown-ups (hold)');
  const start = (e) => { e.preventDefault(); btn.classList.add('holding'); timer = setTimeout(open, 1200); };
  const stop = () => { btn.classList.remove('holding'); clearTimeout(timer); };
  btn.addEventListener('pointerdown', start);
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => btn.addEventListener(ev, stop));
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  return btn;
}

/** go(hash) navigates; done() runs after the dialog closes and nothing else happened (refresh the screen). */
export function openGrownUps({ go, done }) {
  const s = store.get();
  const nameInput = el('input', { type: 'text', value: s.name, maxlength: 20, placeholder: "Child's first name", autocomplete: 'off' });

  // Challenge level
  const diffRow = el('div', { class: 'diff-row' });
  const stars = ['⭐', '⭐⭐', '⭐⭐⭐'];
  DIFFICULTY_NAMES.forEach((label, i) => {
    const b = el('button', { type: 'button', class: `diff-btn${i === store.getDifficulty() ? ' on' : ''}`, 'aria-pressed': String(i === store.getDifficulty()) }, `${stars[i]} ${label}`);
    b.addEventListener('click', () => {
      store.setDifficulty(i);
      diffRow.querySelectorAll('.diff-btn').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      levelsList.replaceChildren(...levelItems());
    });
    diffRow.append(b);
  });

  // Look
  const grid = el('div', { class: 'look-grid' });
  THEMES.forEach((t) => {
    const opt = el('button', {
      type: 'button', class: `look-opt${t.id === currentTheme().id ? ' on' : ''}`,
      style: { background: `linear-gradient(180deg, ${t.vars['--sky-1']}, ${t.vars['--sky-2']})`, color: t.vars['--bg-ink'] },
    }, el('span', { class: 'sw' }, t.emoji), t.name);
    opt.addEventListener('click', () => {
      setTheme(t.id); sfx.yes();
      grid.querySelectorAll('.look-opt').forEach((o) => o.classList.toggle('on', o === opt));
    });
    grid.append(opt);
  });

  const levelItems = () => {
    const d = store.getDifficulty();
    return [
      ...games.map((g) => el('li', {}, g.fun ? `${g.emoji} ${g.title}: played ${store.game(g.id).plays || 0}×`
        : `${g.emoji} ${g.title}: level ${Math.min(store.level(g.id, d), levelCap(g, d))} of ${levelCap(g, d)}, played ${store.game(g.id).plays || 0}×`)),
      el('li', {}, `⭐ ${store.get().stars} stars, 🌈 ${owned().length} of ${STICKERS.length} stickers`),
    ];
  };
  const levelsList = el('ul', {}, levelItems());

  const dialog = el('dialog', { class: 'settings grownups-dialog', style: { '--accent': '#4d96ff' } },
    el('form', { method: 'dialog' },
      el('h2', {}, 'Grown-ups'),
      el('label', {}, 'Name (used in the "Great job" cheer)', nameInput),
      el('h3', {}, 'Challenge level'), diffRow,
      el('h3', {}, 'Look'), grid,
      el('h3', {}, 'More'),
      // type=button so pressing Enter in the name box saves (Done) instead of opening a link
      el('button', { type: 'button', class: 'sc-link', onclick: () => dialog.close('soundcheck') }, '🔊 Sound Check: voice and letter sounds'),
      el('button', { type: 'button', class: 'sc-link', onclick: () => dialog.close('worksheets') }, '📄 My Worksheets: upload her school sheets'),
      el('h3', {}, 'Progress on this device'), levelsList,
      el('div', { class: 'settings-actions' },
        el('button', { type: 'button', class: 'link-danger', onclick: () => {
          if (confirm('Reset stars, stickers and levels on this device?')) { store.reset(); dialog.close(); }
        } }, 'Reset progress'),
        el('button', { value: 'save', class: 'big-btn' }, 'Done'))));

  dialog.addEventListener('close', () => {
    if (dialog.returnValue) store.set({ name: nameInput.value.trim() });
    dialog.remove();
    if (dialog.returnValue === 'soundcheck') go('#/sound-check');
    else if (dialog.returnValue === 'worksheets') go('#/worksheets');
    else done();
  });
  document.body.append(dialog);
  dialog.showModal();
}
