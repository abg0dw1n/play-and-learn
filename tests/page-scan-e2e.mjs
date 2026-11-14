// Run with the site on :8091 and Playwright:  node tests/page-scan-e2e.mjs <screenshot-dir>
// Visit every page/state; report any visible "null", "undefined", "false", "true", "NaN", "[object" text; screenshot each.
import { chromium } from 'playwright';
const OUT = process.argv[2]; const U = 'http://127.0.0.1:8091/';
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
const page = await ctx.newPage(); const errs = [];
page.on('pageerror', (e) => errs.push(String(e)));
await page.clock.setFixedTime(new Date('2026-11-14T12:00:00'));
const findings = [];
async function scan(label) {
  await page.waitForTimeout(700);
  const hits = await page.evaluate(() => {
    const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n; (n = w.nextNode());) { const t = n.textContent.trim(); if (/(^|\W)(null|undefined|false|true|NaN)(\W|$)|\[object/.test(t)) out.push(`${n.parentElement?.className || n.parentElement?.tagName}: "${t.slice(0, 80)}"`); }
    for (const e of document.querySelectorAll('[aria-label]')) { const a = e.getAttribute('aria-label'); if (/\b(null|undefined|NaN)\b|\[object/.test(a)) out.push(`aria ${e.className}: "${a}"`); }
    return out;
  });
  if (hits.length) findings.push([label, hits]);
  await page.screenshot({ path: `${OUT}/${label.replace(/[^a-z0-9]+/gi, '_')}.png`, fullPage: true });
}
const setState = async (st) => { await page.goto(U); await page.evaluate((s) => localStorage.setItem('playlearn:v1', JSON.stringify(s)), st); };
const go = async (h) => { await page.evaluate((x) => { location.hash = '#/x-reset'; location.hash = x; }, h); };
const rich = { name: 'Mia', stars: 30, stickers: ['🐶','🐱','🐰','🐢','🐸','🦁','🐼','🐨','🦒','🐘','🌈','⭐','🌙','💎','🐉'], gifts: 2, eggN: 2, secrets: ['sun','dig'], hat: 'shades', hatched: ['🐣'], decor: ['🌳','🏡'], shinies: ['🐶'], character: 'fox',
  goal: { label: 'ice cream', icon: '🍦', need: 20, base: 5, reached: false }, daily: { day: '2026-11-14', games: ['spell'], claimed: false } };

for (const [name, st] of [['empty', {}], ['rich', rich]]) {
  await setState(st); await page.reload();
  await go('#/'); await scan(`${name}-home`);
  for (const w of ['reading', 'math', 'fun']) { await go(`#/world/${w}`); await scan(`${name}-world-${w}`); }
  await go('#/stickers'); await scan(`${name}-myworld`);
  await go('#/print'); await scan(`${name}-print`);
  await go('#/worksheets'); await scan(`${name}-worksheets`);
  await go('#/sound-check'); await scan(`${name}-soundcheck`);
}
// games (rich state)
await setState(rich); await page.reload();
for (const g of ['spell','read','sight','story','sounds','addsub','compare','weight','tictactoe','memory','pop']) {
  await go(`#/play/${g}`); await page.waitForTimeout(400);
  const start = await page.$('.start-btn, .go-btn, button.big-btn'); if (start) { await start.click({ force: true }).catch(() => {}); }
  await scan(`game-${g}`);
}
// finish screen + overlays
await go('#/');
await page.evaluate(async () => { const m = await import('/js/core/finish.js'); m.renderFinish(document.getElementById('app'), { id: 'read' }, { onHome() {}, onRestart() {}, onStickers() {} }, { perfect: true }); });
await page.waitForTimeout(800); await scan('finish-pack');
const pack = await page.$('.pack'); if (pack) { await pack.click({ force: true }); } await scan('finish-reveal');
await go('#/stickers'); await page.waitForTimeout(500);
await page.click('.gift-btn', { force: true }).catch(() => {}); await scan('gift-overlay');
await page.click('.gift-box', { force: true }).catch(() => {}); await page.waitForTimeout(1200); await scan('gift-prize');
await go('#/'); await page.evaluate(async () => { const m = await import('/js/world/celebrate.js'); const s = await import('/js/world/secrets.js'); m.celebrateSecrets([s.secretById('moon')]); });
await scan('secret-overlay');
// print sheets
await go('#/print'); await page.waitForTimeout(400);
const tiles = await page.$$('.tile'); 
for (let i = 0; i < tiles.length; i++) { await go('#/print'); await page.waitForTimeout(300); const t = (await page.$$('.tile'))[i]; await t.click(); await scan(`print-sheet-${i}`); }
// grown-ups
await go('#/'); await page.evaluate(async () => { const m = await import('/js/ui/grownups.js'); m.openGrownUps({ go: () => {}, done: () => {} }); });
await scan('grownups');
// locked My World
await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('playlearn:v1')); s.locked = true; s.pinHash = 'a'.repeat(64); s.pinSalt = 'b'.repeat(32); localStorage.setItem('playlearn:v1', JSON.stringify(s)); });
await page.reload(); await go('#/stickers'); await scan('locked-myworld');
await go('#/'); await scan('locked-home');
console.log(JSON.stringify(findings, null, 1));
console.log('errors:', errs.filter((e) => !/TUNNEL/.test(e)));
await b.close();
