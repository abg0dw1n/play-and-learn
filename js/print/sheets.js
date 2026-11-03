// Printable sheet makers. Each returns { title, svg } where svg is a full-page picture (750 x 1000)
// that prints on Letter or A4. Everything is random, so "New one" is always different.
// Pure functions (no page access) so they can be tested in Node.
import { WORDS3, WORDS4, WORDS5 } from '../data/reading.js';

const rand = (n) => Math.floor(Math.random() * n);
const pick = (a) => a[rand(a.length)];
const shuffle = (a) => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = rand(i + 1); [r[i], r[j]] = [r[j], r[i]]; } return r; };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const W = 750, H = 1000;
const FONT = "Fredoka, 'Comic Sans MS', 'Chalkboard SE', system-ui, sans-serif";

/** The page: a title, a "Name" line, a short instruction, then whatever the sheet draws. */
function page(title, hint, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="${FONT}" role="img" aria-label="${esc(title)}">
<rect width="${W}" height="${H}" fill="#fff"/>
<text x="${W / 2}" y="68" text-anchor="middle" font-size="46" font-weight="700" fill="#2b2d42">${esc(title)}</text>
<text x="60" y="108" font-size="22" fill="#2b2d42">Name:</text><line x1="135" y1="108" x2="330" y2="108" stroke="#2b2d42" stroke-width="2"/>
<text x="${W - 60}" y="108" text-anchor="end" font-size="20" fill="#5c6078">${esc(hint)}</text>
${body}
</svg>`;
}

/* ---------------- Color by number / word / sum ---------------- */

export const COLORS = {
  red: '#e63946', pink: '#ff8fb1', yellow: '#ffd23f', orange: '#ff9f1c', green: '#43b05c', blue: '#4d96ff',
  brown: '#8d5a35', purple: '#8e5bd9', black: '#333333', grey: '#9aa0ad', tan: '#e6c48f',
};

// '.' = empty, digits = which colour of the picture's palette. All grids are 12 x 12.
export const PICTURES = [
  { name: 'heart', palette: { 1: 'red', 2: 'pink', 3: 'yellow' }, grid: [
    '..3......3..', '............', '..111..111..', '.1221111111.', '.1211111111.', '.1111111111.',
    '..11111111..', '...111111...', '....1111....', '.....11.....', '3..........3', '............'] },
  { name: 'star', palette: { 1: 'yellow', 2: 'orange', 3: 'blue' }, grid: [
    '3..........3', '.....11.....', '.....11.....', '....1111....', '.1111111111.', '..11122111..',
    '...112211...', '..11111111..', '..111..111..', '.111....111.', '.11......11.', '3..........3'] },
  { name: 'flower', palette: { 1: 'pink', 2: 'yellow', 3: 'green', 4: 'brown' }, grid: [
    '....1111....', '..11111111..', '.1111221111.', '.1111221111.', '..11111111..', '....1111....',
    '.....33.....', '..3..33..3..', '..333333333.', '.....33.....', '.....33.....', '444444444444'] },
  { name: 'house', palette: { 1: 'red', 2: 'yellow', 3: 'brown', 4: 'blue', 5: 'green' }, grid: [
    '.....11.....', '....1111....', '...111111...', '..11111111..', '.1111111111.', '111111111111',
    '.2222222222.', '.2442222442.', '.2442332442.', '.2222332222.', '.2222332222.', '555555555555'] },
  { name: 'butterfly', palette: { 1: 'purple', 2: 'pink', 3: 'black', 4: 'yellow' }, grid: [
    '..3......3..', '...3....3...', '....3..3....', '.11..33..11.', '1111.33.1111', '1441.33.1441',
    '1111.33.1111', '.11..33..11.', '.222.33.222.', '..22.33.22..', '............', '............'] },
  { name: 'ice cream', palette: { 1: 'pink', 2: 'brown', 3: 'tan', 4: 'red' }, grid: [
    '.....44.....', '....1111....', '...111111...', '..11111111..', '.1111111111.', '.2222222222.',
    '.2222222222.', '..33333333..', '...333333...', '....3333....', '.....33.....', '.....33.....'] },
  { name: 'rocket', palette: { 1: 'red', 2: 'grey', 3: 'blue', 4: 'orange', 5: 'yellow' }, grid: [
    '.....11.....', '5...1111...5', '....2222....', '...222222...', '...223322...', '5..223322..5',
    '...222222...', '..12222221..', '.1122222211.', '.11.2222.11.', '5...4444...5', '.....44.....'] },
  { name: 'apple', palette: { 1: 'red', 2: 'green', 3: 'brown', 4: 'pink' }, grid: [
    '.....3..22..', '.....3.222..', '.1111111111.', '114411111111', '114111111111', '111111111111',
    '111111111111', '.1111111111.', '.1111111111.', '..11111111..', '...111111...', '............'] },
].map((p) => ({ ...p, grid: p.grid.map((r) => r.slice(0, 12).padEnd(12, '.')) }));

const SIGHT = ['the', 'and', 'said', 'was', 'you', 'they', 'have', 'with', 'come', 'like', 'look', 'want', 'went', 'what', 'here',
  'where', 'there', 'when', 'good', 'help', 'jump', 'play', 'see', 'little'].filter((w) => w.length <= 5);

function sumFor(n, mix) {
  const canAdd = n >= 2, canSub = n <= 9;
  const sub = canSub && (!canAdd || (mix && Math.random() < 0.5));
  if (sub) { const a = n + 1 + rand(10 - n); return { text: `${a}−${a - n}`, ans: n }; }
  const a = 1 + rand(n - 1);
  return { text: `${a}+${n - a}`, ans: n };
}

/** mode: 'number' | 'word' | 'sum'.  diff: 0 | 1 | 2 (First Steps / Growing Strong / Super Star) */
export function colorSheet(mode, diff = 1, pic = pick(PICTURES)) {
  const codes = Object.keys(pic.palette);
  // What each colour is called on the page.
  let tag; // code -> a function that makes a label for a cell
  let keyText;
  if (mode === 'word') {
    const words = shuffle(SIGHT).slice(0, codes.length);
    tag = Object.fromEntries(codes.map((c, i) => [c, () => words[i]]));
    keyText = Object.fromEntries(codes.map((c, i) => [c, words[i]]));
  } else if (mode === 'sum') {
    const lo = 2, hi = diff === 0 ? 6 : 10;
    const answers = shuffle(Array.from({ length: hi - lo + 1 }, (_, i) => lo + i)).slice(0, codes.length);
    tag = Object.fromEntries(codes.map((c, i) => [c, () => sumFor(answers[i], diff === 2).text]));
    keyText = Object.fromEntries(codes.map((c, i) => [c, String(answers[i])]));
  } else {
    tag = Object.fromEntries(codes.map((c) => [c, () => c]));
    keyText = Object.fromEntries(codes.map((c) => [c, c]));
  }

  const cell = 52, x0 = (W - 12 * cell) / 2, y0 = 135;
  let grid = '';
  pic.grid.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '.') return;
    const label = tag[ch]();
    const size = mode === 'number' ? 26 : mode === 'sum' ? 16 : label.length <= 3 ? 18 : label.length === 4 ? 16 : 14;
    const x = x0 + c * cell, y = y0 + r * cell;
    grid += `<g data-code="${ch}"><rect class="cell" x="${x}" y="${y}" width="${cell}" height="${cell}" fill="#fff" stroke="#2b2d42" stroke-width="1.5"/>`
      + `<text x="${x + cell / 2}" y="${y + cell / 2 + size * 0.35}" text-anchor="middle" font-size="${size}" font-weight="700" fill="#2b2d42" pointer-events="none">${esc(label)}</text></g>`;
  }));

  const n = codes.length, gap = 120, kx0 = (W - (n - 1) * gap) / 2;
  const key = codes.map((c, i) => {
    const cx = kx0 + i * gap, name = pic.palette[c];
    return `<g class="key" data-key="${c}" data-color="${COLORS[name]}"><text x="${cx}" y="${y0 + 12 * cell + 62}" text-anchor="middle" font-size="${mode === 'number' ? 34 : 30}" font-weight="700" fill="#2b2d42">${esc(keyText[c])}</text>`
      + `<circle class="swatch" cx="${cx}" cy="${y0 + 12 * cell + 112}" r="30" fill="${COLORS[name]}" stroke="#2b2d42" stroke-width="3"/>`
      + `<text x="${cx}" y="${y0 + 12 * cell + 168}" text-anchor="middle" font-size="18" fill="#5c6078">${name}</text></g>`;
  }).join('');

  const titles = { number: ['Color by Number', 'Match the number to the color!'], word: ['Color by Word', 'Read the word. Color the box!'], sum: ['Color by Sum', 'Solve it. Color the box!'] };
  const [title, hint] = titles[mode];
  return { title, picture: pic.name, svg: page(title, hint, grid + key), interactive: true };
}

/* ---------------- Maze ---------------- */

const MAZE_THEMES = [['🐭', '🧀', 'Help the mouse find the cheese!'], ['🐝', '🌸', 'Help the bee find the flower!'],
  ['🐰', '🥕', 'Help the bunny find the carrot!'], ['🐶', '🦴', 'Help the puppy find the bone!'], ['🚀', '🌙', 'Fly the rocket to the moon!'],
  ['🐻', '🍯', 'Help the bear find the honey!']];

/** Returns cells with walls; every cell reachable (a "perfect" maze). */
export function makeMaze(cols, rows) {
  const cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ n: true, e: true, s: true, w: true, seen: false })));
  const stack = [[0, 0]];
  cells[0][0].seen = true;
  const dirs = [['n', 0, -1, 's'], ['e', 1, 0, 'w'], ['s', 0, 1, 'n'], ['w', -1, 0, 'e']];
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const options = dirs.filter(([, dx, dy]) => cells[y + dy]?.[x + dx] && !cells[y + dy][x + dx].seen);
    if (!options.length) { stack.pop(); continue; }
    const [d, dx, dy, back] = pick(options);
    cells[y][x][d] = false;
    cells[y + dy][x + dx][back] = false;
    cells[y + dy][x + dx].seen = true;
    stack.push([x + dx, y + dy]);
  }
  return cells;
}

export function mazeSheet(diff = 1) {
  const [cols, rows] = [[6, 8], [8, 11], [10, 14]][diff];
  const m = makeMaze(cols, rows);
  const [who, goal, hint] = pick(MAZE_THEMES);
  const size = Math.floor(Math.min(620 / cols, 690 / rows));
  const x0 = Math.round((W - cols * size) / 2), y0 = 190;
  let walls = '';
  const line = (x1, y1, x2, y2) => { walls += `M${x0 + x1 * size} ${y0 + y1 * size}L${x0 + x2 * size} ${y0 + y2 * size}`; };
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
    const c = m[y][x];
    if (c.n && !(x === 0 && y === 0)) line(x, y, x + 1, y);
    if (c.w) line(x, y, x, y + 1);
    if (x === cols - 1 && c.e) line(x + 1, y, x + 1, y + 1);
    if (c.s && !(x === cols - 1 && y === rows - 1)) line(x, y + 1, x + 1, y + 1);
  }
  const body = `<path d="${walls}" fill="none" stroke="#2b2d42" stroke-width="6" stroke-linecap="round"/>`
    + `<text x="${x0 + size / 2}" y="${y0 - 22}" text-anchor="middle" font-size="52">${who}</text>`
    + `<text x="${x0 + (cols - 0.5) * size}" y="${y0 + rows * size + 62}" text-anchor="middle" font-size="52">${goal}</text>`;
  return { title: 'Maze', svg: page('Maze', hint, body), interactive: false };
}

/* ---------------- Word search ---------------- */

export function wordSearchSheet(diff = 1) {
  const n = [6, 8, 9][diff], count = [4, 5, 6][diff];
  const pool = diff === 0 ? WORDS3 : diff === 1 ? [...WORDS3, ...WORDS4] : [...WORDS3, ...WORDS4, ...WORDS5];
  const dirs = diff === 2 ? [[1, 0], [0, 1], [1, 1]] : [[1, 0], [0, 1]];
  const grid = Array.from({ length: n }, () => Array(n).fill(''));
  const placed = [];
  for (const [word, emoji] of shuffle(pool)) {
    if (placed.length >= count) break;
    if (word.length > n || placed.some((p) => p.word === word)) continue;
    for (let tries = 0; tries < 60; tries++) {
      const [dx, dy] = pick(dirs);
      const x = rand(n - (dx ? word.length - 1 : 0)), y = rand(n - (dy ? word.length - 1 : 0));
      const fits = [...word].every((ch, i) => { const g = grid[y + dy * i][x + dx * i]; return g === '' || g === ch; });
      if (!fits) continue;
      [...word].forEach((ch, i) => { grid[y + dy * i][x + dx * i] = ch; });
      placed.push({ word, emoji, x, y, dx, dy });
      break;
    }
  }
  const letters = 'abcdefghijklmnoprstuw';
  for (const row of grid) row.forEach((v, i) => { if (!v) row[i] = letters[rand(letters.length)]; });

  const size = Math.floor(Math.min(600 / n, 76)), x0 = Math.round((W - n * size) / 2), y0 = 140;
  let body = '';
  grid.forEach((row, r) => row.forEach((ch, c) => {
    body += `<rect x="${x0 + c * size}" y="${y0 + r * size}" width="${size}" height="${size}" fill="#fff" stroke="#c9ccd8" stroke-width="1.5"/>`
      + `<text x="${x0 + c * size + size / 2}" y="${y0 + r * size + size * 0.68}" text-anchor="middle" font-size="${Math.round(size * 0.58)}" font-weight="600" fill="#2b2d42">${ch}</text>`;
  }));
  body += `<rect x="${x0}" y="${y0}" width="${n * size}" height="${n * size}" fill="none" stroke="#2b2d42" stroke-width="4" rx="6"/>`;
  const ly = y0 + n * size + 60;
  body += `<text x="${W / 2}" y="${ly - 14}" text-anchor="middle" font-size="26" font-weight="700" fill="#2b2d42">Find these words:</text>`;
  placed.forEach((p, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = 130 + col * 290, y = ly + 34 + row * 62;
    body += `<text x="${x}" y="${y}" font-size="38">${p.emoji}</text><text x="${x + 62}" y="${y - 4}" font-size="34" font-weight="600" fill="#2b2d42">${p.word}</text>`;
  });
  return { title: 'Word Search', svg: page('Word Search', 'Find the words. Circle them!', body), interactive: false, placed, grid };
}

/* ---------------- Dot to dot ---------------- */

const SHAPES = {
  star: Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.42 : 1; return [Math.cos(a) * r, Math.sin(a) * r]; }),
  house: [[0.5, 0], [1, 0.4], [0.85, 0.4], [0.85, 1], [0.15, 1], [0.15, 0.4], [0, 0.4]],
  crown: [[0, 1], [0, 0.2], [0.25, 0.55], [0.5, 0], [0.75, 0.55], [1, 0.2], [1, 1]],
  tree: [[0.4, 1], [0.4, 0.8], [0.05, 0.8], [0.3, 0.55], [0.15, 0.55], [0.4, 0.3], [0.28, 0.3], [0.5, 0], [0.72, 0.3], [0.6, 0.3], [0.85, 0.55],
    [0.7, 0.55], [0.95, 0.8], [0.6, 0.8], [0.6, 1]],
};

function heart(n) {
  // Dots spaced evenly along the outline (so the pointy tips don't get crowded), starting at the top dip.
  const M = 600, raw = Array.from({ length: M }, (_, i) => {
    const t = (i / M) * Math.PI * 2;
    return [16 * Math.sin(t) ** 3, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))];
  });
  const cum = [0];
  raw.forEach((p, i) => { const q = raw[(i + 1) % M]; cum.push(cum[i] + Math.hypot(p[0] - q[0], p[1] - q[1])); });
  return Array.from({ length: n }, (_, k) => {
    const target = (k / n) * cum[M];
    let i = 0;
    while (i < M - 1 && cum[i + 1] < target) i++;
    return raw[i];
  });
}

/** Add dots along the longest edges until there are `n` (keeps every corner). */
export function densify(poly, n) {
  const pts = poly.map((p) => [...p]);
  while (pts.length < n) {
    let best = 0, bl = -1;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], l = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (l > bl) { bl = l; best = i; }
    }
    const a = pts[best], b = pts[(best + 1) % pts.length];
    pts.splice(best + 1, 0, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]);
  }
  return pts;
}

export function dotSheet(diff = 1, shape = pick([...Object.keys(SHAPES), 'heart'])) {
  const n = [14, 22, 32][diff];
  let pts = shape === 'heart' ? heart(n) : densify(SHAPES[shape], n);
  // Fit into a 580 x 640 box, keeping the shape's proportions.
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const k = Math.min(520 / (maxX - minX), 600 / (maxY - minY));
  const cx = W / 2, cy = 560;
  pts = pts.map(([x, y]) => [cx + (x - (minX + maxX) / 2) * k, cy + (y - (minY + maxY) / 2) * k]);
  const mx = pts.reduce((s, p) => s + p[0], 0) / pts.length, my = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  let body = '';
  pts.forEach(([x, y], i) => {
    const d = Math.hypot(x - mx, y - my) || 1, lx = x + ((x - mx) / d) * 24, ly = y + ((y - my) / d) * 24;
    body += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6.5" fill="#2b2d42"/>`
      + `<text x="${lx.toFixed(1)}" y="${(ly + 7).toFixed(1)}" text-anchor="middle" font-size="21" font-weight="700" fill="#2b2d42">${i + 1}</text>`;
  });
  body += `<text x="${W / 2}" y="${H - 36}" text-anchor="middle" font-size="24" fill="#5c6078">What is it? ____________________</text>`;
  return { title: 'Dot to Dot', shape, svg: page('Dot to Dot', `Count 1 to ${n}. Connect the dots!`, body), interactive: false, points: pts };
}

export const SHEETS = [
  { id: 'number', emoji: '🎨', title: 'Color by Number', blurb: 'Match numbers to colors', make: (d) => colorSheet('number', d) },
  { id: 'word', emoji: '🔤', title: 'Color by Word', blurb: 'Read the word, pick the crayon', make: (d) => colorSheet('word', d) },
  { id: 'sum', emoji: '➕', title: 'Color by Sum', blurb: 'Solve it, then color it', make: (d) => colorSheet('sum', d) },
  { id: 'maze', emoji: '🐭', title: 'Mazes', blurb: 'Find the way through', make: mazeSheet },
  { id: 'words', emoji: '🔎', title: 'Word Search', blurb: 'Hunt for hidden words', make: wordSearchSheet },
  { id: 'dots', emoji: '🔢', title: 'Dot to Dot', blurb: 'Count and connect', make: dotSheet },
];
