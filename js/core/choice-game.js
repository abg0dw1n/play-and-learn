/*
  Shared "pick the right answer" engine.

  A game module only has to say what each round looks like; this file handles
  the spoken prompt, the 🔊 repeat button, gentle retries, hints, the Next
  button, star progress, level-ups and the end-of-game celebration.

  A game exports:
    { id, title, emoji, color, blurb, rounds,
      maxLevels: [firstSteps, growingStrong, superStar],   // top level per difficulty
      makeRound(level, history, difficulty) }

  makeRound returns:
  {
    key:     anything used to avoid repeats (kept in `history`)
    text:    short on-screen prompt (for grown-ups / early readers)
    say:     what the voice says when the round opens and when 🔊 is pressed
    sayOnStart?: false   // if false, stay quiet when the round opens — 🔊 still says it
    retrySay?: what the voice says after a wrong pick (defaults to `say`)
    choices: [{ label, correct, className? }]
    render?: (visualEl) => void     draw a picture / objects above the choices
    onMiss?: (visualEl, misses) => void   e.g. show a clue after a wrong pick
    praise?: spoken after a correct answer (a string, or a list of lines said with pauses)
    reveal?: { emoji, caption }     shown big after a correct answer
    advance?: (visualEl) => null | { choices, say? }   multi-step rounds: called after each right pick;
              return the next step's choices (the round only ends when it returns null)
  }

  Scanned worksheets will later be turned into these same round objects.
*/
import { el } from './util.js';
import { speak, hush, soundToggle } from './voice.js';
import { sfx } from './sfx.js';
import { burstAt } from './confetti.js';
import { store, levelCap } from './store.js';
import { guide } from './guide.js';
import { renderFinish } from './finish.js';

// Happy, encouraging lines. (All of these have recorded clips; run tools/ again after changing them.)
export const PRAISE = ['Great job!', 'You got it!', 'Awesome!', 'Way to go!', 'Super!', 'Yes!', 'Wow, nice work!', 'You are so smart!', 'Fantastic!', "That's right!"];
export const RETRY = ['Oops, try again!', 'Not quite. You can do it!', 'Hmm, try another one!', 'Almost! Try again!'];
export { finishLine } from './finish.js';
let startedOnce = false; // phones need one real tap on the page before they'll speak
const any = (a) => a[Math.floor(Math.random() * a.length)];

