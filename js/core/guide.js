// Pip: the friendly guide who cheers her on. Grown-ups can pick which original character Pip looks
// like (same name, same recorded voice — just a different "skin"), drawn with plain shapes so it
// stays sharp at any size and needs no image files. These are our own cute-cartoon-style designs,
// not any existing character.
// guide('happy' | 'cheer' | 'think' | 'wink' | 'oops', size, extraClass, character) returns an element.
import { el } from './util.js';
import { store } from './store.js';
import { hatById } from '../world/secrets.js';

const INK = '#3a2a5e';

/** Characters a grown-up can choose in the Grown-ups corner. "bunny" (the original Pip) keeps
    changing color with the Look/theme, like always; the others carry their own fixed palette so
    they read the same in every theme. */
export const CHARACTERS = [
  { id: 'bunny', name: 'Bunny', emoji: '🐰' },
  { id: 'fox', name: 'Fox', emoji: '🦊', colors: { pip: '#ff9a52', light: '#ffe3c2', dark: '#e2691c' } },
  { id: 'panda', name: 'Panda', emoji: '🐼', colors: { pip: '#f7f7f9', light: '#ffffff', dark: '#d8d8de' } },
  { id: 'dino', name: 'Dino', emoji: '🦕', colors: { pip: '#5fd38d', light: '#bdf3d4', dark: '#3aa368' } },
  { id: 'owl', name: 'Owl', emoji: '🦉', colors: { pip: '#cf9f5f', light: '#f2ddb6', dark: '#a3773f' } },
  { id: 'kitty', name: 'Kitty', emoji: '🐱', colors: { pip: '#ffb3d1', light: '#ffe6f0', dark: '#ee8bb4' } },
  { id: 'puppy', name: 'Puppy', emoji: '🐶', colors: { pip: '#e3ad72', light: '#f8e2c4', dark: '#b8824a' } },
  { id: 'unicorn', name: 'Unicorn', emoji: '🦄', colors: { pip: '#fbf6ff', light: '#ffffff', dark: '#ddd0f2' } },
  { id: 'penguin', name: 'Penguin', emoji: '🐧', colors: { pip: '#3e4c70', light: '#ffffff', dark: '#2b3552' } },
  { id: 'bear', name: 'Bear', emoji: '🐻', colors: { pip: '#b57d4c', light: '#ecd0ab', dark: '#8c5c33' } },
  { id: 'koala', name: 'Koala', emoji: '🐨', colors: { pip: '#a9afba', light: '#eceef3', dark: '#7f8694' } },
];
const byId = Object.fromEntries(CHARACTERS.map((c) => [c.id, c]));

const arms = {
  happy: '<ellipse cx="38" cy="140" rx="10" ry="22" transform="rotate(18 38 140)" fill="var(--pip)"/><ellipse cx="122" cy="140" rx="10" ry="22" transform="rotate(-18 122 140)" fill="var(--pip)"/>',
  wink: '<ellipse cx="38" cy="140" rx="10" ry="22" transform="rotate(18 38 140)" fill="var(--pip)"/><ellipse cx="128" cy="112" rx="10" ry="23" transform="rotate(-35 128 112)" fill="var(--pip)"/>',
  cheer: '<ellipse cx="30" cy="104" rx="10" ry="24" transform="rotate(-28 30 104)" fill="var(--pip)"/><ellipse cx="130" cy="104" rx="10" ry="24" transform="rotate(28 130 104)" fill="var(--pip)"/>',
  think: '<ellipse cx="38" cy="140" rx="10" ry="22" transform="rotate(18 38 140)" fill="var(--pip)"/><ellipse cx="104" cy="130" rx="10" ry="20" transform="rotate(50 104 130)" fill="var(--pip)"/>',
  oops: '<ellipse cx="40" cy="138" rx="10" ry="22" transform="rotate(10 40 138)" fill="var(--pip)"/><ellipse cx="120" cy="138" rx="10" ry="22" transform="rotate(-10 120 138)" fill="var(--pip)"/>',
};

