// Soft, happy drawing kit for coloring pages: round shapes, thick rounded lines, sparkly eyes and big smiles.
import { INK, lockShape, smoothClosed, spline } from './draw.js';

const f = (n) => +(+n).toFixed(1);
export const R = (w = 4) => `class="region" fill="#fff" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
export const P = (d, w) => `<path ${R(w)} d="${d}"/>`;
export const L = (d, w = 2.6) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const C = (x, y, r, w = 3.5) => `<circle ${R(w)} cx="${f(x)}" cy="${f(y)}" r="${f(r)}"/>`;
export const E = (x, y, rx, ry, rot = 0, w = 3.5) => `<ellipse ${R(w)} cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}"${rot ? ` transform="rotate(${rot} ${f(x)} ${f(y)})"` : ''}/>`;
export const B = (pts, w = 3.5) => P(smoothClosed(pts), w);
/** A rectangle with rounded corners. */
export const RR = (x, y, w, h, r = 10, sw = 3.4) => `<rect ${R(sw)} x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${r}"/>`;
export const T = (pts, w0, w1 = 0, w = 3.5) => P(lockShape(pts, w0, w1), w);
export const dark = (x, y, r) => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${INK}"/>`;
/** Draw something in its own coordinates, moved to (x, y) and scaled. */
export const at = (x, y, s, body) => `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">${body}</g>`;
export const mirrorPts = (pts, cx = 0) => pts.map(([x, y]) => [2 * cx - x, y]);
/** A smooth open line through points. */
export function SL(pts, w = 2.4) {
  const s = spline(pts, 8);
  return L(`M${s.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L')}`, w);
}

/** Sparkly eyes, rosy cheeks and a big smile (open by default). */
export function happyFace(cx, cy, s = 1, { gap = 22, lashes = true, mouth = 'open', cheeks = true, nose = false } = {}) {
  let o = '';
  for (const k of [-1, 1]) {
    const x = cx + k * gap * s;
    o += `<ellipse cx="${f(x)}" cy="${f(cy)}" rx="${f(10 * s)}" ry="${f(13 * s)}" fill="${INK}"/>`;
    o += `<circle cx="${f(x + 3.5 * s)}" cy="${f(cy - 5 * s)}" r="${f(4.2 * s)}" fill="#fff"/><circle cx="${f(x - 3.5 * s)}" cy="${f(cy + 6 * s)}" r="${f(2.2 * s)}" fill="#fff"/>`;
    if (lashes) o += L(`M${f(x + k * 9 * s)} ${f(cy - 7 * s)} L${f(x + k * 16 * s)} ${f(cy - 12 * s)}`, 2.2);
    if (cheeks) o += E(cx + k * (gap + 16) * s, cy + 16 * s, 10 * s, 7 * s, 0, 2);
  }
  if (nose) o += `<ellipse cx="${f(cx)}" cy="${f(cy + 10 * s)}" rx="${f(5 * s)}" ry="${f(3.6 * s)}" fill="${INK}"/>`;
  const my = cy + (nose ? 18 : 18) * s;
  if (mouth === 'open') o += P(`M${f(cx - 11 * s)} ${f(my)} C${f(cx - 8 * s)} ${f(my + 16 * s)} ${f(cx + 8 * s)} ${f(my + 16 * s)} ${f(cx + 11 * s)} ${f(my)} C${f(cx + 4 * s)} ${f(my + 4 * s)} ${f(cx - 4 * s)} ${f(my + 4 * s)} ${f(cx - 11 * s)} ${f(my)} Z`, 2.8)
    + L(`M${f(cx - 5 * s)} ${f(my + 10 * s)} C${f(cx - 2 * s)} ${f(my + 7 * s)} ${f(cx + 2 * s)} ${f(my + 7 * s)} ${f(cx + 5 * s)} ${f(my + 10 * s)}`, 1.8);
  else o += L(`M${f(cx - 10 * s)} ${f(my)} C${f(cx - 5 * s)} ${f(my + 9 * s)} ${f(cx + 5 * s)} ${f(my + 9 * s)} ${f(cx + 10 * s)} ${f(my)}`, 2.8);
  return o;
}
/** A face seen from the side (one eye): for unicorns, dinos and fish. */
export function sideFace(x, y, s = 1, { lashes = true } = {}) {
  return `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(9 * s)}" ry="${f(12 * s)}" fill="${INK}"/><circle cx="${f(x + 3 * s)}" cy="${f(y - 4.5 * s)}" r="${f(3.8 * s)}" fill="#fff"/><circle cx="${f(x - 3 * s)}" cy="${f(y + 5 * s)}" r="${f(2 * s)}" fill="#fff"/>`
    + (lashes ? L(`M${f(x - 8 * s)} ${f(y - 8 * s)} L${f(x - 14 * s)} ${f(y - 14 * s)} M${f(x - 2 * s)} ${f(y - 12 * s)} L${f(x - 4 * s)} ${f(y - 19 * s)}`, 2.2) : '');
}

