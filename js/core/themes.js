// Looks for the whole site: colors, a soft pattern of little pictures behind everything, and a friendly mascot.
// (All original, storybook-style: emoji characters and shapes. No brand characters.)
import { store } from './store.js';

const pattern = (items, tint = 0.5) => {
  // One 260px square with the pictures scattered in it; the page repeats it.
  const spots = [[30, 50, 38], [150, 40, 30], [225, 120, 40], [90, 130, 32], [20, 210, 34], [160, 225, 40], [235, 235, 26], [110, 20, 22]];
  const body = spots.map(([x, y, s], i) => `<text x="${x}" y="${y}" font-size="${s}" transform="rotate(${(i * 37) % 40 - 20} ${x} ${y})">${items[i % items.length]}</text>`).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" opacity="${tint}">${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
};

export const THEMES = [
  { id: 'sunny', name: 'Sunny Sky', emoji: '☀️', mascot: '🌈', color: '#7fd3ff',
    vars: { '--sky-1': '#bfe9ff', '--sky-2': '#fff3d6', '--title': '#ff6b6b', '--title-shadow': '#fff', '--bg-ink': '#2b2d42', '--bg-soft': '#5c6078', '--radius': '28px', '--pattern': 'none' } },
  { id: 'rainbow', name: 'Rainbow Party', emoji: '🦄', mascot: '🦄', color: '#ff6fb5',
    vars: { '--sky-1': '#ffd6ec', '--sky-2': '#d8f3ff', '--title': '#ff3d9a', '--title-shadow': '#fff', '--bg-ink': '#2b2d42', '--bg-soft': '#5c4a7a', '--radius': '34px',
      '--pattern': pattern(['🌈', '⭐', '🎈', '💖', '🎉', '✨', '🦄', '🎀'], 0.45) } },
  { id: 'castle', name: 'Fairytale Castle', emoji: '🏰', mascot: '🧚‍♀️', color: '#b57bff',
    vars: { '--sky-1': '#e6d4ff', '--sky-2': '#ffd6ee', '--title': '#9b4dde', '--title-shadow': '#fff', '--bg-ink': '#3a2a5e', '--bg-soft': '#5e4a8a', '--radius': '40px',
      '--pattern': pattern(['✨', '👑', '🏰', '🌟', '🦋', '💜', '🪄', '✨'], 0.4) } },
  { id: 'sea', name: 'Under the Sea', emoji: '🐠', mascot: '🧜‍♀️', color: '#19a7c9',
    vars: { '--sky-1': '#c9f6ff', '--sky-2': '#6fd3ea', '--title': '#0b7fa5', '--title-shadow': '#e8fcff', '--bg-ink': '#08354a', '--bg-soft': '#145670', '--radius': '30px',
      '--pattern': pattern(['🐠', '🫧', '🐙', '🐚', '🐬', '🦀', '🫧', '🐢'], 0.5) } },
  { id: 'space', name: 'Space Adventure', emoji: '🚀', mascot: '👩‍🚀', color: '#6a5cff',
    vars: { '--sky-1': '#1c1a4f', '--sky-2': '#4a2a85', '--title': '#ffd93d', '--title-shadow': '#2a1a66', '--bg-ink': '#ffffff', '--bg-soft': '#d9d4ff', '--radius': '24px',
      '--pattern': pattern(['⭐', '🪐', '✨', '🚀', '🌙', '🛸', '☄️', '⭐'], 0.55) } },
  { id: 'jungle', name: 'Safari Jungle', emoji: '🦁', mascot: '🦁', color: '#4caf50',
    vars: { '--sky-1': '#e3f9c4', '--sky-2': '#8fd36b', '--title': '#e07b00', '--title-shadow': '#fff7dc', '--bg-ink': '#1f3d1a', '--bg-soft': '#2f5a28', '--radius': '30px',
      '--pattern': pattern(['🌿', '🦒', '🍃', '🐒', '🦜', '🌴', '🐘', '🦓'], 0.45) } },
  { id: 'candy', name: 'Candy Land', emoji: '🍭', mascot: '🧁', color: '#ff7aa8',
    vars: { '--sky-1': '#ffd9ea', '--sky-2': '#c8fbe8', '--title': '#ff4f93', '--title-shadow': '#fff', '--bg-ink': '#4a2740', '--bg-soft': '#74456a', '--radius': '36px',
      '--pattern': pattern(['🍭', '🍬', '🧁', '🍩', '🍓', '🍪', '🍦', '🍒'], 0.5) } },
];

export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
export const currentTheme = () => themeById(store.get().theme);

export function applyTheme(id = store.get().theme) {
  const t = themeById(id);
  const root = document.documentElement;
  for (const [k, v] of Object.entries(t.vars)) root.style.setProperty(k, v);
  root.dataset.theme = t.id;
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', t.vars['--sky-1']);
  return t;
}

export function setTheme(id) { store.set({ theme: themeById(id).id }); return applyTheme(id); }
