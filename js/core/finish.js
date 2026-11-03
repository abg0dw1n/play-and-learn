// The "Great job!" screen shared by every game: Pip cheers, a new sticker (or a trophy) and a star are earned.
import { el } from './util.js';
import { store } from './store.js';
import { sfx } from './sfx.js';
import { burst } from './confetti.js';
import { speak } from './voice.js';
import { awardSticker, withArticle } from './stickers.js';
import { guide } from './guide.js';

/** What the voice says on the finish screen (no name: the clips are the same for everyone). */
export const finishLine = (sticker) => (sticker ? `Great job! You got ${withArticle(sticker[1])} sticker!` : 'Great job! You earned a star!');

/** game: { id }.  nav: { onHome, onBack, onRestart, onStickers }.  alive(): false once she has left the screen.
    title / say: optional replacements for the headline and the spoken line(s) before the sticker line. */
export function renderFinish(root, game, nav, { alive = () => true, title, say } = {}) {
  const { onHome, onBack, onRestart, onStickers } = nav;
  const s = store.get();
  store.setGame(game.id, { plays: (store.game(game.id).plays || 0) + 1 });
  // Sticker first: on the very first finish it also turns stars from before the
  // sticker book into stickers, and this game's star must not be counted twice.
  const sticker = awardSticker(); // [emoji, name] or null once she has them all
  const totalStars = store.addStar();
  const cheer = title || (s.name ? `Great job, ${s.name}!` : 'Great job!');
  root.innerHTML = '';
  root.append(el('div', { class: 'finish' },
    guide('cheer', 120, 'finish-pip'),
    sticker
      ? el('div', { class: 'new-sticker' },
        el('div', { class: 'sticker-big' }, sticker[0]),
        el('div', { class: 'sticker-label' }, 'New sticker!'))
      : el('div', { class: 'trophy' }, '🏆'),
    el('h2', {}, cheer),
    el('p', { class: 'earned' }, '+1 ⭐  ', el('span', {}, `You have ${totalStars} ${totalStars === 1 ? 'star' : 'stars'}!`)),
    el('div', { class: 'finish-actions' },
      el('button', { class: 'big-btn again', onclick: onRestart }, '🔁 Play again'),
      onStickers && el('button', { class: 'big-btn book', onclick: onStickers }, '🌈 My World'),
      onBack && el('button', { class: 'big-btn home', onclick: onBack }, '🎮 More games'),
      el('button', { class: 'big-btn home', onclick: onHome }, '🏠 Home'))));
  window.scrollTo(0, 0);
  sfx.fanfare();
  burst({ count: 140 });
  setTimeout(() => alive() && burst({ x: innerWidth * 0.25, y: innerHeight * 0.4, count: 60 }), 500);
  setTimeout(() => alive() && burst({ x: innerWidth * 0.75, y: innerHeight * 0.4, count: 60 }), 900);
  speak([...(say ? [].concat(say) : []), finishLine(sticker)]);
}
