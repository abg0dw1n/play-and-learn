// Printable PRACTICE pages: the same skills as the games, on paper. Each maker returns
// { title, svg, answerSvg, interactive:false } — answerSvg is the same page with the answers filled in (for grown-ups).
// Pure functions (no page access).
import { WORDS3, WORDS4, WORDS5 } from '../data/reading.js';

const rand = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rand(a.length)];
const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = rand(i + 1); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const W = 750, H = 1000, INK = '#2b2d42', KEY = '#e63946';
const FONT = "Fredoka, 'Comic Sans MS', 'Chalkboard SE', system-ui, sans-serif";

function page(title, hint, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="${FONT}" role="img" aria-label="${esc(title)}">
<rect width="${W}" height="${H}" fill="#fff"/>
<text x="${W / 2}" y="68" text-anchor="middle" font-size="46" font-weight="700" fill="${INK}">${esc(title)}</text>
<text x="60" y="108" font-size="22" fill="${INK}">Name:</text><line x1="135" y1="108" x2="330" y2="108" stroke="${INK}" stroke-width="2"/>
<text x="${W - 60}" y="108" text-anchor="end" font-size="20" fill="#5c6078">${esc(hint)}</text>
${body}
</svg>`;
}
const text = (x, y, s, size, o = {}) => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${o.anchor || 'start'}" font-weight="${o.weight || 600}" fill="${o.fill || INK}">${esc(s)}</text>`;
const box = (x, y, w, h, ans) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#fff" stroke="${INK}" stroke-width="3"/>`
  + (ans !== undefined ? text(x + w / 2, y + h * 0.72, ans, h * 0.7, { anchor: 'middle', weight: 700, fill: KEY }) : '');

/** Build a sheet from data: draw(withAnswers) returns the body. */
function make(title, hint, draw) {
  return { title, interactive: false, svg: page(title, hint, draw(false)), answerSvg: page(`${title} — Answers`, 'For grown-ups', draw(true)) };
}

/* ---------------- Add & Take Away ---------------- */
export function mathSheet(diff = 1) {
  const max = [5, 10, 20][diff];
  const probs = Array.from({ length: 12 }, (_, i) => {
    const add = i % 2 === 0;
    if (add) { const a = rand(max) , b = rand(max - a + 1); return { a, b, op: '+', ans: a + b }; }
    const a = 1 + rand(max), b = rand(a + 1); return { a, b, op: '−', ans: a - b };
  });
  const probsMixed = shuffle(probs);
  return make('Add & Take Away', diff === 0 ? 'Count the stars to help!' : 'Solve each one.', (ans) => probsMixed.map((p, i) => {
    const x = 50 + (i % 2) * 345, y = 140 + Math.floor(i / 2) * 140;
    let s = text(x, y + 62, `${p.a} ${p.op} ${p.b} =`, 50, { weight: 700 }) + box(x + 215, y + 12, 90, 68, ans ? p.ans : undefined);
    if (diff === 0) s += text(x, y + 108, '⭐'.repeat(p.a), 22);
    return s;
  }).join(''));
}

/* ---------------- Greater or Less ---------------- */
export function compareSheet(diff = 1) {
  const max = [10, 20, 99][diff];
  const rows = Array.from({ length: 10 }, () => {
    let a = 1 + rand(max), b = 1 + rand(max);
    if (a === b && diff < 2) b = a === max ? a - 1 : a + 1;
    return { a, b, sym: a > b ? '>' : a < b ? '<' : '=' };
  });
  return make('Greater or Less?', 'Write  >  <  or  =', (ans) => {
    let s = text(W / 2, 148, 'The hungry mouth eats the BIGGER number!', 24, { anchor: 'middle', fill: '#5c6078' });
    rows.forEach((r, i) => {
      const x = 70 + (i % 2) * 340, y = 190 + Math.floor(i / 2) * 150;
      s += text(x + 38, y + 70, r.a, 62, { anchor: 'middle', weight: 700 })
        + `<circle cx="${x + 135}" cy="${y + 50}" r="38" fill="#fff" stroke="${INK}" stroke-width="3" stroke-dasharray="${ans ? '0' : '8 6'}"/>`
        + (ans ? text(x + 135, y + 72, r.sym, 60, { anchor: 'middle', weight: 700, fill: KEY }) : '')
        + text(x + 232, y + 70, r.b, 62, { anchor: 'middle', weight: 700 });
    });
    return s;
  });
}

/* ---------------- Sight words (trace and write) ---------------- */
const EASY = ['the', 'and', 'is', 'it', 'in', 'a', 'to', 'I', 'my', 'we', 'me', 'he', 'go', 'no', 'so', 'up', 'on', 'at', 'am', 'do'];
const MORE = ['she', 'like', 'see', 'can', 'you', 'are', 'was', 'said', 'have', 'they', 'look', 'come', 'play', 'with', 'this', 'that', 'what', 'want', 'here', 'went', 'little'];
export function sightSheet(diff = 1) {
  const words = shuffle(diff === 0 ? EASY : diff === 1 ? [...EASY.slice(0, 8), ...MORE] : MORE).slice(0, 7);
  return make('Sight Words', 'Read it. Trace it. Write it!', (ans) => words.map((w, i) => {
    const y = 140 + i * 120;
    return text(60, y + 66, w, 64, { weight: 700 })
      + `<text x="260" y="${y + 66}" font-size="64" font-weight="700" fill="none" stroke="#b9bdd0" stroke-width="2" stroke-dasharray="3 5">${esc(w)}</text>`
      + `<line x1="470" y1="${y + 74}" x2="700" y2="${y + 74}" stroke="${INK}" stroke-width="2"/>`
      + (ans ? text(480, y + 66, w, 60, { fill: KEY, weight: 700 }) : '')
      + `<line x1="60" y1="${y + 100}" x2="700" y2="${y + 100}" stroke="#e1e3ee" stroke-width="2"/>`;
  }).join(''));
}

/* ---------------- Spell it: fill the missing letters ---------------- */
export function spellSheet(diff = 1) {
  const pool = diff === 0 ? WORDS3 : diff === 1 ? [...WORDS3, ...WORDS4] : [...WORDS4, ...WORDS5];
  const items = shuffle(pool).slice(0, 8).map(([word, emoji]) => {
    const n = word.length, blanks = new Set();
    if (diff === 0) blanks.add(1 + rand(n - 2 || 1));
    else { blanks.add(rand(n)); if (diff === 2) blanks.add((rand(n - 1) + 1 + [...blanks][0]) % n); }
    return { word, emoji, blanks };
  });
  return make('Spell It!', 'Write the missing letters.', (ans) => items.map((it, i) => {
    const x = 50 + (i % 2) * 345, y = 135 + Math.floor(i / 2) * 200, sz = Math.min(58, Math.floor(300 / it.word.length));
    let s = text(x + 150, y + 62, it.emoji, 62, { anchor: 'middle' });
    const start = x + 150 - (it.word.length * (sz + 6)) / 2;
    [...it.word].forEach((ch, k) => {
      const bx = start + k * (sz + 6);
      s += it.blanks.has(k) ? box(bx, y + 96, sz, sz + 6, ans ? ch : undefined) : text(bx + sz / 2, y + 96 + sz * 0.85, ch, sz * 0.9, { anchor: 'middle', weight: 700 });
    });
    return s;
  }).join(''));
}

/* ---------------- Read & match ---------------- */
export function matchSheet(diff = 1) {
  const pool = diff === 0 ? WORDS3 : diff === 1 ? [...WORDS3, ...WORDS4] : [...WORDS4, ...WORDS5];
  const six = shuffle(pool).slice(0, 6);
  const right = shuffle(six.map((_, i) => i));
  return make('Read & Match', 'Draw a line from the word to its picture.', (ans) => {
    let s = '';
    six.forEach(([w], i) => { s += text(110, 215 + i * 135, w, 56, { weight: 700 }) + `<circle cx="300" cy="${200 + i * 135}" r="9" fill="${INK}"/>`; });
    right.forEach((idx, j) => {
      s += `<circle cx="450" cy="${200 + j * 135}" r="9" fill="${INK}"/>` + text(580, 220 + j * 135, six[idx][1], 70, { anchor: 'middle' });
      if (ans) s += `<line x1="300" y1="${200 + idx * 135}" x2="450" y2="${200 + j * 135}" stroke="${KEY}" stroke-width="5" stroke-linecap="round"/>`;
    });
    return s;
  });
}

/* ---------------- Heavy or Light ---------------- */
const ITEMS = [['🪶', 0.001], ['🦋', 0.002], ['🎈', 0.005], ['🐭', 0.03], ['🍎', 0.2], ['🧸', 0.5], ['🐱', 4], ['🍉', 6], ['🐶', 25],
  ['🐑', 80], ['🐻', 300], ['🐄', 600], ['🦒', 1200], ['🚗', 1500], ['🐘', 5000], ['🚌', 12000], ['🐳', 100000]];
export function weightSheet(diff = 1) {
  const min = [100, 20, 5][diff];
  const rows = [];
  for (let t = 0; rows.length < 8 && t < 500; t++) {
    const [a, b] = shuffle(ITEMS).slice(0, 2);
    if (Math.max(a[1], b[1]) / Math.min(a[1], b[1]) < min) continue;
    rows.push({ a, b, ask: rows.length % 2 === 0 ? 'heavier' : 'lighter' });
  }
  return make('Heavy or Light?', 'Circle the one asked for.', (ans) => rows.map((r, i) => {
    const y = 150 + i * 106, win = (r.ask === 'heavier') === (r.a[1] > r.b[1]) ? 0 : 1;
    let s = text(50, y + 66, r.ask === 'heavier' ? 'Heavier?' : 'Lighter?', 30, { weight: 700, fill: r.ask === 'heavier' ? '#d6342f' : '#2f7de1' });
    [r.a, r.b].forEach((it, k) => {
      const cx = 360 + k * 210;
      s += text(cx, y + 74, it[0], 72, { anchor: 'middle' });
      if (ans && k === win) s += `<circle cx="${cx}" cy="${y + 48}" r="52" fill="none" stroke="${KEY}" stroke-width="5"/>`;
    });
    return s + `<line x1="50" y1="${y + 98}" x2="700" y2="${y + 98}" stroke="#e1e3ee" stroke-width="2"/>`;
  }).join(''));
}

export const PRACTICE = [
  { id: 'p-math', emoji: '➕', title: 'Add & Take Away', blurb: 'Plus and minus practice', make: mathSheet },
  { id: 'p-compare', emoji: '🐊', title: 'Greater or Less', blurb: 'Write > < or =', make: compareSheet },
  { id: 'p-sight', emoji: '👀', title: 'Sight Words', blurb: 'Read, trace, write', make: sightSheet },
  { id: 'p-spell', emoji: '✏️', title: 'Spell It!', blurb: 'Fill the missing letters', make: spellSheet },
  { id: 'p-match', emoji: '🔗', title: 'Read & Match', blurb: 'Connect word to picture', make: matchSheet },
  { id: 'p-weight', emoji: '⚖️', title: 'Heavy or Light', blurb: 'Circle heavier or lighter', make: weightSheet },
];
