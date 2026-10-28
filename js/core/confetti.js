// Lightweight confetti burst on a full-screen canvas.

const COLORS = ['#ff6b6b', '#ffd93d', '#6bcB77', '#4d96ff', '#c77dff', '#ff9f43'];
const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let pieces = [];
let running = false;

function canvas() {
  const c = document.getElementById('confetti');
  const dpr = window.devicePixelRatio || 1;
  if (c.width !== innerWidth * dpr) {
    c.width = innerWidth * dpr;
    c.height = innerHeight * dpr;
  }
  const g = c.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  return g;
}

/** Burst from a point (defaults to screen center). */
export function burst({ x = innerWidth / 2, y = innerHeight / 2, count = 60, spread = 1 } = {}) {
  if (reduce) return;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = (4 + Math.random() * 8) * spread;
    pieces.push({
      x, y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s - 6,
      w: 8 + Math.random() * 8,
      h: 5 + Math.random() * 6,
      r: Math.random() * 6,
      vr: (Math.random() - 0.5) * 0.4,
      c: COLORS[i % COLORS.length],
      life: 90 + Math.random() * 40,
    });
  }
  if (!running) { running = true; requestAnimationFrame(tick); }
}

export function burstAt(node, count = 40) {
  const r = node.getBoundingClientRect();
  burst({ x: r.left + r.width / 2, y: r.top + r.height / 2, count, spread: 0.7 });
}

function tick() {
  const g = canvas();
  g.clearRect(0, 0, innerWidth, innerHeight);
  pieces = pieces.filter((p) => p.life > 0 && p.y < innerHeight + 40);
  for (const p of pieces) {
    p.vy += 0.35;
    p.vx *= 0.99;
    p.x += p.vx;
    p.y += p.vy;
    p.r += p.vr;
    p.life--;
    g.save();
    g.translate(p.x, p.y);
    g.rotate(p.r);
    g.fillStyle = p.c;
    g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    g.restore();
  }
  if (pieces.length) requestAnimationFrame(tick);
  else { running = false; g.clearRect(0, 0, innerWidth, innerHeight); }
}