const eyes = {
  happy: `<ellipse cx="62" cy="86" rx="7" ry="9.5" fill="${INK}"/><ellipse cx="98" cy="86" rx="7" ry="9.5" fill="${INK}"/><circle cx="64.5" cy="82.5" r="2.7" fill="#fff"/><circle cx="100.5" cy="82.5" r="2.7" fill="#fff"/>`,
  cheer: `<path d="M53 90 Q62 77 71 90" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M89 90 Q98 77 107 90" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  wink: `<ellipse cx="62" cy="86" rx="7" ry="9.5" fill="${INK}"/><circle cx="64.5" cy="82.5" r="2.7" fill="#fff"/><path d="M89 87 Q98 79 107 87" stroke="${INK}" stroke-width="5" fill="none" stroke-linecap="round"/>`,
  think: `<ellipse cx="62" cy="84" rx="7" ry="9.5" fill="${INK}"/><ellipse cx="98" cy="84" rx="7" ry="9.5" fill="${INK}"/><circle cx="66" cy="79" r="2.7" fill="#fff"/><circle cx="102" cy="79" r="2.7" fill="#fff"/><path d="M89 69 Q98 63 107 68" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  oops: `<ellipse cx="62" cy="88" rx="7" ry="9" fill="${INK}"/><ellipse cx="98" cy="88" rx="7" ry="9" fill="${INK}"/><circle cx="64.5" cy="84.5" r="2.7" fill="#fff"/><circle cx="100.5" cy="84.5" r="2.7" fill="#fff"/><path d="M53 72 Q62 66 71 71" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M89 71 Q98 66 107 72" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
};

const mouth = {
  happy: `<path d="M66 105 Q80 124 94 105 Z" fill="#7a2c4d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M72 114 Q80 121 88 114 Q80 110 72 114Z" fill="#ff8fb1"/>`,
  cheer: `<path d="M60 102 Q80 136 100 102 Z" fill="#7a2c4d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M68 119 Q80 129 92 119 Q80 112 68 119Z" fill="#ff8fb1"/>`,
  wink: `<path d="M66 105 Q80 124 94 105 Z" fill="#7a2c4d" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M72 114 Q80 121 88 114 Q80 110 72 114Z" fill="#ff8fb1"/>`,
  think: `<ellipse cx="84" cy="111" rx="6" ry="7" fill="#7a2c4d" stroke="${INK}" stroke-width="3"/>`,
  oops: `<path d="M68 113 Q80 106 92 113" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`,
};

const sparkles = '<g fill="#ffd23f" stroke="#f0a800" stroke-width="1.5" stroke-linejoin="round"><path d="M18 40 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z"/><path d="M142 28 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z"/><path d="M146 80 l2.5 6 6 2.5 -6 2.5 -2.5 6 -2.5 -6 -6 -2.5 6 -2.5z"/></g>';