export const bubble = (x, y, r) => C(x, y, r, 3) + L(`M${f(x - r * 0.55)} ${f(y - r * 0.05)} C${f(x - r * 0.55)} ${f(y - r * 0.45)} ${f(x - r * 0.25)} ${f(y - r * 0.6)} ${f(x + r * 0.05)} ${f(y - r * 0.58)}`, 2.2);
export function star(x, y, r, w = 3) {
  const pts = []; for (let i = 0; i < 10; i++) { const a = (i * 36 - 90) * Math.PI / 180, rr = i % 2 ? r * 0.5 : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); }
  return B(pts, w);
}
export const heart = (x, y, s = 1, w = 3) => P(`M${f(x)} ${f(y + 8 * s)} C${f(x)} ${f(y - 6 * s)} ${f(x - 24 * s)} ${f(y - 8 * s)} ${f(x - 24 * s)} ${f(y + 10 * s)} C${f(x - 24 * s)} ${f(y + 26 * s)} ${f(x - 6 * s)} ${f(y + 34 * s)} ${f(x)} ${f(y + 42 * s)} C${f(x + 6 * s)} ${f(y + 34 * s)} ${f(x + 24 * s)} ${f(y + 26 * s)} ${f(x + 24 * s)} ${f(y + 10 * s)} C${f(x + 24 * s)} ${f(y - 8 * s)} ${f(x)} ${f(y - 6 * s)} ${f(x)} ${f(y + 8 * s)} Z`, w);
export function cloud(x, y, s = 1, face = false) {
  const pts = [[-62, 0], [-74, -18], [-58, -38], [-34, -36], [-20, -60], [10, -62], [26, -42], [48, -50], [68, -32], [74, -8], [58, 6], [0, 8]].map(([a, b]) => [x + a * s, y + b * s]);
  return B(pts, 3.5) + (face ? happyFace(x, y - 24 * s, s * 0.6, { lashes: false, mouth: 'smile', gap: 20 }) : '');
}
export function sun(x, y, r = 36, face = true) {
  let o = '';
  for (let i = 0; i < 10; i++) { const a = i * 36; const rad = a * Math.PI / 180; o += E(x + Math.cos(rad) * (r + 18), y + Math.sin(rad) * (r + 18), 7, 13, a + 90, 3); }
  return o + C(x, y, r, 4) + (face ? happyFace(x, y - 4, r / 40, { lashes: false, gap: 16 }) : '');
}
export function flower(x, y, s = 1, stem = 70) {
  let o = '';
  if (stem) o += SL([[x, y + 12 * s], [x - 5 * s, y + stem * 0.5 * s], [x, y + stem * s]], 3) + T([[x, y + stem * 0.62 * s], [x + 14 * s, y + stem * 0.5 * s], [x + 28 * s, y + stem * 0.44 * s]], 16 * s, 0, 3);
  for (let i = 0; i < 5; i++) { const a = (i * 72 - 90) * Math.PI / 180; o += C(x + Math.cos(a) * 13 * s, y + Math.sin(a) * 13 * s, 11 * s, 3); }
  return o + C(x, y, 9 * s, 3);
}
export function tulip(x, y, s = 1) {
  return SL([[x, y], [x + 3 * s, y + 30 * s], [x, y + 60 * s]], 3) + T([[x, y + 44 * s], [x - 14 * s, y + 30 * s], [x - 26 * s, y + 26 * s]], 14 * s, 0, 3)
    + B([[x - 18 * s, y - 26 * s], [x - 9 * s, y - 14 * s], [x, y - 30 * s], [x + 9 * s, y - 14 * s], [x + 18 * s, y - 26 * s], [x + 16 * s, y - 2 * s], [x, y + 6 * s], [x - 16 * s, y - 2 * s]], 3);
}
export function butterfly(x, y, s = 1, face = true) {
  let o = '';
  for (const k of [-1, 1]) {
    o += B([[x + k * 4 * s, y - 4 * s], [x + k * 22 * s, y - 34 * s], [x + k * 44 * s, y - 34 * s], [x + k * 46 * s, y - 12 * s], [x + k * 26 * s, y + 2 * s]], 3);
    o += B([[x + k * 4 * s, y + 4 * s], [x + k * 30 * s, y + 8 * s], [x + k * 34 * s, y + 28 * s], [x + k * 18 * s, y + 34 * s], [x + k * 6 * s, y + 18 * s]], 3);
    o += C(x + k * 28 * s, y - 18 * s, 7 * s, 2.4);
    o += L(`M${f(x + k * 3 * s)} ${f(y - 22 * s)} C${f(x + k * 8 * s)} ${f(y - 38 * s)} ${f(x + k * 14 * s)} ${f(y - 42 * s)} ${f(x + k * 18 * s)} ${f(y - 40 * s)}`, 2.2) + C(x + k * 19 * s, y - 41 * s, 3.5 * s, 2);
  }
  o += E(x, y + 6 * s, 6 * s, 22 * s, 0, 3) + C(x, y - 18 * s, 9 * s, 3);
  if (face) o += `<circle cx="${f(x - 3 * s)}" cy="${f(y - 19 * s)}" r="${f(1.8 * s)}" fill="${INK}"/><circle cx="${f(x + 3 * s)}" cy="${f(y - 19 * s)}" r="${f(1.8 * s)}" fill="${INK}"/>` + L(`M${f(x - 3 * s)} ${f(y - 14 * s)} Q${f(x)} ${f(y - 11 * s)} ${f(x + 3 * s)} ${f(y - 14 * s)}`, 1.6);
  return o;
}
export const birds = (list) => list.map(([x, y, s = 1]) => L(`M${f(x - 12 * s)} ${f(y)} q${f(6 * s)} ${f(-9 * s)} ${f(12 * s)} 0 q${f(6 * s)} ${f(-9 * s)} ${f(12 * s)} 0`, 2.6)).join('');
export function bunting(x1, y1, x2, y2, n = 10, sag = 20) {
  let o = L(`M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + sag * 2} ${x2} ${y2}`, 2.6);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, mx = (x1 + x2) / 2, my = (y1 + y2) / 2 + sag * 2;
    const x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * mx + t * t * x2, y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * my + t * t * y2;
    o += P(`M${f(x - 15)} ${f(y)} L${f(x + 15)} ${f(y)} Q${f(x + 6)} ${f(y + 18)} ${f(x)} ${f(y + 30)} Q${f(x - 6)} ${f(y + 18)} ${f(x - 15)} ${f(y)} Z`, 2.8);
  }
  return o;
}
/** Rolling hills in three soft layers. */
export const hills = (y = 600) => P(`M0 ${y - 40} C120 ${y - 130} 220 ${y - 40} 330 ${y - 70} C440 ${y - 100} 560 ${y - 40} 650 ${y - 70} L650 800 L0 800 Z`, 3.5)
  + P(`M0 ${y + 10} C160 ${y - 50} 300 ${y + 30} 420 ${y} C520 ${y - 24} 600 ${y} 650 ${y - 6} L650 800 L0 800 Z`, 3.5)
  + P(`M0 ${y + 90} C200 ${y + 40} 380 ${y + 110} 650 ${y + 70} L650 800 L0 800 Z`, 3.5);
