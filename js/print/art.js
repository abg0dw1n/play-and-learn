// Pictures drawn from simple shapes on a 100 x 100 canvas, turned into detailed color-by-number /
// color-by-word grids (every square has a color, background too).
// Shapes, painted in order (later ones on top):
//   ['rect', color, x, y, w, h]   ['circle', color, cx, cy, r]   ['ellipse', color, cx, cy, rx, ry]   ['poly', color, [x,y, x,y, ...]]

export const ART = [
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', bg: 'light blue', shapes: [
    ['circle', 'red', 50, 78, 46], ['circle', 'orange', 50, 78, 39], ['circle', 'yellow', 50, 78, 32], ['circle', 'green', 50, 78, 25],
    ['circle', 'purple', 50, 78, 18], ['circle', 'light blue', 50, 78, 11],
    ['ellipse', 'green', 20, 100, 40, 22], ['ellipse', 'green', 82, 102, 36, 20],
    ['circle', 'yellow', 88, 12, 9]] },
  { id: 'house', name: 'House', emoji: '🏠', bg: 'light blue', shapes: [
    ['rect', 'green', 0, 80, 100, 20], ['circle', 'yellow', 14, 14, 9],
    ['rect', 'tan', 22, 46, 56, 38], ['poly', 'red', [16, 48, 50, 18, 84, 48]], ['rect', 'brown', 64, 22, 8, 16],
    ['rect', 'brown', 43, 60, 14, 24], ['rect', 'blue', 28, 54, 11, 11], ['rect', 'blue', 61, 54, 11, 11],
    ['circle', 'pink', 12, 82, 5], ['circle', 'purple', 88, 82, 5]] },
  { id: 'fish', name: 'Fish', emoji: '🐠', bg: 'blue', shapes: [
    ['rect', 'tan', 0, 86, 100, 14], ['rect', 'green', 8, 54, 5, 34], ['rect', 'green', 86, 60, 5, 28],
    ['poly', 'orange', [70, 46, 92, 28, 92, 64]], ['ellipse', 'orange', 48, 46, 28, 18], ['poly', 'yellow', [40, 30, 52, 18, 60, 31]],
    ['circle', 'black', 30, 42, 4], ['rect', 'yellow', 44, 30, 6, 32], ['circle', 'light blue', 20, 16, 4], ['circle', 'light blue', 26, 8, 3]] },
  { id: 'flower', name: 'Flowers', emoji: '🌷', bg: 'light blue', shapes: [
    ['rect', 'green', 0, 78, 100, 22], ['rect', 'green', 32, 40, 6, 42], ['rect', 'green', 70, 50, 6, 32],
    ['circle', 'pink', 35, 22, 9], ['circle', 'pink', 22, 32, 9], ['circle', 'pink', 48, 32, 9], ['circle', 'pink', 27, 46, 9], ['circle', 'pink', 43, 46, 9],
    ['circle', 'yellow', 35, 35, 7], ['circle', 'purple', 73, 40, 12], ['circle', 'orange', 73, 40, 5], ['circle', 'yellow', 88, 10, 7]] },
  { id: 'tree', name: 'Apple tree', emoji: '🌳', bg: 'light blue', shapes: [
    ['rect', 'green', 0, 82, 100, 18], ['rect', 'brown', 42, 50, 16, 34],
    ['circle', 'green', 50, 32, 26], ['circle', 'green', 30, 44, 16], ['circle', 'green', 70, 44, 16],
    ['circle', 'red', 38, 26, 5], ['circle', 'red', 62, 30, 5], ['circle', 'red', 46, 46, 5], ['circle', 'red', 70, 48, 5], ['circle', 'red', 26, 46, 5],
    ['circle', 'yellow', 90, 10, 7]] },
  { id: 'boat', name: 'Sailboat', emoji: '⛵', bg: 'light blue', shapes: [
    ['rect', 'blue', 0, 70, 100, 30], ['poly', 'red', [22, 68, 78, 68, 68, 80, 32, 80]], ['rect', 'brown', 48, 18, 4, 50],
    ['poly', 'yellow', [52, 20, 52, 64, 80, 64]], ['poly', 'orange', [48, 26, 48, 64, 24, 64]], ['circle', 'yellow', 14, 14, 8]] },
  { id: 'ladybug', name: 'Ladybug', emoji: '🐞', bg: 'green', shapes: [
    ['circle', 'black', 50, 26, 13], ['circle', 'red', 50, 58, 32], ['rect', 'black', 48, 28, 4, 62],
    ['circle', 'black', 36, 48, 6], ['circle', 'black', 64, 48, 6], ['circle', 'black', 34, 68, 6], ['circle', 'black', 66, 68, 6],
    ['circle', 'yellow', 45, 22, 3], ['circle', 'yellow', 55, 22, 3]] },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', bg: 'purple', shapes: [
    ['poly', 'orange', [40, 78, 60, 78, 50, 98]], ['rect', 'grey', 38, 30, 24, 50], ['poly', 'red', [38, 30, 62, 30, 50, 6]],
    ['poly', 'red', [38, 60, 26, 80, 38, 80]], ['poly', 'red', [62, 60, 74, 80, 62, 80]], ['circle', 'blue', 50, 46, 7],
    ['circle', 'yellow', 14, 16, 4], ['circle', 'yellow', 86, 26, 4], ['circle', 'yellow', 18, 62, 3], ['circle', 'yellow', 84, 72, 4], ['circle', 'yellow', 80, 8, 3]] },
  { id: 'cat', name: 'Kitty', emoji: '🐱', bg: 'green', shapes: [
    ['ellipse', 'orange', 50, 86, 30, 20], ['poly', 'orange', [22, 40, 24, 8, 44, 26]], ['poly', 'orange', [78, 40, 76, 8, 56, 26]],
    ['poly', 'pink', [27, 32, 28, 16, 39, 26]], ['poly', 'pink', [73, 32, 72, 16, 61, 26]], ['circle', 'orange', 50, 46, 28],
    ['circle', 'black', 39, 42, 5], ['circle', 'black', 61, 42, 5], ['poly', 'pink', [45, 54, 55, 54, 50, 60]]] },
  { id: 'cupcake', name: 'Cupcake', emoji: '🧁', bg: 'yellow', shapes: [
    ['poly', 'purple', [24, 54, 76, 54, 68, 92, 32, 92]], ['ellipse', 'pink', 50, 48, 30, 16], ['ellipse', 'pink', 50, 34, 22, 14],
    ['ellipse', 'pink', 50, 22, 13, 9], ['circle', 'red', 50, 10, 6], ['rect', 'blue', 36, 40, 4, 4], ['rect', 'green', 58, 30, 4, 4], ['rect', 'orange', 44, 52, 4, 4]] },
];
export const artById = (id) => ART.find((a) => a.id === id);