// Ears / horns / tufts drawn behind the head — this is what makes each character read as a
// different animal at a glance.
function headDecor(id, pose) {
  if (id === 'fox') {
    return '<path d="M40 50 L28 6 L66 32 Z" fill="var(--pip)"/><path d="M42 44 L35 16 L58 32 Z" fill="var(--pip-light)"/>'
      + '<path d="M120 50 L132 6 L94 32 Z" fill="var(--pip)"/><path d="M118 44 L125 16 L102 32 Z" fill="var(--pip-light)"/>';
  }
  if (id === 'panda') {
    return '<circle cx="42" cy="34" r="22" fill="#2b2b2b"/><circle cx="118" cy="34" r="22" fill="#2b2b2b"/>';
  }
  if (id === 'dino') {
    return '<path d="M52 14 L60 -4 L68 14 Z" fill="var(--pip-dark)"/><path d="M68 10 L76 -8 L84 10 Z" fill="var(--pip-dark)"/><path d="M84 14 L92 -4 L100 14 Z" fill="var(--pip-dark)"/>';
  }
  if (id === 'owl') {
    return '<path d="M50 44 L38 8 L66 30 Z" fill="var(--pip)"/><path d="M110 44 L122 8 L94 30 Z" fill="var(--pip)"/>';
  }
  if (id === 'kitty') {
    return '<path d="M38 52 L32 8 L70 34 Z" fill="var(--pip)"/><path d="M42 46 L39 20 L60 34 Z" fill="#ff86b6"/>'
      + '<path d="M122 52 L128 8 L90 34 Z" fill="var(--pip)"/><path d="M118 46 L121 20 L100 34 Z" fill="#ff86b6"/>';
  }
  if (id === 'puppy') { // floppy ears hanging at the sides
    return '<ellipse cx="30" cy="80" rx="17" ry="36" transform="rotate(18 30 80)" fill="var(--pip-dark)"/>'
      + '<ellipse cx="130" cy="80" rx="17" ry="36" transform="rotate(-18 130 80)" fill="var(--pip-dark)"/>';
  }
  if (id === 'unicorn') { // rainbow mane, little ears and a golden horn
    return '<circle cx="34" cy="62" r="14" fill="#ff8fb1"/><circle cx="38" cy="40" r="14" fill="#ffd23f"/><circle cx="54" cy="24" r="14" fill="#7ed957"/><circle cx="74" cy="18" r="13" fill="#4d96ff"/><circle cx="126" cy="62" r="12" fill="#b388ff"/>'
      + '<path d="M50 50 L46 20 L68 38 Z" fill="var(--pip)"/><path d="M110 50 L114 20 L92 38 Z" fill="var(--pip)"/>'
      + '<path d="M80 -6 L70 40 L90 40 Z" fill="#ffd23f" stroke="#e0a800" stroke-width="2" stroke-linejoin="round"/>'
      + '<path d="M74 26 L86 20 M72 34 L88 28 M77 14 L84 10" stroke="#e0a800" stroke-width="2"/>';
  }
  if (id === 'bear') {
    return '<circle cx="40" cy="44" r="20" fill="var(--pip)"/><circle cx="40" cy="44" r="10" fill="var(--pip-light)"/>'
      + '<circle cx="120" cy="44" r="20" fill="var(--pip)"/><circle cx="120" cy="44" r="10" fill="var(--pip-light)"/>';
  }
  if (id === 'koala') { // big fluffy ears
    return '<circle cx="34" cy="56" r="28" fill="var(--pip)"/><circle cx="34" cy="58" r="16" fill="var(--pip-light)"/>'
      + '<circle cx="126" cy="56" r="28" fill="var(--pip)"/><circle cx="126" cy="58" r="16" fill="var(--pip-light)"/>';
  }
  if (id === 'penguin') return '';
  // bunny: long floppy ears; one tilts back for the "think" pose.
  const leftEar = pose === 'think'
    ? '<ellipse cx="46" cy="34" rx="14" ry="38" transform="rotate(-34 46 34)" fill="var(--pip)"/><ellipse cx="46" cy="36" rx="7" ry="26" transform="rotate(-34 46 36)" fill="#ffc4dd"/>'
    : '<ellipse cx="54" cy="36" rx="14" ry="38" transform="rotate(-10 54 36)" fill="var(--pip)"/><ellipse cx="54" cy="38" rx="7" ry="26" transform="rotate(-10 54 38)" fill="#ffc4dd"/>';
  return `${leftEar}<ellipse cx="106" cy="36" rx="14" ry="38" transform="rotate(10 106 36)" fill="var(--pip)"/><ellipse cx="106" cy="38" rx="7" ry="26" transform="rotate(10 106 38)" fill="#ffc4dd"/>`;
}

// A signature marking drawn on the face, after the head but before the eyes.
function faceDecor(id) {
  if (id === 'panda') return '<ellipse cx="62" cy="92" rx="15" ry="19" fill="#2b2b2b" opacity=".9"/><ellipse cx="98" cy="92" rx="15" ry="19" fill="#2b2b2b" opacity=".9"/>';
  if (id === 'fox') return '<ellipse cx="80" cy="104" rx="30" ry="22" fill="#fff6ec" opacity=".85"/>';
  if (id === 'penguin') return '<path d="M80 52 C52 52 34 74 36 100 C38 122 58 132 80 132 C102 132 122 122 124 100 C126 74 108 52 80 52 Z" fill="#ffffff"/>';
  if (id === 'kitty') {
    return `<g stroke="${INK}" stroke-width="2.4" stroke-linecap="round" opacity=".7"><path d="M42 96 L20 90"/><path d="M42 102 L20 104"/><path d="M118 96 L140 90"/><path d="M118 102 L140 104"/></g>`;
  }
  if (id === 'puppy') return '<ellipse cx="100" cy="84" rx="17" ry="19" fill="var(--pip-dark)" opacity=".55"/>';
  if (id === 'bear') return '<ellipse cx="80" cy="104" rx="24" ry="17" fill="var(--pip-light)"/>';
  return '';
}

