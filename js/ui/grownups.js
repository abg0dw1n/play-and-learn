// The grown-ups corner: opened by pressing and holding the button on the home screen.
// Everything that isn't for her lives here (name, challenge level, look, voice check, worksheets, progress).
import { el } from '../core/util.js';
import { store, levelCap, DIFFICULTY_NAMES } from '../core/store.js';
import { sfx } from '../core/sfx.js';
import { owned, STICKERS } from '../core/stickers.js';
import { THEMES, setTheme, currentTheme } from '../core/themes.js';
import { games } from '../games/index.js';
import { speak } from '../core/voice.js';
import { CHARACTERS, guide, setPose } from '../core/guide.js';
import { hasPin, startLock, changePin } from '../core/lock.js';

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

  // Pip's voice
  const voiceRow = el('div', { class: 'diff-row' });
  const voices = [['heart', 'Heart'], ['bella', 'Bella']];
  voices.forEach(([id, label]) => {
    const b = el('button', { type: 'button', class: `diff-btn${s.ttsVoice === id || (!s.ttsVoice && id === 'heart') ? ' on' : ''}`, 'aria-pressed': String(s.ttsVoice === id) }, `🎙️ ${label}`);
    b.addEventListener('click', () => {
      store.set({ ttsVoice: id });
      voiceRow.querySelectorAll('.diff-btn').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      sfx.tap();
      speak("Hi! I'm Pip. What do you want to play?", { force: true });
    });
    voiceRow.append(b);
  });

  // Pip's look (character design)
  const charGrid = el('div', { class: 'char-grid' });
  const charState = { id: s.character || 'bunny' };
  CHARACTERS.forEach((c) => {
    const thumb = guide('happy', 64, 'char-thumb', c.id);
    const opt = el('button', {
      type: 'button', class: `char-opt${c.id === charState.id ? ' on' : ''}`, 'aria-pressed': String(c.id === charState.id),
    }, thumb, el('span', { class: 'char-name' }, c.name));
    opt.addEventListener('click', () => {
      if (charState.id === c.id) return;
      charState.id = c.id;
      store.set({ character: c.id });
      charGrid.querySelectorAll('.char-opt').forEach((o) => o.classList.toggle('on', o === opt));
      charGrid.querySelectorAll('.char-opt').forEach((o) => o.setAttribute('aria-pressed', String(o === opt)));
      sfx.yes();
      setPose(thumb, 'cheer', c.id);
      setTimeout(() => setPose(thumb, 'happy', c.id), 1200);
    });
    charGrid.append(opt);
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
      el('h3', {}, 'Pip the…'), charGrid,
      el('h3', {}, "Pip's voice"), voiceRow,
      el('h3', {}, 'Play lock'),
      el('p', { class: 'lock-note' }, 'Keeps her in the games: no Grown-ups corner, printing or worksheets, and the back button stays in the app. A PIN (press and hold the little 🔒) unlocks it.'),
      el('button', { type: 'button', class: 'sc-link', onclick: () => dialog.close('lock') }, hasPin() ? '🔒 Lock the app for play' : '🔒 Set a PIN and lock the app'),
      hasPin() && el('button', { type: 'button', class: 'sc-link', onclick: () => changePin() }, '🔑 Change PIN'),
      el('details', { class: 'lock-tip' }, el('summary', {}, 'Want to lock the whole phone too?'),
        el('p', {}, 'iPhone/iPad: Settings → Accessibility → Guided Access, turn it on, then triple-click the side button inside Play & Learn. Android: Settings → Security → App pinning (also called Screen pinning), then pin Play & Learn from the recent apps screen.')),
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
    else if (dialog.returnValue === 'lock') startLock().then((ok) => (ok ? go('#/') : done()));
    else done();
  });
  document.body.append(dialog);
  dialog.showModal();
}