const inside = (s, x, y) => {
  const [type, , ...p] = s;
  if (type === 'rect') return x >= p[0] && x < p[0] + p[2] && y >= p[1] && y < p[1] + p[3];
  if (type === 'circle') return (x - p[0]) ** 2 + (y - p[1]) ** 2 <= p[2] ** 2;
  if (type === 'ellipse') return ((x - p[0]) / p[2]) ** 2 + ((y - p[1]) / p[3]) ** 2 <= 1;
  const pts = p[0]; let hit = false; // polygon: ray casting
  for (let i = 0, j = pts.length - 2; i < pts.length; j = i, i += 2) {
    const [xi, yi, xj, yj] = [pts[i], pts[i + 1], pts[j], pts[j + 1]];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};

/** The picture as an n x n grid: { grid: ['1123..'], palette: { '1': 'light blue', ... } } with every square colored. */
export function rasterize(art, n) {
  const codeOf = {}; const palette = {};
  const code = (color) => { if (!codeOf[color]) { const c = String(Object.keys(codeOf).length + 1); codeOf[color] = c; palette[c] = color; } return codeOf[color]; };
  code(art.bg);
  const grid = [];
  for (let r = 0; r < n; r++) {
    let row = '';
    for (let c = 0; c < n; c++) {
      const x = ((c + 0.5) * 100) / n, y = ((r + 0.5) * 100) / n;
      let color = art.bg;
      for (const s of art.shapes) if (inside(s, x, y)) color = s[1];
      row += code(color);
    }
    grid.push(row);
  }
  return { name: art.name.toLowerCase(), grid, palette };
}
