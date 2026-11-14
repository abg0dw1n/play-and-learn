// The gift box: tap to open, and she gets a decoration, a new sticker or a shiny upgrade.
import { el } from '../core/util.js';
import { store } from '../core/store.js';
import { sfx } from '../core/sfx.js';
import { speak } from '../core/voice.js';
import { burst } from '../core/confetti.js';
import { STICKERS, withArticle } from '../core/stickers.js';
import { openGift } from './progress.js';
import { findSecret } from './secrets.js';
import { celebrateSecrets } from './celebrate.js';

export const GIFT_SECRET_AT = 5;

/** What the voice says when a prize comes out (clips are made for every one of these). */
export const prizeLines = (prize, set) => {
  const lines = prize.kind === 'decor' ? [`You got ${withArticle(prize.name)}!`]
    : prize.kind === 'sticker' ? ['A new sticker!', prize.name]
      : prize.kind === 'shiny' ? ["It's a shiny one!", prize.name] : [];
  if (set) lines.push(setLine(set));
  return lines;
};
export const setLine = (set) => `You finished the ${set.name} set! A new decoration for your world!`;

/** Shows the gift-box screen over the page. onClose runs when she is done (and may open the next box). */
export function openGiftBox({ onClose } = {}) {
  if (!(store.get().gifts > 0)) { onClose?.(); return; }
  const overlay = el('div', { class: 'gift-overlay', role: 'dialog', 'aria-label': 'Gift box' });
  const card = el('div', { class: 'gift-card' });
  overlay.append(card);
  document.body.append(overlay);
  const close = () => {
    overlay.remove();
    const found = (store.get().giftsOpened || 0) >= GIFT_SECRET_AT ? findSecret('gifts') : [];
    celebrateSecrets(found, onClose);
  };

  const show = () => {
    card.innerHTML = '';
    const left = store.get().gifts;
    const box = el('button', { class: 'gift-box', 'aria-label': 'Open the gift' }, '🎁');
    card.append(box, el('p', { class: 'gift-name' }, 'Tap to open!'), ...(left > 1 ? [el('p', {}, `${left} gifts waiting`)] : []));
    speak('Open your gift!');
    box.addEventListener('click', () => {
      box.classList.add('shaking');
      sfx.tap();
      setTimeout(() => {
        const res = openGift(STICKERS);
        if (!res) { close(); return; }
        const { prize, set } = res;
        card.innerHTML = '';
        sfx.fanfare();
        burst({ count: 160 });
        if (prize.kind === 'none') {
          card.append(el('div', { class: 'gift-prize' }, '🌟'), el('p', { class: 'gift-name' }, 'You have everything!'));
        } else {
          card.append(
            el('div', { class: 'gift-prize' }, prize.emoji),
            el('p', { class: 'gift-name' }, prize.kind === 'shiny' ? `Shiny ${prize.name}!` : prize.kind === 'sticker' ? `New sticker: ${prize.name}` : `${withArticle(prize.name).replace(/^a/, 'A')} for your world!`),
            ...(set ? [el('p', { class: 'banner' }, el('span', { class: 'big' }, set.bonus.emoji), `${set.name} set done!`)] : []));
          speak(prizeLines(prize, set));
        }
        const more = store.get().gifts > 0;
        card.append(el('button', { class: 'big-btn again', onclick: more ? show : close }, more ? '🎁 Next gift' : '👍 Yay!'));
      }, 900);
    });
  };
  show();
}