export function meadow(y = 710) {
  let o = '';
  [[40, 0, 'f'], [110, 20, 't'], [190, 6, 'g'], [260, 26, 'f'], [350, 10, 't'], [430, 24, 'g'], [500, 4, 'f'], [580, 22, 't']].forEach(([x, dy, k]) => {
    o += k === 'f' ? flower(x, y + dy, 0.7, 50) : k === 't' ? tulip(x, y + dy, 0.75) : L(`M${x} ${y + dy + 60} q-4 -16 -10 -22 M${x + 8} ${y + dy + 60} q0 -18 2 -26 M${x + 16} ${y + dy + 60} q4 -14 10 -20`, 2.6);
  });
  return o;
}
/** A puffy tree. */
export const tree = (x, y, s = 1) => P(`M${x - 10 * s} ${y} C${x - 8 * s} ${y - 40 * s} ${x - 10 * s} ${y - 60 * s} ${x - 8 * s} ${y - 80 * s} L${x + 8 * s} ${y - 80 * s} C${x + 10 * s} ${y - 60 * s} ${x + 8 * s} ${y - 40 * s} ${x + 10 * s} ${y} Z`, 3.5)
  + B([[x - 50 * s, y - 90 * s], [x - 56 * s, y - 130 * s], [x - 30 * s, y - 160 * s], [x, y - 172 * s], [x + 32 * s, y - 160 * s], [x + 56 * s, y - 130 * s], [x + 50 * s, y - 92 * s], [x + 20 * s, y - 76 * s], [x - 20 * s, y - 76 * s]], 3.5)
  + C(x - 22 * s, y - 120 * s, 6 * s, 2.4) + C(x + 18 * s, y - 136 * s, 6 * s, 2.4) + C(x + 26 * s, y - 104 * s, 6 * s, 2.4);
