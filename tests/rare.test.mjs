// Run: node tests/rare.test.mjs   (rules for rare and legendary stickers)
import { RARE, unlocked, recordFinish, readStats } from '../js/core/rare.js';
import { store } from '../js/core/store.js';

let problems = 0;
const ok = (c, m) => { if (!c) { problems++; console.log('  FAIL -', m); } else console.log('  ok -', m); };
const worlds = [{ id: 'reading', games: ['spell', 'read'] }, { id: 'math', games: ['addsub'] }, { id: 'fun', games: ['tictactoe', 'memory', 'pop'] }];
const games = ['spell', 'read', 'addsub', 'tictactoe', 'memory', 'pop'].map((id) => ({ id, maxLevels: [1, 3, 3] }));
const commons = ['a', 'b', 'c'];
const stats = (o = {}) => ({ days: [], perfect: {}, perfectSS: {}, ...o });
const ctx = (o = {}) => ({ game: games[0], perfect: false, difficulty: 1, now: new Date('2026-11-04T15:00:00'), stats: stats(), have: new Set(), commons, worlds, games, ...o });
const names = (c) => unlocked(c).map((r) => r.name);

console.log('rare');
ok(names(ctx()).length === 0, 'an ordinary finish unlocks nothing');
ok(names(ctx({ perfect: true })).includes('diamond'), 'no wrong answers on Growing Strong: diamond');
ok(!names(ctx({ perfect: true, difficulty: 0 })).includes('diamond'), '...but not on First Steps');
ok(names(ctx({ difficulty: 2 })).includes('superhero'), 'finishing on Super Star: superhero');
ok(names(ctx({ now: new Date('2026-11-04T07:30:00') })).includes('early bird'), 'before 8am: early bird');
ok(!names(ctx({ now: new Date('2026-11-04T08:00:00') })).includes('early bird'), '8am is not early');
ok(names(ctx({ stats: stats({ days: ['2026-11-01', '2026-11-02', '2026-11-04'] }) })).includes('flame'), '3 days: flame');
ok(names(ctx({ stats: stats({ days: ['2026-11-07', '2026-11-08'] }) })).includes('circus tent'), 'Saturday + Sunday: circus tent');
ok(!names(ctx({ stats: stats({ days: ['2026-11-04', '2026-11-05'] }) })).includes('circus tent'), 'two weekdays: no circus tent');
ok(names(ctx({ stats: stats({ perfect: { spell: 1, read: 1, addsub: 1 } }) })).includes('gold medal'), 'perfect in 3 games: gold medal');
ok(names(ctx({ stats: stats({ perfect: { spell: 5 } }) })).length === 0, 'perfect in the SAME game many times: nothing (not just repetition)');
ok(names(ctx({ have: new Set(['🥇']), stats: stats({ perfect: { spell: 1, addsub: 1, memory: 1 } }) })).includes('wise owl'), 'perfect in every world: wise owl');
ok(names(ctx({ game: games[4], perfect: true })).includes('brain'), 'Memory with almost no misses: brain');
ok(names(ctx({ game: games[5], perfect: true })).includes('bullseye'), 'every balloon: bullseye');
ok(!names(ctx({ game: games[5], perfect: true, difficulty: 0 })).includes('bullseye'), '...not on First Steps');
ok(names(ctx({ game: games[3], perfect: true, difficulty: 2 })).includes('trophy'), 'win Tic-Tac-Toe on Super Star: trophy');
ok(!names(ctx({ game: games[3], perfect: true, difficulty: 1 })).includes('trophy'), '...not on Growing Strong');
store.set({ games: { spell: { plays: 1 }, read: { plays: 2 } } });
ok(names(ctx()).includes('puzzle piece'), 'played every game in Reading World: puzzle piece');
store.set({ games: { spell: { plays: 9 } } });
ok(!names(ctx()).includes('puzzle piece'), 'playing one game a lot is not enough');
store.set({ games: { spell: { plays: 1, levels: { 1: 3 } } } });
ok(names(ctx()).includes('graduation cap'), 'top level of a game: graduation cap');
store.set({ games: {} });

