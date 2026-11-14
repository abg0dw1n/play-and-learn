// Free coloring pages: the pictures live in soft-pages.js (soft, happy style); this module makes the menu entries.
import { coloringPage } from './draw.js';
import { PAGES } from './soft-pages.js';

export { PAGES };
export const COLORING = PAGES.map((p) => ({ id: `color-${p.id}`, emoji: p.emoji, title: p.title, blurb: 'Color it your way', make: () => ({ title: p.title, svg: coloringPage(p.title, p.draw()), free: true }) }));
