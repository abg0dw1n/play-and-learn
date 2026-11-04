// My Worksheets — the grown-ups' hub. Parents sign in with a passcode, add photos or scans of her
// school sheets, and see them on any device. (Reading and editing the words comes next.)
import { el } from '../core/util.js';
import { api, token, prepareFile } from './api.js';
import { soundToggle } from '../core/voice.js';

const dateText = (iso) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/** Shared page frame: a top bar with Home, a title and optional right-hand button. */
function frame(root, { title, onBack, backLabel = '🏠', right }) {
  root.innerHTML = '';
  root.className = 'screen ws';
  root.style.removeProperty('--accent');
  const body = el('div', { class: 'ws-body' });
  root.append(
    el('header', { class: 'topbar ws-top' },
      el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Back', onclick: onBack }, backLabel),
      el('h2', { class: 'ws-title' }, title),
      el('div', { class: 'topbar-right' }, right, soundToggle())),
    body);
  return body;
}

const note = (text, kind = '') => el('p', { class: `ws-note ${kind}` }, text);

/** Pick photos. "camera" opens the phone camera; the other picks from the photo library or files. */
function pickers(onFiles) {
  const camera = el('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'ws-hidden' });
  const library = el('input', { type: 'file', accept: 'image/*,application/pdf', multiple: true, class: 'ws-hidden' });
  for (const input of [camera, library]) {
    input.addEventListener('change', async () => {
      // Copy each file into memory right away: phones can drop the original once the picker closes.
      const files = [];
      for (const f of [...input.files]) {
        try { files.push(new File([await f.arrayBuffer()], f.name, { type: f.type })); } catch { /* unreadable: skip it */ }
      }
      input.value = ''; // so choosing the same photo again still counts
      if (files.length) onFiles(files);
    });
  }
  return {
    nodes: [camera, library],
    buttons: el('div', { class: 'ws-pick' },
      el('button', { type: 'button', class: 'big-btn ws-btn', onclick: () => camera.click() }, '📷 Take a photo'),
      el('button', { type: 'button', class: 'big-btn ws-btn alt', onclick: () => library.click() }, '🖼️ Choose photos or PDF')),
  };
}

/** Prepare and upload files one at a time so a bad connection only costs one page. */
async function uploadAll(id, items, setStatus) {
  const todo = items.filter((i) => !i.done);
  for (let n = 0; n < todo.length; n++) {
    const item = todo[n];
    setStatus(`Uploading page ${n + 1} of ${todo.length}…`);
    const { blob, name } = await prepareFile(item.file);
    await api.addPage(id, blob, name);
    item.done = true;
  }
}

/* ------------------------------------------------------------------ hub */
export function renderWorksheets(root, { onHome, onOpen, onPrint }) {
  let alive = true;
  const urls = [];
  const cleanup = () => { alive = false; urls.forEach((u) => URL.revokeObjectURL(u)); };

  async function start() {
    if (token.get()) return showHub();
    const body = frame(root, { title: 'Grown-ups', onBack: onHome });
    body.append(note('Checking…'));
    try {
      const has = await api.status();
      if (!alive) return;
      showGate(has);
    } catch (e) {
      if (!alive) return;
      body.innerHTML = '';
      body.append(note(e.message, 'bad'), el('button', { class: 'big-btn ws-btn', type: 'button', onclick: start }, 'Try again'));
    }
  }

  function showGate(hasPasscode) {
    const body = frame(root, { title: hasPasscode ? 'Grown-ups only' : 'Set a parent passcode', onBack: onHome });
    const pass = el('input', { type: 'password', class: 'ws-input', placeholder: hasPasscode ? 'Passcode' : 'Choose a passcode (8 or more)', autocomplete: hasPasscode ? 'current-password' : 'new-password', 'aria-label': 'Passcode' });
    const again = hasPasscode ? null : el('input', { type: 'password', class: 'ws-input', placeholder: 'Type it again', autocomplete: 'new-password', 'aria-label': 'Passcode again' });
    const msg = el('p', { class: 'ws-note' });
    const go = el('button', { type: 'submit', class: 'big-btn ws-btn' }, hasPasscode ? 'Open' : 'Save passcode');
    const form = el('form', { class: 'ws-gate' },
      hasPasscode
        ? note('This part is for parents. Enter your passcode.')
        : note('Pick a passcode only the grown-ups know. You will type it once on each phone or tablet you use.'),
      pass, again, go, msg);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.className = 'ws-note';
      if (!hasPasscode && pass.value !== again.value) { msg.textContent = 'The two passcodes are different.'; msg.className = 'ws-note bad'; return; }
      go.disabled = true;
      msg.textContent = 'One moment…';
      try {
        await (hasPasscode ? api.login(pass.value) : api.setup(pass.value));
        if (alive) showHub();
      } catch (err) {
        if (!alive) return;
        go.disabled = false;
        msg.textContent = err.message;
        msg.className = 'ws-note bad';
        if (err.status === 409) start(); // someone set it a moment ago: ask for it instead
      }
    });
    body.append(form);
    setTimeout(() => pass.focus(), 50);
  }

  function lock() { token.clear(); start(); }

  async function showHub() {
    const lockBtn = el('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Lock', onclick: lock }, '🔒');
    const body = frame(root, { title: 'My Worksheets', onBack: onHome, right: lockBtn });
    const pending = [];
    let createdId = null;
    if (onPrint) body.append(el('button', { class: 'big-btn ws-btn print-link', type: 'button', onclick: onPrint }, '🖨️ Print practice pages'));

    const preview = el('div', { class: 'ws-previews' });
    const status = el('p', { class: 'ws-note' });
    const titleInput = el('input', { type: 'text', class: 'ws-input', placeholder: 'Name (optional), like "Letter sounds"', maxlength: 120, 'aria-label': 'Worksheet name' });
    const saveBtn = el('button', { type: 'button', class: 'big-btn ws-btn save', disabled: true }, '⬆️ Save worksheet');
    const picks = pickers((files) => { for (const f of files) addPending(f); });

    function addPending(file) {
      if (pending.length >= 20) { status.textContent = 'A worksheet can have up to 20 pages.'; status.className = 'ws-note bad'; return; }
      const isPdf = file.type === 'application/pdf' || /\.pdf$/i.test(file.name);
      const url = isPdf ? null : URL.createObjectURL(file);
      if (url) urls.push(url);
      pending.push({ file, url, isPdf, done: false });
      drawPending();
    }
    function drawPending() {
      preview.innerHTML = '';
      pending.forEach((p, i) => preview.append(el('div', { class: 'ws-thumb' },
        p.isPdf ? el('div', { class: 'ws-pdf' }, '📄 PDF') : el('img', { src: p.url, alt: `Page ${i + 1}` }),
        el('span', { class: 'ws-pagenum' }, i + 1),
        p.done ? null : el('button', { type: 'button', class: 'ws-x', 'aria-label': `Remove page ${i + 1}`, onclick: () => { pending.splice(i, 1); drawPending(); } }, '✕'))));
      saveBtn.disabled = !pending.length;
      saveBtn.textContent = createdId ? '⬆️ Try again' : '⬆️ Save worksheet';
    }

    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      status.className = 'ws-note';
      try {
        status.textContent = 'Starting…';
        if (!createdId) createdId = (await api.create(titleInput.value)).id;
        await uploadAll(createdId, pending, (t) => { if (alive) status.textContent = t; });
        if (alive) onOpen(createdId);
      } catch (e) {
        if (!alive) return;
        if (e.status === 401) return start();
        status.textContent = `${e.message} ${createdId ? 'Pages already uploaded are saved.' : ''}`;
        status.className = 'ws-note bad';
        saveBtn.disabled = false;
        drawPending();
      }
    });

    const add = el('section', { class: 'ws-add' },
      el('h3', {}, '➕ Add a worksheet'),
      picks.buttons, ...picks.nodes, preview, titleInput, saveBtn, status);
    const list = el('section', { class: 'ws-list' }, note('Loading worksheets…'));
    body.append(add, el('h3', { class: 'ws-h3' }, 'Saved worksheets'), list);

    try {
      const sheets = await api.list();
      if (!alive) return;
      list.innerHTML = '';
      if (!sheets.length) list.append(note('Nothing here yet. Add the first worksheet above.'));
      const grid = el('div', { class: 'ws-grid' });
      for (const s of sheets) {
        grid.append(el('button', { type: 'button', class: 'ws-card', onclick: () => onOpen(s.id) },
          s.cover?.url && s.cover.kind === 'image'
            ? el('img', { src: s.cover.url, alt: '', loading: 'lazy' })
            : el('div', { class: 'ws-cover-pdf' }, s.cover ? '📄' : '🗒️'),
          el('span', { class: 'ws-card-title' }, s.title || 'Worksheet'),
          el('span', { class: 'ws-card-sub' }, `${dateText(s.created_at)} · ${s.pageCount} ${s.pageCount === 1 ? 'page' : 'pages'}`)));
      }
      list.append(grid);
    } catch (e) {
      if (!alive) return;
      if (e.status === 401) return start();
      list.innerHTML = '';
      list.append(note(e.message, 'bad'), el('button', { class: 'big-btn ws-btn alt', type: 'button', onclick: showHub }, 'Try again'));
    }
  }

  start();
  return cleanup;
}

