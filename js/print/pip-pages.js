// Coloring pages of Pip's friends: the same drawings as in the app, turned into outlines, standing in a little scene.
import { CHARACTERS, guideSvg } from '../core/guide.js';

const W = 750, H = 1000, INK = '#2b2d42';
const FONT = "Fredoka, 'Comic Sans MS', 'Chalkboard SE', system-ui, sans-serif";
const region = `class="region" fill="#fff" stroke="${INK}" stroke-width="3" stroke-linejoin="round"`;

/** The character's drawing with every colored part made white and outlined (eyes and mouth stay dark). */
function outlineCharacter(id, pose) {
  const keepDark = /^(#3a2a5e|#7a2c4d|#2b2b2b|#3a3a44)$/i;
  let svg = guideSvg(pose, id).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  svg = svg.replace(/ opacity="[^"]*"/g, '').replace(/ style="[^"]*"/g, '')
    .replace('<g fill="#ffd23f" stroke="#f0a800" stroke-width="1.5"', `<g class="region" fill="#fff" stroke="${INK}" stroke-width="2.5"`); // sparkles
  svg = svg.replace(/<(ellipse|circle|path|rect|polygon)([^>]*?) fill="([^"]+)"([^>]*?)\/>/g, (m, tag, a, fill, b) => {
    if (fill === 'none') return m;
    if (keepDark.test(fill) || (fill === '#fff' && /r="2\.7"|r="2\.5"/.test(a + b))) return `<${tag}${a} fill="${fill === '#2b2b2b' ? '#fff' : fill}"${b}${fill === '#2b2b2b' ? ` class="region" stroke="${INK}" stroke-width="3"` : ''}/>`;
    const clean = (a + b).replace(/ stroke(-width|-linejoin)?="[^"]*"/g, '');
    return `<${tag}${clean} ${region}/>`;
  });
  return svg;
}

const cloud = (x, y, s) => `<path ${region} d="M${x} ${y} q${-14 * s} 0 ${-14 * s} ${-12 * s} q0 ${-14 * s} ${16 * s} ${-12 * s} q${6 * s} ${-16 * s} ${26 * s} ${-12 * s} q${18 * s} ${-6 * s} ${24 * s} ${10 * s} q${16 * s} 0 ${14 * s} ${14 * s} q0 ${12 * s} ${-14 * s} ${12 * s} z"/>`;
const flower = (x, y) => {
  const petals = [0, 72, 144, 216, 288].map((a) => { const r = (a * Math.PI) / 180; return `<circle ${region} cx="${(x + Math.cos(r) * 14).toFixed(1)}" cy="${(y + Math.sin(r) * 14).toFixed(1)}" r="10"/>`; }).join('');
  return `<path d="M${x} ${y + 10} L${x} ${y + 70}" stroke="${INK}" stroke-width="3"/><ellipse ${region} cx="${x + 12}" cy="${y + 45}" rx="12" ry="6"/>${petals}<circle ${region} cx="${x}" cy="${y}" r="9"/>`;
};
const sun = (x, y) => {
  const rays = Array.from({ length: 10 }, (_, i) => { const r = (i * 36 * Math.PI) / 180; return `<path d="M${(x + Math.cos(r) * 42).toFixed(1)} ${(y + Math.sin(r) * 42).toFixed(1)} L${(x + Math.cos(r) * 58).toFixed(1)} ${(y + Math.sin(r) * 58).toFixed(1)}" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>`; }).join('');
  return `${rays}<circle ${region} cx="${x}" cy="${y}" r="34"/>`;
};

const star = (x, y, r) => {
  const pts = Array.from({ length: 10 }, (_, i) => { const a = (Math.PI / 5) * i - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r; return `${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`; });
  return `<polygon ${region} points="${pts.join(' ')}"/>`;
};
const flake = (x, y, r) => [0, 60, 120].map((a) => { const t = (a * Math.PI) / 180; return `<path d="M${(x - Math.cos(t) * r).toFixed(1)} ${(y - Math.sin(t) * r).toFixed(1)} L${(x + Math.cos(t) * r).toFixed(1)} ${(y + Math.sin(t) * r).toFixed(1)}" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`; }).join('');

