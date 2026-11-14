// The "Great job!" screen shared by every game: Pip cheers, a new sticker (or a trophy) and a star are earned.
import { el } from './util.js';
import { store } from './store.js';
import { sfx } from './sfx.js';
import { burst } from './confetti.js';
import { speak } from './voice.js';
import { awardSticker, awardRare, withArticle, owned } from './stickers.js';
import { guide } from './guide.js';
import { rollShiny, makeShiny, afterFinish } from '../world/progress.js';
import { setLine, openGiftBox } from '../world/gift.js';

/** What the voice says on the finish screen (no name: the clips are the same for everyone). */
export const finishLine = (sticker) => (sticker ? `Great job! You got ${withArticle(sticker[1])} sticker!` : 'Great job! You earned a star!');

/** What the voice says for a rare or legendary sticker. */
export const rareLine = (r) => `Wow! A ${r.rarity} sticker! You got ${withArticle(r.name)} sticker!`;

/** game: { id }.  nav: { onHome, onBack, onRestart, onStickers }.  alive(): false once she has left the screen.
    title / say: optional replacements for the headline and the spoken line(s) before the sticker line.
    perfect: she got everything right (no wrong answers), which can unlock rare stickers. */
export async function renderFinish(root, game, nav, { alive = () => true, title, say, perfect = false } = {}) {
  const { onHome, onBack, onRestart, onStickers } = nav;
  const s = store.get();
  store.setGame(game.id, { plays: (store.game(game.id).plays || 0) + 1 });
  // Sticker first: on the very first finish it also turns stars from before the
  // sticker book into stickers, and this game's star must not be counted twice.
  const before = owned();
  const sticker = awardSticker(); // [emoji, name] or null once she has them all
  const totalStars = store.addStar();
  let rare = [];
  try { rare = await awardRare(game, { perfect }); } catch { /* the everyday sticker still counts */ }
  if (!alive()) return; // she left while this was being worked out
  // Everything below is extra: if any of it fails, the sticker she earned still counts.
  let shiny = false;
  let extra = { gifts: 0, giftFrom: [], set: null, scenes: [], goalReached: false, daily: null, eggReady: false };
  try {
    if (sticker && rollShiny({ perfect, difficulty: store.getDifficulty() })) { makeShiny(sticker[0]); shiny = true; }
    extra = afterFinish({ game, before, after: owned() });
  } catch { /* rewards are a bonus */ }
  const cheer = title || (s.name ? `Great job, ${s.name}!` : 'Great job!');
  const stage = el('div', { class: 'finish-stage' });
  const myWorldBtn = onStickers && el('button', { class: 'big-btn book', onclick: onStickers }, '🌈 My World');
  root.innerHTML = '';
  root.append(el('div', { class: 'finish' }, guide('cheer', 120, 'finish-pip', s.character), stage));
  window.scrollTo(0, 0);

  const banner = (icon, text, extraNode) => el('div', { class: 'banner' }, el('span', { class: 'big' }, icon), el('span', {}, text), extraNode);
  const reveal = () => {
    const lines = [];
    stage.innerHTML = '';
    for (const r of rare) {
      stage.append(el('div', { class: `rare-sticker ${r.rarity}` },
        el('div', { class: 'rare-badge' }, r.rarity === 'legendary' ? '🌟 LEGENDARY STICKER!' : '✨ RARE STICKER!'),
        el('div', { class: 'rare-emoji' }, r.emoji),
        el('div', { class: 'rare-name' }, r.name)));
    }
    stage.append(sticker
      ? el('div', { class: `new-sticker sticker-reveal${shiny ? ' shiny-reveal' : ''}` },
        shiny && el('div', { class: 'shiny-badge' }, '✨ SHINY! ✨'),
        el('div', { class: 'sticker-big' }, sticker[0]),
        el('div', { class: 'sticker-label' }, 'New sticker!'))
      : el('div', { class: 'trophy' }, '🏆'));
    stage.append(
      el('h2', {}, cheer),
      el('p', { class: 'earned' }, '+1 ⭐  ', el('span', {}, `You have ${totalStars} ${totalStars === 1 ? 'star' : 'stars'}!`)));
    lines.push(...(say ? [].concat(say) : []), finishLine(sticker), ...rare.map(rareLine));
    if (shiny) lines.push("It's a shiny one!");
    if (extra.set) { stage.append(banner(extra.set.bonus.emoji, `${extra.set.name} set done! New decoration!`)); lines.push(setLine(extra.set)); }
    for (const sc of extra.scenes) { stage.append(banner(sc.icon, `New place: ${sc.name}!`)); lines.push('A new place for your world!', sc.name); }
    let giftBtn = null;
    if (extra.gifts) {
      const daily = extra.daily?.justDone;
      giftBtn = el('button', { class: 'tool-btn gift-btn has', 'aria-label': 'Open your gift' }, '🎁');
      giftBtn.addEventListener('click', () => openGiftBox({ onClose: () => { if (!(store.get().gifts > 0)) giftBtn.remove(); } }));
      stage.append(banner('🎁', daily ? 'Daily hunt done! A gift box!' : 'You earned a gift box!', giftBtn));
      lines.push(daily ? 'You did the daily hunt! A gift box for you!' : 'You earned a gift box!');
    } else if (extra.daily?.started && !extra.daily.justDone) { // first game today: tell her about the hunt once
      stage.append(banner('🔎', 'Play 2 different games today for a surprise!'));
      lines.push('Play two different games today for a surprise!');
    }
    if (extra.eggReady) { stage.append(banner('🥚', 'Your magic egg is ready to hatch! Go to My World!')); lines.push('Your magic egg is ready to hatch!'); }
    if (extra.goalReached) { stage.append(banner(store.get().goal?.icon || '🎁', 'You reached your goal! Show a grown-up!')); lines.push('You reached your goal! Show a grown-up!'); }
    stage.append(el('div', { class: 'finish-actions' },
      el('button', { class: 'big-btn again', onclick: onRestart }, '🔁 Play again'),
      myWorldBtn,
      onBack && el('button', { class: 'big-btn home', onclick: onBack }, '🎮 More games'),
      el('button', { class: 'big-btn home', onclick: onHome }, '🏠 Home')));
    sfx.fanfare();
    burst({ count: rare.length || shiny ? 260 : 140 });
    setTimeout(() => alive() && burst({ x: innerWidth * 0.25, y: innerHeight * 0.4, count: 60 }), 500);
    setTimeout(() => alive() && burst({ x: innerWidth * 0.75, y: innerHeight * 0.4, count: 60 }), 900);
    speak(lines);
    if (sticker || rare.length) setTimeout(() => alive() && flyToWorld(stage.querySelector('.sticker-big, .rare-emoji'), myWorldBtn), 2600);
  };

  if (sticker || rare.length) {
    // She opens her new sticker herself: a glowing pack to tap.
    const pack = el('button', { class: 'pack', 'aria-label': 'Tap to open your sticker' },
      el('div', { class: 'pack-wrap' }, '🎁'), el('div', { class: 'pack-label' }, 'Tap to open your sticker!'));
    stage.append(pack);
    sfx.yes();
    speak('Tap to open your sticker!');
    pack.addEventListener('click', () => {
      pack.classList.add('opening');
      sfx.tap();
      setTimeout(() => alive() && reveal(), 450);
    }, { once: true });
  } else {
    reveal();
  }
}

/** The new sticker flies up to the My World button, which gives a happy bounce. */
function flyToWorld(from, to) {
  if (!from || !to || !from.isConnected || typeof from.animate !== 'function') return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
  const fly = el('div', { class: 'flyer', style: { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, 'font-size': `${a.height * 0.7}px`, display: 'grid', 'place-items': 'center' } }, from.textContent);
  document.body.append(fly);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = fly.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 80}px) scale(.7)`, offset: 0.5 }, { transform: `translate(${dx}px, ${dy}px) scale(.15)`, opacity: 0.9 }], { duration: 1100, easing: 'ease-in' });
  anim.onfinish = () => { fly.remove(); to.classList.remove('bounce-once'); void to.offsetWidth; to.classList.add('bounce-once'); sfx.tap(); };
  anim.oncancel = () => fly.remove();
}
