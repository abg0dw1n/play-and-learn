// Tic-Tac-Toe against Pip. Just for fun. She is ⭐ and goes first.
import { el } from '../core/util.js';
import { store } from '../core/store.js';
import { speak, hush, soundToggle } from '../core/voice.js';
import { sfx } from '../core/sfx.js';
import { burstAt } from '../core/confetti.js';
import { guide, setPose, CHARACTERS } from '../core/guide.js';
import { renderFinish } from '../core/finish.js';

export const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
const ME = '⭐', PIP = '🐰'; // board tokens; Pip's squares are drawn with the chosen character's face

/** Returns { who, line } when someone has three in a row, otherwise null. */
export function winner(b) {
  for (const l of LINES) if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[0]] === b[l[2]]) return { who: b[l[0]], line: l };
  return null;
}

// A square that finishes a line for `who` (or null).
function finisher(b, who) {
  for (const l of LINES) {
    const mine = l.filter((i) => b[i] === who);
    const empty = l.filter((i) => !b[i]);
    if (mine.length === 2 && empty.length === 1) return empty[0];
  }
  return null;
}

/** Pip's move. First Steps: mostly random. Growing Strong: wins and blocks. Super Star: also likes the middle and corners. */
export function pipMove(b, difficulty, rnd = Math.random) {
  const empty = b.map((v, i) => (v ? null : i)).filter((i) => i !== null);
  const pick = (a) => a[Math.floor(rnd() * a.length)];
  if (difficulty >= 1) {
    const win = finisher(b, PIP); if (win !== null) return win;
    const block = finisher(b, ME); if (block !== null && (difficulty === 2 || rnd() < 0.75)) return block;
  }
  if (difficulty === 2) {
    if (!b[4]) return 4;
    const corners = [0, 2, 6, 8].filter((i) => !b[i]); if (corners.length) return pick(corners);
  }
  return pick(empty);
}

export default {
  id: 'tictactoe',
  title: 'Tic-Tac-Toe',
  emoji: '❎',
  color: '#ff6fb5',
  blurb: 'Three in a row beats Pip!',
  fun: true,
  maxLevels: [1, 1, 1],

  run(root, game, nav) {
    const d = store.getDifficulty();
    const pipFace = (CHARACTERS.find((c) => c.id === store.get().character) || CHARACTERS[0]).emoji;
    let alive = true, busy = false, over = false;
    const board = Array(9).fill(null);
    const timers = [];
    const later = (fn, ms) => { const t = setTimeout(() => alive && fn(), ms); timers.push(t); };

    root.innerHTML = '';
    root.className = `screen game theme-${game.id} ttt`;
    root.style.setProperty('--accent', game.color);

    const pip = guide('happy', 56, 'ttt-pip', store.get().character);
    const status = el('h2', { class: 'prompt ttt-status' }, 'Your turn! ⭐');
    const cells = board.map((_, i) => el('button', { class: 'ttt-cell', 'aria-label': `Square ${i + 1}`, onclick: () => play(i) }));
    const grid = el('div', { class: 'ttt-board' }, cells);
    root.append(
      el('header', { class: 'topbar' },
        el('button', { class: 'icon-btn', 'aria-label': 'Back', onclick: nav.onBack || nav.onHome }, nav.onBack ? '⬅️' : '🏠'),
        el('div', { class: 'ttt-who' }, pip, el('span', {}, `You ⭐   Pip ${pipFace}`)),
        el('div', { class: 'topbar-right' }, soundToggle())),
      status, grid);

    function mark(i, who) {
      board[i] = who;
      cells[i].textContent = who === ME ? ME : pipFace;
      cells[i].classList.add(who === ME ? 'mine' : 'pips');
      cells[i].disabled = true;
    }

    function check() {
      const w = winner(board);
      if (w) {
        over = true;
        w.line.forEach((i) => cells[i].classList.add('win'));
        if (w.who === ME) {
          status.textContent = 'You win! 🎉'; setPose(pip, 'cheer'); sfx.fanfare(); burstAt(cells[w.line[1]], 80); speak('You win!');
          later(() => renderFinish(root, game, nav, { alive: () => alive, title: 'You win!' }), 2200);
        } else {
          status.textContent = 'Pip wins this time!'; setPose(pip, 'wink'); sfx.oops();
          speak('Pip wins this time! Want to play again?');
          later(() => showAgain(`Pip won this time! ${pipFace}`, 'Want to play again?'), 1800);
        }
        return true;
      }
      if (board.every(Boolean)) {
        over = true;
        status.textContent = "It's a tie! 🤝"; setPose(pip, 'happy'); sfx.yes(); speak("It's a tie! Good game!");
        later(() => renderFinish(root, game, nav, { alive: () => alive, title: "It's a tie! Good game!" }), 2000);
        return true;
      }
      return false;
    }

    function showAgain(title, sub) {
      root.innerHTML = '';
      root.append(el('div', { class: 'finish' }, guide('wink', 130, 'finish-pip', store.get().character), el('h2', {}, title), el('p', { class: 'earned' }, sub),
        el('div', { class: 'finish-actions' },
          el('button', { class: 'big-btn again', onclick: nav.onRestart }, '🔁 Play again'),
          nav.onBack && el('button', { class: 'big-btn home', onclick: nav.onBack }, '🎮 More games'),
          el('button', { class: 'big-btn home', onclick: nav.onHome }, '🏠 Home'))));
    }

    function play(i) {
      if (!alive || busy || over || board[i]) return;
      sfx.tap(); mark(i, ME);
      if (check()) return;
      busy = true; status.textContent = `Pip's turn… ${pipFace}`; setPose(pip, 'think');
      later(() => {
        mark(pipMove(board, d), PIP); sfx.tap(); setPose(pip, 'happy');
        busy = false;
        if (!check()) status.textContent = 'Your turn! ⭐';
      }, 800);
    }

    speak('Your turn!');
    return () => { alive = false; timers.forEach(clearTimeout); hush(); };
  },
};
