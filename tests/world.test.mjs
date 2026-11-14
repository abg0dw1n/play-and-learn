// Run: node tests/world.test.mjs   (My World: sets, places, gifts, daily hunt, goal, save repair)
const noop = () => {};
globalThis.window = { addEventListener: noop };
globalThis.speechSynthesis = { getVoices: () => [], addEventListener: noop, cancel: noop };
globalThis.SpeechSynthesisUtterance = function () {};
globalThis.document = { addEventListener: noop, hidden: false };
const mem = {};
globalThis.localStorage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = String(v); }, removeItem: (k) => { delete mem[k]; } };
const { STICKERS } = await import('../js/core/stickers.js');
import { SETS, setsDone, unlockedScenes, DECOR, SCENES } from '../js/world/data.js';
import { afterFinish, rollShiny, chooseGiftPrize, setGoal, goalProgress, GIFT_EVERY } from '../js/world/progress.js';
import { store } from '../js/core/store.js';

let problems = 0;
const ok = (c, m) => { if (!c) { problems++; console.log('  FAIL -', m); } else console.log('  ok -', m); };
const all = STICKERS.map(([e]) => e);
const inSets = SETS.flatMap((s) => s.members);
ok(inSets.length === all.length && all.every((e) => inSets.filter((x) => x === e).length === 1), 'every everyday sticker is in exactly one collection');
ok(SETS.every((s) => s.members.length === 5), 'each collection has 5');
ok(SCENES[0].at === 0 && SCENES.every((s, i) => !i || s.at > SCENES[i - 1].at), 'places unlock in increasing order, first is free');
ok(unlockedScenes(5).length === 1 && unlockedScenes(6).length === 2 && unlockedScenes(30).length === 5, 'place thresholds');
ok(setsDone(SETS[0].members).length === 1 && setsDone(SETS[0].members.slice(1)).length === 0, 'set completes only with all 5');
ok(new Set(DECOR.map((d) => d.emoji)).size === DECOR.length, 'gift decorations are unique');
ok(rollShiny({ perfect: true, difficulty: 1 }, () => 0) && !rollShiny({ perfect: true, difficulty: 0 }, () => 0) && !rollShiny({ perfect: false, difficulty: 2 }, () => 0), 'shiny needs a perfect game on Growing Strong+');

store.reset?.();
const game = { id: 'spell' };
let have = [];
const finish = (g, now) => { const before = have; have = [...have, all[have.length]]; return afterFinish({ game: g, before, after: have, now }); };
const t = new Date('2026-11-04T10:00:00');
let r = finish(game, t);
ok(r.gifts === 0 && r.daily.count === 1, 'first game: no gift yet, hunt 1 of 2');
r = finish({ id: 'read' }, t);
ok(r.daily.justDone && r.gifts === 1, 'second DIFFERENT game: daily gift');
r = finish({ id: 'pop' }, t);
ok(r.gifts === 1 && r.giftFrom[0] === 'games', 'third finish: game gift (daily only once)');
ok(store.get().gifts === 2, 'two gifts saved');
const same = finish(game, new Date('2026-11-05T10:00:00'));
ok(same.daily.count === 1 && !same.daily.justDone, 'a new day starts the hunt over; same game twice does not count double');
ok(GIFT_EVERY === 3, 'gift every 3');

const prize = chooseGiftPrize({ commons: STICKERS, have: [], decor: [], shinies: [] }, () => 0);
ok(prize.kind === 'decor', 'gift gives a decoration first');
ok(chooseGiftPrize({ commons: STICKERS, have: all, decor: DECOR.map((d) => d.emoji), shinies: all }).kind === 'none', 'nothing left: none');

store.set({ stickers: ['🐶'] });
setGoal({ label: 'ice cream', icon: '🍦', need: 3 });
ok(goalProgress().left === 3, 'goal starts counting from now');
store.set({ stickers: ['🐶', '🐱', '🐰'] });
ok(goalProgress().left === 1, 'goal counts new stickers');
store.set({ stickers: ['🐶', '🐱', '🐰', '🐢'] });
r = afterFinish({ game, before: ['🐶', '🐱', '🐰'], after: ['🐶', '🐱', '🐰', '🐢'], now: t });
ok(r.goalReached && store.get().goal.reached, 'goal reached is reported once');

store.reset();
ok(store.get().world && store.get().world.items && Array.isArray(store.get().decor) && store.get().gifts === 0, 'reset leaves a usable empty world');

// ---- secrets, magic, egg ----
const sec = await import('../js/world/secrets.js');
store.reset();
ok(sec.hatsOwned().map((h) => h.id).join() === 'bow', 'Pip starts with just the bow');
ok(sec.findSecret('sun')[0].id === 'sun' && sec.findSecret('sun').length === 0, 'a secret is found once');
ok(sec.hatsOwned().some((h) => h.id === 'shades'), 'sun secret gives sunglasses');
ok(sec.powersOwned([]).length === 0 && sec.powersOwned(['🐉']).some((p) => p.id === 'dragon'), 'legendary dragon sticker unlocks dragon magic');
let last;
for (const x of sec.SECRETS) if (x.id !== 'all') last = sec.findSecret(x.id);
ok(last.some((x) => x.id === 'all') && sec.hatsOwned().some((h) => h.id === 'crown'), 'finding every secret gives the crown');
ok(new Set(sec.SECRETS.map((x) => x.icon)).size === sec.SECRETS.length, 'secret icons are distinct');
const used = new Set([...STICKERS.map(([e]) => e), ...DECOR.map((d) => d.emoji), ...SETS.map((x) => x.bonus.emoji)]);
ok(sec.allCreatures().every((c) => !used.has(c.emoji)) && sec.TREASURES.every((t) => !used.has(t.emoji)), 'egg creatures and treasures are new things, not stickers');
store.reset();
ok(!sec.eggState().ready && sec.hatchEgg() === null, 'egg not ready at first');
for (let i = 0; i < sec.EGG_NEEDS - 1; i++) ok(sec.warmEgg() === false, `warm ${i + 1}`);
ok(sec.warmEgg() === true && sec.eggState().ready, 'egg ready after enough games');
ok(sec.warmEgg() === false, 'a ready egg waits to be hatched');
const c1 = sec.hatchEgg(() => 0);
ok(c1 && !c1.golden && store.get().hatched.length === 1 && sec.eggState().n === 0, 'hatches a creature and starts a new egg');
for (let i = 0; i < 2; i++) { for (let k = 0; k < sec.EGG_NEEDS; k++) sec.warmEgg(); sec.hatchEgg(); }
ok(sec.eggState().golden, 'every 4th egg is golden');
for (let k = 0; k < sec.EGG_NEEDS; k++) sec.warmEgg();
ok(sec.isLegendaryCreature(sec.hatchEgg().emoji), 'golden egg holds a legendary creature');
let guard = 0;
while (!sec.eggState().done && guard++ < 100) { for (let k = 0; k < sec.EGG_NEEDS; k++) sec.warmEgg(); sec.hatchEgg(); }
ok(sec.eggState().done && new Set(store.get().hatched).size === sec.allCreatures().length, 'eventually every creature hatches, no repeats');
ok(sec.SECRETS.every((x) => sec.rewardLine(x).length > 5) && sec.rewardLine(sec.secretById('sun')) === 'Pip got a pair of sunglasses!', 'reward lines read well');

console.log(problems ? `\n${problems} problem(s)` : '\nall good');
process.exit(problems ? 1 : 0);
