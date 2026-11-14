// Tiny drawing kit for coloring pages: every closed shape is a "region" (white, outlined) that can be colored by
// tapping on screen; "line" is a detail stroke that isn't colored. Coordinates are page pixels (750 x 1000 page).
export const INK = '#2b2d42';
export const FONT = "Fredoka, 'Comic Sans MS', 'Chalkboard SE', system-ui, sans-serif";
const R = (w = 3) => `class="region" fill="#fff" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
const f = (n) => +(+n).toFixed(1);

export const path = (d, w) => `<path ${R(w)} d="${d}"/>`;
export const circle = (cx, cy, r, w) => `<circle ${R(w)} cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}"/>`;
export const ellipse = (cx, cy, rx, ry, rot = 0, w) => `<ellipse ${R(w)} cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}"${rot ? ` transform="rotate(${rot} ${f(cx)} ${f(cy)})"` : ''}/>`;
export const rect = (x, y, w, h, rx = 0, sw) => `<rect ${R(sw)} x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${rx}"/>`;
export const poly = (pts, w) => `<polygon ${R(w)} points="${pts.map(f).join(' ')}"/>`;
export const line = (d, w = 3) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
export const dot = (cx, cy, r) => `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(r)}" fill="${INK}"/>`;
/** A friendly closed eye-catch: dark oval with a white shine. */
export const eye = (cx, cy, rx = 7, ry = 9) => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${rx}" ry="${ry}" fill="${INK}"/><circle cx="${f(cx + rx * 0.35)}" cy="${f(cy - ry * 0.35)}" r="${f(rx * 0.35)}" fill="#fff"/>`;

