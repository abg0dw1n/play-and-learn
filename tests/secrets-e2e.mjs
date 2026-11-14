// Browser check of My World secrets, magic, egg and hats. Needs Playwright and the site on :8091:  python3 -m http.server 8091 & node tests/secrets-e2e.mjs <screenshot-dir>
import { chromium } from 'playwright';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 430, height: 900 } });
const page = await ctx.newPage(); const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
let bad = 0; const ok = (c, m) => { if (!c) bad++; console.log(c ? '  ok -' : '  FAIL -', m); };
await page.clock.setFixedTime(new Date('2026-11-14T12:00:00'));
await page.goto('http://127.0.0.1:8091/');
await page.evaluate(() => localStorage.setItem('playlearn:v1', JSON.stringify({ stars: 9, stickers: ['🐶','🐱','🐰','🐢','🐸','🦁','🐼','🐉'], eggN: 4, character: 'fox' })));
await page.reload(); await page.evaluate(() => { location.hash = '#/stickers'; }); await page.waitForSelector('.scene'); await page.waitForTimeout(600);
ok(await page.$('.egg.ready'), 'egg is ready and wobbling');
ok((await page.$$('.magic-btn:not(.locked)')).length === 1, 'dragon sticker unlocked one magic');
await page.click('.magic-btn:not(.locked)'); await page.waitForTimeout(300);
ok(await page.$('.fx-fly'), 'dragon flies across');
const sunFree = await page.evaluate(() => { const r = document.querySelector('.scene-sun').getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2).classList.contains('scene-sun'); });
ok(sunFree, 'nothing covers the sun');
for (let i = 0; i < 3; i++) { await page.click('.scene-sun', { force: true }); await page.waitForTimeout(100); }
await page.waitForSelector('.secret-overlay'); await page.screenshot({ path: process.argv[2] + '/secret.png' });
ok(/SECRET FOUND/.test(await page.textContent('.secret-overlay')), 'sun secret celebrated');
await page.click('.secret-card .big-btn'); await page.waitForSelector('.wear-btn');
ok(await page.$('.wear-btn[data-hat="shades"]'), 'sunglasses in the wardrobe');
await page.click('.wear-btn[data-hat="shades"]');
ok(await page.$eval('.world-pip', (g) => g.dataset.hat === '🕶️'), 'Pip wears sunglasses');
for (let i = 0; i < 3; i++) { await page.click('.egg', { force: true }); await page.waitForTimeout(150); }
await page.waitForSelector('.secret-overlay'); ok(/HATCHED/.test(await page.textContent('.secret-overlay')), 'egg hatches');
await page.screenshot({ path: process.argv[2] + '/hatch.png' });
await page.click('.secret-card .big-btn'); await page.waitForTimeout(300);
ok(/First hatch/.test(await page.textContent('.secret-overlay')), 'first hatch secret follows');
await page.click('.secret-card .big-btn'); await page.waitForTimeout(500);
const hatched = await page.evaluate(() => JSON.parse(localStorage.getItem('playlearn:v1')).hatched);
ok(hatched.length === 1 && await page.$(`.scene-item[data-emoji="${hatched[0]}"]`), 'creature lives in the world');
ok(await page.$('.scene-item[data-emoji="🪺"]'), 'nest treasure placed');
await page.evaluate(() => document.querySelector('.scene').scrollIntoView({ block: 'center' })); await page.waitForTimeout(300);
const spot = await page.evaluate(() => { const r = document.querySelector('.scene-hill.front').getBoundingClientRect(); for (let y = r.bottom - 10; y > r.top; y -= 12) for (let x = r.left + 10; x < r.right; x += 12) { const e = document.elementFromPoint(x, y); if (e?.classList.contains('scene-hill')) return { x, y }; } return null; });
ok(spot, 'free grass to dig in');
for (let i = 0; i < 5; i++) { await page.mouse.click(spot.x, spot.y); await page.waitForTimeout(80); }
await page.waitForSelector('.secret-overlay'); ok(/Buried/.test(await page.textContent('.secret-overlay')), 'dig secret');
await page.click('.secret-card .big-btn'); await page.waitForTimeout(400);
await page.screenshot({ path: process.argv[2] + '/world2.png', fullPage: true });
// home page Pip wears the hat too
await page.evaluate(() => { location.hash = '#/'; }); await page.waitForTimeout(500);
ok(await page.$('.guide[data-hat]'), 'hat shows on home Pip');
await page.screenshot({ path: process.argv[2] + '/home-hat.png' });
console.log('errors:', errs);
await b.close(); process.exit(bad || errs.length ? 1 : 0);
