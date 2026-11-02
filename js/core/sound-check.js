// Grown-ups "Sound Check": hear every Letter Sounds sound on this device, pick a different
// spelling for any the voice reads wrong (e.g. spells "zuh" out as "Z U H"), and choose a voice.
import { el, wait } from './util.js';
import { store } from './store.js';
import { speak, hush, englishVoices, setVoice, currentVoiceName, onVoicesReady } from './voice.js';
import { SOUND_OPTIONS, soundFor, soundPrompt } from '../games/sounds.js';

export function renderSoundCheck(root, { onHome }) {
  root.innerHTML = '';
  root.className = 'screen sound-check';
  root.style.setProperty('--accent', '#9b5de5');

  // Voice picker
  const select = el('select', { class: 'voice-select', 'aria-label': 'Voice' });
  const fillVoices = () => {
    const saved = store.get().voiceName || '';
    select.innerHTML = '';
    select.append(el('option', { value: '' }, `Automatic${currentVoiceName() && !saved ? ` (${currentVoiceName()})` : ''}`));
    for (const v of englishVoices()) {
      const opt = el('option', { value: v.name }, `${v.name} (${v.lang})`);
      if (v.name === saved) opt.selected = true;
      select.append(opt);
    }
  };
  const stopVoices = onVoicesReady(fillVoices);
  select.addEventListener('change', () => {
    setVoice(select.value);
    fillVoices();
    speak(soundPrompt('B'), { force: true });
  });

  // One row per letter: tap a spelling to hear it the way the game says it, and pick it.
  const rows = Object.keys(SOUND_OPTIONS).map((L) => {
    const row = el('div', { class: 'sc-row' }, el('div', { class: 'sc-letter' }, L));
    const opts = el('div', { class: 'sc-opts' });
    const mark = () => opts.querySelectorAll('.sc-opt').forEach((b) => b.classList.toggle('on', b.dataset.sp === soundFor(L)));
    for (const sp of SOUND_OPTIONS[L]) {
      opts.append(el('button', {
        class: 'sc-opt',
        'data-sp': sp,
        onclick: () => {
          store.set({ soundSpellings: { ...(store.get().soundSpellings || {}), [L]: sp } });
          mark();
          speak(soundPrompt(L, sp), { force: true });
        },
      }, `"${sp}"`));
    }
    row.append(opts);
    mark();
    return row;
  });

  // Play every letter's chosen sound in a row, to find the ones that come out wrong.
  // Each run gets a number; Stop (or leaving the page) bumps it, so an older run that is
  // still waiting on the voice quits instead of carrying on alongside a new one.
  const playAll = el('button', { class: 'big-btn sc-play' }, '▶ Play all');
  let run = 0;
  let playing = false;
  const stopPlaying = () => {
    run++;
    playing = false;
    rows.forEach((r) => r.classList.remove('playing'));
    playAll.textContent = '▶ Play all';
  };
  playAll.addEventListener('click', async () => {
    if (playing) { stopPlaying(); hush(); return; }
    const me = ++run;
    playing = true;
    playAll.textContent = '■ Stop';
    for (const [i, L] of Object.keys(SOUND_OPTIONS).entries()) {
      if (me !== run) return;
      rows.forEach((r, j) => r.classList.toggle('playing', j === i));
      await speak(`${L}. ${soundFor(L)}.`, { force: true });
      await wait(250);
    }
    if (me === run) stopPlaying();
  });

  root.append(
    el('header', { class: 'topbar' },
      el('button', { class: 'icon-btn', 'aria-label': 'Home', onclick: onHome }, '🏠'),
      el('h2', { class: 'book-title sc-title' }, 'Sound Check'),
      el('span', { class: 'sc-spacer' })),
    el('div', { class: 'sc-card' },
      el('p', {}, 'For grown-ups. Tap a sound to hear it the way Letter Sounds says it on this device. ',
        'If the voice spells it out as letters (like "Z U H") or it sounds wrong, tap another spelling for that letter. ',
        'The one you tap last is saved on this device.'),
      el('label', { class: 'sc-voice' }, 'Voice', select),
      playAll),
    el('div', { class: 'sc-list' }, rows));

  return () => { run++; stopVoices(); hush(); };
}
