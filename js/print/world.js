// Printable pages from her own My World: a poster of the world she built, and her sticker collection sheet.
import { store } from '../core/store.js';
import { owned, STICKERS } from '../core/stickers.js';
import { SETS, sceneById } from '../world/data.js';
import { defaultSpot, baseSize } from '../world/scene.js';

const W = 750, H = 1000;
const FONT = "Fredoka, 'Comic Sans MS', 'Chalkboard SE', system-ui, sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const wrap = (title, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="${FONT}" role="img" aria-label="${esc(title)}"><rect width="${W}" height="${H}" fill="#fff"/>${body}</svg>`;
const THEME = { meadow: ['#bfe9ff', '#9be37f', '#6fcf6a'], beach: ['#bfe9ff', '#ffe29a', '#f6cf74'], space: ['#2b2d6e', '#8a82b8', '#6a62a0'], snow: ['#dff1ff', '#f4fbff', '#dcefff'], candy: ['#ffd1ea', '#ffb3d9', '#b8f0d6'] };

export function posterSheet() {
  const st = store.get();
  const sc = sceneById(st.world?.scene);
  const [sky, h1, h2] = THEME[sc.id] || THEME.meadow;
  const name = st.name ? `${st.name}'s World` : 'My World';
  const X0 = 40, Y0 = 130, PW = 670, PH = 800;
  const items = [...owned(), ...(st.decor || [])].map((e) => {
    const sv = st.world?.items?.[e] || {}, d = defaultSpot(e);
    const x = sv.x ?? d.x, y = sv.y ?? d.y, s = sv.s ?? 1;
    const size = (baseSize(e, y) * s / 100) * PW * 1.1;
    return { e, x: X0 + (x / 100) * PW, y: Y0 + (y / 100) * PH, size, f: sv.f, z: y };
  }).sort((a, b) => a.z - b.z);
  const body = `<defs><clipPath id="pc"><rect x="${X0}" y="${Y0}" width="${PW}" height="${PH}" rx="30"/></clipPath></defs>
<text x="${W / 2}" y="85" text-anchor="middle" font-size="58" font-weight="700" fill="#2b2d42">🌈 ${esc(name)}</text>
<g clip-path="url(#pc)"><rect x="${X0}" y="${Y0}" width="${PW}" height="${PH}" fill="${sky}"/>
<ellipse cx="${X0 + PW / 2}" cy="${Y0 + PH * 1.02}" rx="${PW * 0.8}" ry="${PH * 0.5}" fill="${h1}"/>
<ellipse cx="${X0 + PW * 0.3}" cy="${Y0 + PH * 1.18}" rx="${PW * 0.9}" ry="${PH * 0.42}" fill="${h2}"/>
${items.map((i) => `<text x="${i.x.toFixed(0)}" y="${i.y.toFixed(0)}" font-size="${i.size.toFixed(0)}" text-anchor="middle" dominant-baseline="central"${i.f ? ` transform="translate(${(i.x * 2).toFixed(0)} 0) scale(-1 1)"` : ''}>${i.e}</text>`).join('')}</g>
<rect x="${X0}" y="${Y0}" width="${PW}" height="${PH}" rx="30" fill="none" stroke="#2b2d42" stroke-width="5"/>
<text x="${W / 2}" y="975" text-anchor="middle" font-size="26" fill="#5c6078">${owned().length} stickers collected!</text>`;
  return { title: 'My World poster', svg: wrap('My World poster', body) };
}

export function collectionSheet() {
  const have = new Set(owned());
  let y = 150;
  const parts = SETS.map((set, si) => {
    const col = si % 2, row = Math.floor(si / 2);
    const x0 = 40 + col * 345, y0 = 130 + row * 205;
    y = y0;
    const cells = [...set.members, set.bonus.emoji].map((e, i) => {
      const got = e === set.bonus.emoji ? set.members.every((m) => have.has(m)) : have.has(e);
      const cx = x0 + 28 + (i % 3) * 100, cy = y0 + 85 + Math.floor(i / 3) * 80;
      return got ? `<text x="${cx + 22}" y="${cy}" font-size="56" text-anchor="middle" dominant-baseline="central">${e}</text>`
        : `<circle cx="${cx + 22}" cy="${cy}" r="32" fill="none" stroke="#b9bdd0" stroke-width="3" stroke-dasharray="7 6"/>`;
    }).join('');
    return `<rect x="${x0}" y="${y0}" width="325" height="190" rx="22" fill="#fff8e1" stroke="#2b2d42" stroke-width="3"/><text x="${x0 + 16}" y="${y0 + 38}" font-size="28" font-weight="700" fill="#2b2d42">${set.icon} ${esc(set.name)}</text>${cells}`;
  }).join('');
  const body = `<text x="${W / 2}" y="78" text-anchor="middle" font-size="50" font-weight="700" fill="#2b2d42">My Sticker Collection</text>${parts}
<text x="${W / 2}" y="${y + 240}" text-anchor="middle" font-size="26" fill="#5c6078">${STICKERS.filter(([e]) => have.has(e)).length} of ${STICKERS.length} found. Finish a set to get a surprise!</text>`;
  return { title: 'My sticker collection', svg: wrap('My sticker collection', body) };
}

export const WORLD_SHEETS = [
  { id: 'poster', emoji: '🌈', title: 'My World Poster', blurb: 'The world you built', make: posterSheet },
  { id: 'collection', emoji: '⭐', title: 'My Sticker Sheet', blurb: 'All the stickers you found', make: collectionSheet },
];