function noseFor(id) {
  if (id === 'owl') return '<path d="M71 90 L80 110 L89 90 Z" fill="#e8872a" stroke="#c96c18" stroke-width="1.5" stroke-linejoin="round"/>';
  if (id === 'fox' || id === 'panda') return '<ellipse cx="80" cy="98" rx="5" ry="3.6" fill="#2b2b2b"/>';
  if (id === 'dino') return '<ellipse cx="80" cy="98" rx="5.5" ry="4" fill="#2f6b4d"/>';
  if (id === 'penguin') return '<path d="M70 96 L90 96 L80 110 Z" fill="#ff9f1c" stroke="#d97a00" stroke-width="1.5" stroke-linejoin="round"/>';
  if (id === 'koala') return '<ellipse cx="80" cy="98" rx="10" ry="12" fill="#3a3a44"/>';
  if (id === 'puppy' || id === 'bear') return '<ellipse cx="80" cy="97" rx="7" ry="5" fill="#2b2b2b"/>';
  if (id === 'kitty') return '<path d="M75 95 L85 95 L80 101 Z" fill="#ff6fa3"/>';
  if (id === 'unicorn') return '<ellipse cx="80" cy="99" rx="4.5" ry="3.2" fill="#ff8fb1"/>';
  return '<ellipse cx="80" cy="98" rx="5.5" ry="4" fill="#ff6fa3"/>'; // bunny
}

// Pip's rainbow bow tie — only the original bunny wears it.
function accessoryFor(id) {
  if (id !== 'bunny') return '';
  return '<path d="M80 124 L62 118 L62 134 Z" fill="#ff6fb5"/><path d="M80 124 L98 118 L98 134 Z" fill="#4d96ff"/><circle cx="80" cy="126" r="6.5" fill="#ffd23f" stroke="#f0a800" stroke-width="1.5"/>';
}

export function guideSvg(pose = 'happy', character = 'bunny') {
  const p = arms[pose] ? pose : 'happy';
  const ch = byId[character] || byId.bunny;
  const colorAttr = ch.colors ? ` style="--pip:${ch.colors.pip};--pip-light:${ch.colors.light};--pip-dark:${ch.colors.dark}"` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 190" aria-hidden="true" focusable="false"${colorAttr}>
${p === 'cheer' ? sparkles : ''}
${headDecor(ch.id, p)}
<ellipse cx="58" cy="182" rx="17" ry="9" fill="var(--pip-dark)"/><ellipse cx="102" cy="182" rx="17" ry="9" fill="var(--pip-dark)"/>
<ellipse cx="80" cy="148" rx="42" ry="36" fill="var(--pip)"/><ellipse cx="80" cy="154" rx="26" ry="24" fill="var(--pip-light)"/>
${arms[p]}
<ellipse cx="80" cy="90" rx="52" ry="46" fill="var(--pip)"/>
<ellipse cx="80" cy="102" rx="34" ry="26" fill="var(--pip-light)" opacity=".55"/>
${faceDecor(ch.id)}
<circle cx="46" cy="102" r="9" fill="#ff8fb1" opacity=".6"/><circle cx="114" cy="102" r="9" fill="#ff8fb1" opacity=".6"/>
${eyes[p]}
${noseFor(ch.id)}
${mouth[p]}
${accessoryFor(ch.id)}
</svg>`;
}

/** A Pip you can drop on a page. */
export function guide(pose = 'happy', size = 120, extra = '', character = 'bunny') {
  const node = el('div', { class: `guide guide-${pose} ${extra}`.trim(), style: { width: `${size}px`, height: `${Math.round(size * 190 / 160)}px` }, 'aria-hidden': 'true' });
  node.dataset.character = character;
  node.innerHTML = guideSvg(pose, character);
  applyHat(node);
  return node;
}

/** Pip wears whatever she picked in My World's wardrobe (a found secret). */
export function applyHat(node, id = store.get().hat) {
  const hat = hatById(id);
  if (hat) { node.dataset.hat = hat.emoji; node.dataset.hatPos = hat.pos; } else { delete node.dataset.hat; delete node.dataset.hatPos; }
}

/** Swap Pip's pose in place (keeps size and position). Character defaults to whatever it already was. */
export function setPose(node, pose, character) {
  const ch = character || node.dataset.character || 'bunny';
  node.className = node.className.replace(/guide-\w+/, `guide-${pose}`);
  node.dataset.character = ch;
  node.innerHTML = guideSvg(pose, ch);
}