console.log('legendary');
const twelve = RARE.filter((r) => r.rarity === 'rare').map((r) => r.emoji);
let got = unlocked(ctx({ perfect: true, have: new Set(twelve.filter((e) => e !== '💎')) })).map((r) => r.name);
ok(got.includes('diamond') && got.includes('dragon'), 'the last rare one unlocks the dragon in the same finish');
ok(!names(ctx({ have: new Set(twelve.slice(1)) })).includes('dragon'), 'dragon needs all 12');
ok(names(ctx({ have: new Set(['🔥', '🎪']), stats: stats({ days: Array.from({ length: 7 }, (_, i) => `2026-11-0${i + 1}`) }) })).includes('shooting star'), '7 days: shooting star');
ok(names(ctx({ have: new Set(['🥇', '🦉']), stats: stats({ perfect: Object.fromEntries(games.map((g) => [g.id, 1])) }) })).includes('planet'), 'perfect in 6 games: planet');
ok(names(ctx({ stats: stats({ perfectSS: { spell: 1, read: 1, addsub: 1 } }) })).includes('genie'), 'Super Star perfect in 3 games: genie');
const everythingElse = new Set([...commons, ...RARE.filter((r) => r.emoji !== '🦚').map((r) => r.emoji)]);
ok(names(ctx({ have: everythingElse })).includes('peacock'), 'everything else found: peacock');
ok(!names(ctx({ have: new Set([...everythingElse].slice(1)) })).includes('peacock'), 'peacock needs every one');
ok(new Set(RARE.map((r) => r.emoji)).size === RARE.length && RARE.length === 17, '17 distinct stickers (12 rare, 5 legendary)');
ok(RARE.filter((r) => r.rarity === 'legendary').length === 5, '5 legendary');

console.log('no pile-ups');
store.set({ games: { spell: { plays: 1, levels: { 1: 3 } }, read: { plays: 1 } } }); // old play already satisfies puzzle piece + graduation cap
const backlog = { stats: stats({ days: ['2026-11-01', '2026-11-02', '2026-11-04'], perfect: { spell: 1, read: 1, addsub: 1 } }) };
let first = names(ctx(backlog));
ok(first.length === 1, `old progress pays out one sticker per finish, not all at once (${first.join(', ')})`);
let have = new Set(); let rounds = 0; const order = [];
for (; rounds < 10; rounds++) { const w = unlocked(ctx({ ...backlog, have })); if (!w.length) break; w.forEach((r) => { have.add(r.emoji); order.push(r.name); }); ok(w.length === 1, `finish ${rounds + 1} gives exactly one`); }
ok(['puzzle piece', 'graduation cap', 'flame', 'gold medal'].every((n) => order.includes(n)), 'every earned sticker still arrives eventually: ' + order.join(', '));
got = names(ctx({ perfect: true, difficulty: 2, ...backlog }));
ok(got.includes('diamond') && got.includes('superhero'), 'stickers decided by this very game are all given now, even when one from the backlog comes too (' + got.join(', ') + ')');
store.set({ games: {} });

console.log('bookkeeping');
store.set({ stats: undefined });
recordFinish({ game: { id: 'spell' }, perfect: true, difficulty: 2, now: new Date('2026-11-04T10:00:00') });
recordFinish({ game: { id: 'spell' }, perfect: true, difficulty: 0, now: new Date('2026-11-04T11:00:00') });
const st = readStats();
ok(st.days.length === 1 && st.perfect.spell === 1 && st.perfectSS.spell === 1, 'a day counts once; First Steps perfects are not recorded; Super Star counts for both');
store.set({ stats: { days: ['junk', 5, '2026-11-04'], perfect: [] } });
ok(readStats().days.length === 1 && Object.keys(readStats().perfect).length === 0, 'damaged saved stats are repaired');

console.log(problems ? `\n${problems} PROBLEM(S)` : '\nALL RARE STICKER CHECKS PASSED');
process.exit(problems ? 1 : 0);
