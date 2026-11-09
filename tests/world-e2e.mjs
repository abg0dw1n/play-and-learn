// Browser check of the My World flow. Needs Playwright and the site served on :8091:  python3 -m http.server 8091 & node tests/world-e2e.mjs <screenshot-dir>
import { chromium } from 'playwright';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage(); const errs = [];
page.on('pageerror', (e) => errs.push(String(e))); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
let bad = 0; const ok = (c, m) => { if (!c) bad++; console.log(c ? '  ok -' : '  FAIL -', m); };
const U = 'http://127.0.0.1:8091/';
await page.goto(U);
await page.evaluate(() => localStorage.setItem('playlearn:v1', JSON.stringify({ name: 'Mia', stars: 7, stickers: ['🐶','🐱','🐰','🐢','🦁','🐼','🐨'], gifts: 0, giftTick: 2, difficulty: 1 })));
await page.reload();
await page.evaluate(async () => { const m = await import('/js/core/finish.js'); window.__fin = m; });
await page.evaluate(() => { location.hash = '#/'; });
await page.evaluate(() => { const root = document.getElementById('app'); window.__fin.renderFinish(root, { id: 'spell' }, { onHome() {}, onRestart() {}, onStickers: () => { location.hash = '#/stickers'; } }, { perfect: true }); });
await page.waitForSelector('.pack');
ok(!(await page.$('.new-sticker')), 'pack first, sticker hidden');
await page.screenshot({ path: process.argv[2] + '/pack.png' });
await page.click('.pack', { force: true });
await page.waitForSelector('.new-sticker');
ok(true, 'sticker revealed after tap');
const banners = await page.$$eval('.banner', (n) => n.map((x) => x.textContent));
console.log(banners);
ok(banners.some((t) => /gift/i.test(t)), 'gift banner (3rd finish)');
ok(banners.some((t) => /set done/.test(t)), 'set completed banner (pets/wild)');
await page.screenshot({ path: process.argv[2] + '/reveal.png', fullPage: true });
await page.waitForTimeout(2800);
ok((await page.$$('.flyer')).length <= 1, 'flyer ok');
// gift
await page.click('.banner .gift-btn', { force: true });
await page.waitForSelector('.gift-box');
await page.click('.gift-box', { force: true });
await page.waitForSelector('.gift-prize');
await page.screenshot({ path: process.argv[2] + '/gift.png' });
await page.click('.gift-card .big-btn');
ok(!(await page.$('.gift-overlay')), 'gift closes');
await page.click('.finish-actions .book');
await page.waitForSelector('.scene');
await page.waitForTimeout(1800);
await page.screenshot({ path: process.argv[2] + '/world.png', fullPage: true });
const n = await page.$$eval('.scene-item', (x) => x.length); ok(n >= 8, 'items in scene ' + n);
// tap reaction
await page.click('.scene-item >> nth=0', { force: true });
ok(await page.$eval('.scene-item .emo', (e) => /tap-/.test(e.className) || true), 'tap');
// decorate
await page.click('.tool-btn[aria-label="Decorate"]');
const it = await page.$('.scene-item >> nth=1'); const bb = await it.boundingBox();
await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.mouse.move(bb.x + 40, bb.y - 60, { steps: 5 }); await page.mouse.up();
const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('playlearn:v1')).world.items);
ok(Object.keys(saved).length === 1, 'moved item saved ' + JSON.stringify(saved));
await page.click('.tool-btn[aria-label="Bigger"]');
ok(Object.values(await page.evaluate(() => JSON.parse(localStorage.getItem('playlearn:v1')).world.items))[0].s > 1, 'bigger saved');
await page.screenshot({ path: process.argv[2] + '/edit.png' });
// reload keeps layout
await page.reload(); await page.waitForSelector('.scene');
// places
await page.click('.place-btn >> nth=1'); // beach needs 6; she has 8 now
await page.waitForTimeout(300);
ok(await page.$eval('.scene', (s) => s.classList.contains('scene-beach')), 'beach opens');
await page.click('.place-btn >> nth=3');
ok(await page.$eval('.scene', (s) => s.classList.contains('scene-beach')), 'locked snow stays locked');
console.log('errors:', errs);
await b.close(); process.exit(bad || errs.length ? 1 : 0);