// Backgrounds: "New one" picks another.
const SCENES = {
  meadow: (x0, y0, w, h) => `<path ${region} d="M${x0} ${y0 + 620} Q${x0 + 180} ${y0 + 540} ${x0 + 360} ${y0 + 610} T${x0 + w} ${y0 + 590} L${x0 + w} ${y0 + h} L${x0} ${y0 + h} Z"/>`
    + sun(x0 + 560, y0 + 90) + cloud(x0 + 140, y0 + 110, 1.6) + cloud(x0 + 380, y0 + 70, 1.1)
    + flower(x0 + 70, y0 + 640) + flower(x0 + 590, y0 + 650) + flower(x0 + 520, y0 + 700),
  beach: (x0, y0, w, h) => `<path ${region} d="M${x0} ${y0 + 470} q40 -20 80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t80 0 t90 0 L${x0 + w} ${y0 + 620} L${x0} ${y0 + 620} Z"/>`
    + `<path ${region} d="M${x0} ${y0 + 620} L${x0 + w} ${y0 + 620} L${x0 + w} ${y0 + h} L${x0} ${y0 + h} Z"/>`
    + sun(x0 + 110, y0 + 110) + cloud(x0 + 470, y0 + 110, 1.4)
    + `<path d="M${x0 + 560} ${y0 + 760} L${x0 + 590} ${y0 + 560}" stroke="${INK}" stroke-width="4"/><path ${region} d="M${x0 + 500} ${y0 + 580} Q${x0 + 590} ${y0 + 460} ${x0 + 680} ${y0 + 600} Z"/>`
    + `<ellipse ${region} cx="${x0 + 90}" cy="${y0 + 720}" rx="22" ry="14"/><ellipse ${region} cx="${x0 + 160}" cy="${y0 + 760}" rx="16" ry="11"/>` + star(x0 + 470, y0 + 740, 22),
  space: (x0, y0, w, h) => `<circle ${region} cx="${x0 + 120}" cy="${y0 + 130}" r="60"/><ellipse ${region} cx="${x0 + 120}" cy="${y0 + 130}" rx="95" ry="18" fill="none"/><circle ${region} cx="${x0 + 120}" cy="${y0 + 120}" r="40"/>`
    + `<circle ${region} cx="${x0 + 560}" cy="${y0 + 120}" r="48"/><circle ${region} cx="${x0 + 545}" cy="${y0 + 105}" r="10"/><circle ${region} cx="${x0 + 575}" cy="${y0 + 135}" r="7"/>`
    + star(x0 + 330, y0 + 70, 22) + star(x0 + 600, y0 + 330, 18) + star(x0 + 60, y0 + 380, 18) + star(x0 + 450, y0 + 220, 14)
    + `<path ${region} d="M${x0} ${y0 + 650} Q${x0 + w / 2} ${y0 + 560} ${x0 + w} ${y0 + 650} L${x0 + w} ${y0 + h} L${x0} ${y0 + h} Z"/>`
    + `<ellipse ${region} cx="${x0 + 150}" cy="${y0 + 720}" rx="40" ry="14"/><ellipse ${region} cx="${x0 + 520}" cy="${y0 + 740}" rx="30" ry="11"/>`,
  snow: (x0, y0, w, h) => `<path ${region} d="M${x0} ${y0 + 600} Q${x0 + 200} ${y0 + 520} ${x0 + 400} ${y0 + 600} T${x0 + w} ${y0 + 580} L${x0 + w} ${y0 + h} L${x0} ${y0 + h} Z"/>`
    + `<circle ${region} cx="${x0 + 560}" cy="${y0 + 640}" r="56"/><circle ${region} cx="${x0 + 560}" cy="${y0 + 548}" r="40"/><circle ${region} cx="${x0 + 560}" cy="${y0 + 482}" r="28"/>`
    + `<rect ${region} x="${x0 + 538}" y="${y0 + 432}" width="44" height="26"/><rect ${region} x="${x0 + 526}" y="${y0 + 456}" width="68" height="8"/>`
    + `<polygon ${region} points="${x0 + 560},${y0 + 484} ${x0 + 592},${y0 + 490} ${x0 + 560},${y0 + 494}"/>`
    + flake(x0 + 90, y0 + 90, 22) + flake(x0 + 300, y0 + 60, 16) + flake(x0 + 560, y0 + 120, 24) + flake(x0 + 420, y0 + 230, 14) + flake(x0 + 70, y0 + 330, 16) + flake(x0 + 620, y0 + 330, 14),
};
const SCENE_IDS = Object.keys(SCENES);

export function pipPage(id, sceneId = SCENE_IDS[Math.floor(Math.random() * SCENE_IDS.length)]) {
  const ch = CHARACTERS.find((c) => c.id === id) || CHARACTERS[0];
  const name = `Pip the ${ch.name.toLowerCase()}`;
  const x0 = 50, y0 = 130, w = 650, h = 800;
  const scene = `<rect ${region} x="${x0}" y="${y0}" width="${w}" height="${h}" rx="14"/>` + (SCENES[sceneId] || SCENES.meadow)(x0, y0, w, h);
  const pip = `<g transform="translate(${x0 + 105} ${y0 + 200}) scale(2.75)">${outlineCharacter(ch.id, 'cheer')}</g>`;
  return {
    title: name,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="${FONT}" role="img" aria-label="${name}">
<rect width="${W}" height="${H}" fill="#fff"/>
<text x="${W / 2}" y="70" text-anchor="middle" font-size="46" font-weight="700" fill="${INK}">${name}</text>
<text x="60" y="110" font-size="22" fill="${INK}">Name:</text><line x1="135" y1="110" x2="330" y2="110" stroke="${INK}" stroke-width="2"/>
<text x="${W - 60}" y="110" text-anchor="end" font-size="20" fill="#5c6078">Color it any way you like!</text>
<defs><clipPath id="pageclip"><rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="14"/></clipPath></defs>
<g clip-path="url(#pageclip)">${scene}${pip}</g>
<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="14" fill="none" stroke="${INK}" stroke-width="5" pointer-events="none"/></svg>`,
    free: true,
  };
}

export const PIP_PAGES = CHARACTERS.map((c) => ({ id: `pip-${c.id}`, emoji: c.emoji, title: `Pip the ${c.name.toLowerCase()}`, blurb: 'Color Pip!', make: () => pipPage(c.id) }));
