/*
  Shared "pick the right answer" engine.

  A game module only has to say what each round looks like; this file handles
  the spoken prompt, the 🔊 repeat button, gentle retries, hints, star progress,
  level-ups and the end-of-game celebration.

  makeRound(level, history) returns:
  {
    key:     anything used to avoid repeats (kept in `history`)
    text:    short on-screen prompt (for grown-ups / early readers)
    say:     what the voice says
    choices: [{ label, correct, say?, className? }]
    render?: (visualEl) => void     draw a picture / objects above the choices
    praise?: spoken after a correct answer
    reveal?: { emoji, caption }     shown big after a correct answer
  }

  Scanned worksheets will later be turned into these same round objects.
*/
import { el, wait } from './util.js';
import { speak, hush } from './voice.js';
import { sfx } from './sfx.js';
import { burst, burstAt } from './confetti.js';
import { store } from './store.js';

const PRAISE = ['Great job!', 'You got it!', 'Awesome!', 'Way to go!', 'Super!', 'Yes!'];
const RETRY = ['Oops, try again!', 'Not quite. Try again!', 'Hmm, try another one!'];
const any = (a) => a[Math.floor(Math.random() * a.length)];

export function runChoiceGame(root, game, { onHome }) {
  const total = game.rounds || 8;
  const maxLevel = game.maxLevel || 1;
  let level = Math.min(store.game(game.id).level || 1, maxLevel);
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
  const sayBtn = el('button', { class: 'icon-btn', 'aria-label': 'Say it again', onclick: () => current && speak(current.say) }, '🔊');
  const homeBtn = el('button', { class: 'icon-btn', 'aria-label': 'Home', onclick: onHome }, '🏠');
  const promptEl = el('h2', { class: 'prompt' });
  const visual = el('div', { class: 'visual' });
  const choicesEl = el('div', { class: 'choices' });

  root.append(el('header', { class: 'topbar' }, homeBtn, stars, sayBtn), promptEl, visual, choicesEl);

  function nextRound() {
    if (!alive) return;
    current = game.makeRound(level, history);
    history.push(current.key);
    let misses = 0;

    promptEl.textContent = current.text;
    visual.innerHTML = '';
    visual.className = 'visual';
    current.render?.(visual);

    choicesEl.innerHTML = '';
    choicesEl.classList.remove('locked');
    choicesEl.dataset.count = current.choices.length;
    for (const choice of current.choices) {
      const btn = el('button', { class: `choice ${choice.className || ''}`, 'data-correct': choice.correct ? '1' : null }, choice.label);
      btn.addEventListener('click', () => onPick(btn, choice));
      choicesEl.append(btn);
    }
    speak(current.say);

    async function onPick(btn, choice) {
      if (!alive || btn.disabled || choicesEl.classList.contains('locked')) return;
      if (choice.correct) {
        choicesEl.classList.add('locked');
        btn.classList.add('right');
        sfx.yes();
        burstAt(btn);
        if (current.reveal) {
          visual.innerHTML = '';
          visual.className = 'visual reveal';
          visual.append(el('div', { class: 'reveal-emoji' }, current.reveal.emoji),
            el('div', { class: 'reveal-caption' }, current.reveal.caption));
        }
        stars.children[index].classList.add('on');
        streak = misses === 0 ? streak + 1 : 0;
        await speak(current.praise || any(PRAISE));
        await wait(350);
        index++;
        if (streak >= 3 && level < maxLevel) {
          level++;
          streak = 0;
          store.setGame(game.id, { level });
        }
        if (index >= total) finish();
        else nextRound();
      } else {
        misses++;
        streak = 0;
        btn.disabled = true;
        btn.classList.add('wrong');
        sfx.oops();
        if (misses >= 2) choicesEl.querySelector('[data-correct]')?.classList.add('hint');
        await speak(any(RETRY));
        if (alive && !choicesEl.classList.contains('locked')) speak(current.say);
      }
    }
  }

  async function finish() {
    const s = store.get();
    store.setGame(game.id, { plays: (store.game(game.id).plays || 0) + 1 });
    const totalStars = store.addStar();
    root.innerHTML = '';
    root.append(el('div', { class: 'finish' },
      el('div', { class: 'trophy' }, '🏆'),
      el('h2', {}, s.name ? `Great job, ${s.name}!` : 'Great job!'),
      el('p', { class: 'earned' }, '+1 ⭐  ', el('span', {}, `You have ${totalStars} ${totalStars === 1 ? 'star' : 'stars'}!`)),
      el('div', { class: 'finish-actions' },
        el('button', { class: 'big-btn again', onclick: () => runChoiceGame(root, game, { onHome }) }, '🔁 Play again'),
        el('button', { class: 'big-btn home', onclick: onHome }, '🏠 Home'))));
    sfx.fanfare();
    burst({ count: 140 });
    setTimeout(() => alive && burst({ x: innerWidth * 0.25, y: innerHeight * 0.4, count: 60 }), 500);
    setTimeout(() => alive && burst({ x: innerWidth * 0.75, y: innerHeight * 0.4, count: 60 }), 900);
    speak(`${s.name ? `Great job, ${s.name}!` : 'Great job!'} You earned a star!`);
  }

  nextRound();
  return () => { alive = false; hush(); };
}