/* ------------------------------------------------------------------ one worksheet */
export function renderWorksheet(root, id, { onBack, onSignedOut }) {
  let alive = true;
  const cleanup = () => { alive = false; };
  const body = frame(root, { title: 'Worksheet', onBack, backLabel: '⬅️' });
  body.append(note('Loading…'));

  async function load() {
    try {
      const { worksheet, pages } = await api.get(id);
      if (!alive) return;
      draw(worksheet, pages);
    } catch (e) {
      if (!alive) return;
      if (e.status === 401) return onSignedOut();
      body.innerHTML = '';
      body.append(note(e.status === 404 ? 'That worksheet is gone.' : e.message, 'bad'),
        el('button', { class: 'big-btn ws-btn alt', type: 'button', onclick: e.status === 404 ? onBack : load }, e.status === 404 ? 'Back' : 'Try again'));
    }
  }

  function draw(sheet, pages) {
    body.innerHTML = '';
    const saved = el('span', { class: 'ws-saved' });
    const flash = (t) => { saved.textContent = t; setTimeout(() => { if (saved.textContent === t) saved.textContent = ''; }, 2500); };
    const fail = (e) => { if (e.status === 401) return onSignedOut(); flash(`⚠️ ${e.message}`); };

    const name = el('input', { type: 'text', class: 'ws-input', value: sheet.title, maxlength: 120, placeholder: 'Name this worksheet', 'aria-label': 'Worksheet name' });
    const saveName = () => api.update(id, { title: name.value }).then(() => flash('Saved ✓'), fail);
    name.addEventListener('change', saveName);

    const pageEls = el('div', { class: 'ws-pages' });
    if (!pages.length) pageEls.append(note('No pages yet. Add some below.'));
    pages.forEach((p, i) => {
      pageEls.append(el('figure', { class: 'ws-page' },
        p.kind === 'image'
          ? el('img', { src: p.url, alt: `Page ${i + 1} of ${sheet.title || 'worksheet'}` })
          : el('a', { class: 'ws-pdf-link', href: p.url, target: '_blank', rel: 'noopener' }, '📄 Open PDF'),
        el('figcaption', {},
          el('span', {}, `Page ${i + 1}`),
          el('button', { type: 'button', class: 'link-danger', onclick: async () => {
            if (!confirm(`Delete page ${i + 1}?`)) return;
            try { await api.removePage(p.id); load(); } catch (e) { fail(e); }
          } }, 'Delete page'))));
    });

    const status = el('p', { class: 'ws-note' });
    const picks = pickers(async (files) => {
      status.className = 'ws-note';
      const items = files.map((file) => ({ file, done: false }));
      try {
        await uploadAll(id, items, (t) => { if (alive) status.textContent = t; });
        if (alive) load();
      } catch (e) {
        if (!alive) return;
        if (e.status === 401) return onSignedOut();
        status.textContent = e.message;
        status.className = 'ws-note bad';
        load();
      }
    });

    const notes = el('textarea', { class: 'ws-notes', rows: 5, placeholder: 'Type notes about this sheet here (what she found hard, what to practice)…', 'aria-label': 'Notes' }, sheet.notes);
    const saveNotes = el('button', { type: 'button', class: 'big-btn ws-btn alt small', onclick: () => api.update(id, { notes: notes.value }).then(() => flash('Notes saved ✓'), fail) }, 'Save notes');

    body.append(
      el('div', { class: 'ws-namebar' }, name, saved),
      el('p', { class: 'ws-meta' }, `Added ${dateText(sheet.created_at)}`),
      pageEls,
      el('section', { class: 'ws-add' }, el('h3', {}, '➕ Add more pages'), picks.buttons, ...picks.nodes, status),
      el('section', { class: 'ws-add' },
        el('h3', {}, '📝 Notes'), notes, saveNotes,
        el('p', { class: 'ws-note' }, 'Coming next: read the words on the scan and fix or edit them here.')),
      el('button', { type: 'button', class: 'link-danger ws-delete', onclick: async () => {
        if (!confirm('Delete this whole worksheet and all its pages? This cannot be undone.')) return;
        try { await api.remove(id); onBack(); } catch (e) { fail(e); }
      } }, 'Delete this worksheet'));
  }

  load();
  return cleanup;
}