export const cloud = (x, y, s = 1) => path(`M${x} ${y} q${-14 * s} 0 ${-14 * s} ${-12 * s} q0 ${-14 * s} ${16 * s} ${-12 * s} q${6 * s} ${-16 * s} ${26 * s} ${-12 * s} q${18 * s} ${-6 * s} ${24 * s} ${10 * s} q${16 * s} 0 ${14 * s} ${14 * s} q0 ${12 * s} ${-14 * s} ${12 * s} z`);
export const star = (x, y, r, w) => {
  const pts = []; for (let i = 0; i < 10; i++) { const a = (Math.PI / 5) * i - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r; pts.push(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  return poly(pts, w);
};
export const heart = (x, y, s = 1) => path(`M${x} ${y + 8 * s} C${x} ${y - 4 * s} ${x - 22 * s} ${y - 6 * s} ${x - 22 * s} ${y + 10 * s} C${x - 22 * s} ${y + 24 * s} ${x - 6 * s} ${y + 32 * s} ${x} ${y + 40 * s} C${x + 6 * s} ${y + 32 * s} ${x + 22 * s} ${y + 24 * s} ${x + 22 * s} ${y + 10 * s} C${x + 22 * s} ${y - 6 * s} ${x} ${y - 4 * s} ${x} ${y + 8 * s}Z`);
export const flower = (x, y, s = 1, stem = 70) => {
  let out = stem ? line(`M${x} ${y + 10 * s} L${x} ${y + stem * s}`) + ellipse(x + 12 * s, y + stem * 0.62 * s, 12 * s, 6 * s, -20) : '';
  for (let i = 0; i < 5; i++) { const a = (i * 72 * Math.PI) / 180 - Math.PI / 2; out += circle(x + Math.cos(a) * 14 * s, y + Math.sin(a) * 14 * s, 10 * s); }
  return out + circle(x, y, 9 * s);
};
export const sun = (x, y, r = 34, face = false) => {
  let out = '';
  for (let i = 0; i < 10; i++) { const a = (i * 36 * Math.PI) / 180; out += line(`M${f(x + Math.cos(a) * (r + 8))} ${f(y + Math.sin(a) * (r + 8))} L${f(x + Math.cos(a) * (r + 24))} ${f(y + Math.sin(a) * (r + 24))}`, 4); }
  out += circle(x, y, r);
  if (face) out += eye(x - r * 0.35, y - r * 0.15, 4, 5) + eye(x + r * 0.35, y - r * 0.15, 4, 5) + line(`M${x - r * 0.35} ${y + r * 0.25} Q${x} ${y + r * 0.6} ${x + r * 0.35} ${y + r * 0.25}`);
  return out;
};
export const grass = (x, y, n = 3) => { let d = ''; for (let i = 0; i < n; i++) d += `M${x + i * 10} ${y} l${-4 + i * 4} -18 `; return line(d, 2.5); };
export const bubble = (x, y, r) => circle(x, y, r) + line(`M${x - r * 0.45} ${y - r * 0.1} Q${x - r * 0.4} ${y - r * 0.5} ${x - r * 0.05} ${y - r * 0.55}`, 2);

/** A finished page: title, name line, hint, and the drawing clipped to a rounded frame. */
export function coloringPage(title, body) {
  const W = 750, H = 1000, x0 = 50, y0 = 130, w = 650, h = 800;
  const t = title.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="${FONT}" role="img" aria-label="${t}">
<rect width="${W}" height="${H}" fill="#fff"/>
<text x="${W / 2}" y="70" text-anchor="middle" font-size="46" font-weight="700" fill="${INK}">${t}</text>
<text x="60" y="110" font-size="22" fill="${INK}">Name:</text><line x1="135" y1="110" x2="330" y2="110" stroke="${INK}" stroke-width="2"/>
<text x="${W - 60}" y="110" text-anchor="end" font-size="20" fill="#5c6078">Color it any way you like!</text>
<defs><clipPath id="pageclip"><rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="14"/></clipPath></defs>
<g clip-path="url(#pageclip)">${rect(x0, y0, w, h, 14)}<g transform="translate(${x0} ${y0})">${body}</g></g>
<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="14" fill="none" stroke="${INK}" stroke-width="5" pointer-events="none"/></svg>`;
}

/* ---- extra detail for older kids: patterns and busy backgrounds ---- */
/** Three layers of rolling hills (more parts to color). */
export const hills3 = (y = 600) => path(`M0 ${y - 40} Q120 ${y - 120} 260 ${y - 60} T520 ${y - 80} T650 ${y - 50} L650 800 L0 800 Z`)
  + path(`M0 ${y + 10} Q180 ${y - 50} 360 ${y + 10} T650 ${y} L650 800 L0 800 Z`)
  + path(`M0 ${y + 80} Q220 ${y + 30} 420 ${y + 85} T650 ${y + 70} L650 800 L0 800 Z`);
/** A string of party flags between two points. */
export function bunting(x1, y1, x2, y2, n = 8, sag = 40) {
  let o = line(`M${x1} ${y1} Q${(x1 + x2) / 2} ${(y1 + y2) / 2 + sag * 2} ${x2} ${y2}`, 2.5);
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * ((x1 + x2) / 2) + t * t * x2;
    const y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * ((y1 + y2) / 2 + sag * 2) + t * t * y2;
    o += poly([x - 14, y, x + 14, y, x, y + 30]);
  }
  return o;
}
/** Little birds (two arcs). */
export const birds = (list) => list.map(([x, y, s = 1]) => line(`M${x - 12 * s} ${y} q${6 * s} ${-8 * s} ${12 * s} 0 q${6 * s} ${-8 * s} ${12 * s} 0`, 2.5)).join('');
/** A small butterfly. */
export const butterfly = (x, y, s = 1) => ellipse(x - 14 * s, y - 8 * s, 13 * s, 16 * s, -20) + ellipse(x + 14 * s, y - 8 * s, 13 * s, 16 * s, 20)
  + ellipse(x - 10 * s, y + 12 * s, 9 * s, 11 * s, 25) + ellipse(x + 10 * s, y + 12 * s, 9 * s, 11 * s, -25) + ellipse(x, y + 2 * s, 4 * s, 16 * s)
  + line(`M${x - 2 * s} ${y - 13 * s} q${-5 * s} ${-10 * s} ${-10 * s} ${-12 * s} M${x + 2 * s} ${y - 13 * s} q${5 * s} ${-10 * s} ${10 * s} ${-12 * s}`, 2);
/** A tulip with a leaf. */
export const tulip = (x, y, s = 1) => line(`M${x} ${y} L${x} ${y + 60 * s}`) + path(`M${x} ${y + 40 * s} q${18 * s} ${-18 * s} ${24 * s} ${-6 * s} q${-10 * s} ${14 * s} ${-24 * s} ${12 * s} Z`)
  + path(`M${x - 16 * s} ${y - 28 * s} L${x - 8 * s} ${y - 12 * s} L${x} ${y - 30 * s} L${x + 8 * s} ${y - 12 * s} L${x + 16 * s} ${y - 28 * s} Q${x + 18 * s} ${y + 4 * s} ${x} ${y + 4 * s} Q${x - 18 * s} ${y + 4 * s} ${x - 16 * s} ${y - 28 * s} Z`);
/** A field of small flowers, tulips and grass along the bottom. */
export function meadow(y = 700, seed = 1) {
  let o = '', r = seed * 9301;
  const rnd = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  for (let i = 0; i < 9; i++) {
    const x = 30 + i * 75 + rnd() * 30, yy = y + rnd() * 50;
    const k = i % 3;
    o += k === 0 ? flower(x, yy, 0.7, 50) : k === 1 ? tulip(x, yy, 0.8) : grass(x - 10, yy + 40, 3);
  }
  return o;
}
/** Polka dots / hearts scattered inside an area (they become extra parts to color). */
export function scatter(points, kind = 'dot', size = 7) {
  return points.map(([x, y]) => (kind === 'heart' ? heart(x, y - size, size / 22) : kind === 'star' ? star(x, y, size, 2) : circle(x, y, size, 2))).join('');
}
/** Brick lines over a wall. */
export function bricks(x, y, w, h, bw = 34, bh = 18) {
  let d = '';
  for (let r = 1; r * bh < h; r++) d += `M${x} ${y + r * bh} L${x + w} ${y + r * bh} `;
  for (let r = 0; r * bh < h; r++) for (let c = (r % 2) * bw / 2; c < w; c += bw) if (c > 0) d += `M${x + c} ${y + r * bh} L${x + c} ${y + Math.min((r + 1) * bh, h)} `;
  return line(d, 1.6);
}