export function runChoiceGame(root, game, { onHome, onBack, onRestart, onStickers }) {
  const total = game.rounds || 8;
  const difficulty = store.getDifficulty(); // 0, 1, 2
  const maxLevel = levelCap(game, difficulty);
  let level = Math.min(store.level(game.id, difficulty), maxLevel);
  let index = 0;
  let streak = 0;
  let alive = true;
  let current = null;
  const history = [];

  root.innerHTML = '';
  root.className = `screen game theme-${game.id}`;
  root.style.setProperty('--accent', game.color);

  const stars = el('div', { class: 'progress', 'aria-label': 'Progress' },
    Array.from({ length: total }, () => el('span', { class: 'dot' })));
  const sayBtn = el('button', {
    class: 'icon-btn say-btn',
    'aria-label': 'Say it again',
    onclick: () => current && speak(current.say, { force: true }),
  }, '🔊');
  // Back goes to the list of games in this world (if we know it); the finish screen also has a Home button.
  const homeBtn = el('button', { class: 'icon-btn', 'aria-label': onBack ? 'Back' : 'Home', onclick: onBack || onHome }, onBack ? '⬅️' : '🏠');
  const promptEl = el('h2', { class: 'prompt' });
  const visual = el('div', { class: 'visual' });
  const nextRow = el('div', { class: 'next-row' });
  const choicesEl = el('div', { class: 'choices' });

  root.append(
    el('header', { class: 'topbar' }, homeBtn, stars, el('div', { class: 'topbar-right' }, sayBtn, soundToggle())),
    promptEl, visual, nextRow, choicesEl);

  // Pip pops into the corner of the picture area: cheering after a right answer, "oops" after a wrong one.
  function pipSays(pose) {
    visual.querySelector('.pip-pop')?.remove();
    const p = el('div', { class: `pip-pop ${pose}` }, guide(pose, 72));
    visual.append(p);
    if (pose !== 'cheer') setTimeout(() => p.remove(), 1600);
  }

  function nextRound() {
    if (!alive) return;
    const round = game.makeRound(level, history, difficulty);
    current = round;
    history.push(round.key);
    let misses = 0;

    promptEl.textContent = round.text;
    visual.innerHTML = '';
    visual.className = 'visual';
    nextRow.innerHTML = '';
    round.render?.(visual);

    function showChoices(list) {
      choicesEl.innerHTML = '';
      choicesEl.classList.remove('locked');
      choicesEl.dataset.count = list.length;
      for (const choice of list) {
        const btn = el('button', { class: `choice ${choice.className || ''}`, 'data-correct': choice.correct ? '1' : null }, choice.label);
        btn.addEventListener('click', () => onPick(btn, choice));
        choicesEl.append(btn);
      }
    }
    showChoices(round.choices);
    if (round.sayOnStart !== false) speak(round.say);

    async function onPick(btn, choice) {
      if (!alive || btn.disabled || choicesEl.classList.contains('locked')) return;
      if (choice.correct && round.advance) {
        // Multi-step round (e.g. spelling a word): a right letter moves on to the next step.
        const next = round.advance(visual);
        if (next) {
          sfx.yes();
          burstAt(btn);
          showChoices(next.choices);
          if (next.say) speak(next.say);
          return;
        }
      }
      if (choice.correct) {
        choicesEl.classList.add('locked');
        btn.classList.add('right');
        sfx.yes();
        burstAt(btn);
        if (round.reveal) {
          visual.innerHTML = '';
          visual.className = 'visual reveal';
          visual.append(el('div', { class: 'reveal-emoji' }, round.reveal.emoji),
            el('div', { class: 'reveal-caption' }, round.reveal.caption));
        }
        pipSays('cheer');
        stars.children[index].classList.add('on');
        index++;
        streak = misses === 0 ? streak + 1 : 0;
        if (streak >= 3 && level < maxLevel) {
          level++;
          streak = 0;
          store.setLevel(game.id, difficulty, level);
        }

        // Wait for a press before moving on.
        const last = index >= total;
        nextRow.append(el('button', {
          class: 'big-btn next-btn',
          onclick: () => {
            if (!alive) return;
            hush();
            if (last) finish();
            else nextRound();
          },
        }, last ? 'Finish 🏆' : 'Next ➜'));
        speak(round.praise || any(PRAISE));
      } else {
        misses++;
        streak = 0;
        btn.disabled = true;
        btn.classList.add('wrong');
        sfx.oops();
        pipSays('oops');
        if (misses >= 2) choicesEl.querySelector('[data-correct]')?.classList.add('hint');
        round.onMiss?.(visual, misses);
        await speak(any(RETRY));
        // Only if she's still on this same question and hasn't answered it yet.
        if (alive && current === round && !choicesEl.classList.contains('locked')) speak(round.retrySay || round.say);
      }
    }
  }

  function finish() {
    renderFinish(root, game, { onHome, onBack, onRestart: onRestart || (() => runChoiceGame(root, game, { onHome })), onStickers }, { alive: () => alive });
  }

  if (startedOnce || !store.get().sound) {
    nextRound();
  } else {
    // Start gate: the first question is spoken inside this very tap, which phones always allow.
    promptEl.textContent = 'Ready to play?';
    const go = el('button', { class: 'big-btn start-btn', type: 'button' }, "Let's play! ▶️");
    go.addEventListener('click', () => { startedOnce = true; go.remove(); nextRound(); });
    nextRow.append(go);
  }
  return () => { alive = false; hush(); };
}
