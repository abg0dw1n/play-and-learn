// Progress saved on this device (localStorage). Safe if storage is blocked.

const KEY = 'playlearn:v1';
// Sound is never remembered: every time the page loads it starts silent, and a grown-up or child turns it on with the bell.
const defaults = () => ({ name: '', sound: false, stars: 0, games: {}, ttsVoice: 'heart', character: 'bunny',
  shinies: [], decor: [], gifts: 0, giftTick: 0, world: { scene: 'meadow', items: {} },
  secrets: [], hatched: [], eggN: 0, giftsOpened: 0, visited: [], hat: null });
const CHARACTER_IDS = ['bunny', 'fox', 'panda', 'dino', 'owl'];

// Difficulty modes: 0 = First Steps, 1 = Growing Strong (default), 2 = Super Star
export const DIFFICULTY_NAMES = ['First Steps', 'Growing Strong', 'Super Star'];

// Read saved progress, repairing anything missing or damaged so the app always starts.
function load() {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* damaged or blocked */ }
  if (!saved || typeof saved !== 'object' || Array.isArray(saved)) saved = {};
  const s = { ...defaults(), ...saved };
  if (!s.games || typeof s.games !== 'object' || Array.isArray(s.games)) s.games = {};
  if (!Number.isFinite(s.stars) || s.stars < 0) s.stars = 0;
  if (typeof s.name !== 'string') s.name = '';
  if (s.ttsVoice !== 'heart' && s.ttsVoice !== 'bella') s.ttsVoice = 'heart';
  if (!CHARACTER_IDS.includes(s.character)) s.character = 'bunny';
  const hexOk = (v, n) => typeof v === 'string' && new RegExp(`^[0-9a-f]{${n}}$`).test(v);
  if (!hexOk(s.pinHash, 64) || !hexOk(s.pinSalt, 32)) { delete s.pinHash; delete s.pinSalt; }
  s.locked = s.locked === true && !!s.pinHash; // locked only counts when there is a PIN to unlock it
  if (!Number.isFinite(s.pinFails) || s.pinFails < 0) s.pinFails = 0;
  if (!Number.isFinite(s.pinWaitUntil)) s.pinWaitUntil = 0;
  s.sound = false; // ignore anything saved by older versions
  if (![0, 1, 2].includes(s.difficulty)) delete s.difficulty;
  if (s.stickers != null && !Array.isArray(s.stickers)) delete s.stickers;
  // My World extras: all repaired to something safe so a damaged save can never break the screen.
  const emojiList = (v, max) => (Array.isArray(v) ? [...new Set(v.filter((e) => typeof e === 'string' && e.length > 0 && e.length <= 12))].slice(0, max) : []);
  s.shinies = emojiList(s.shinies, 100);
  s.decor = emojiList(s.decor, 100);
  const count = (v, max) => (Number.isInteger(v) && v >= 0 ? Math.min(v, max) : 0);
  s.gifts = count(s.gifts, 99);
  s.hatched = emojiList(s.hatched, 50);
  s.eggN = count(s.eggN, 10);
  s.giftsOpened = count(s.giftsOpened, 9999);
  const idList = (v) => (Array.isArray(v) ? [...new Set(v.filter((x) => typeof x === 'string' && /^[a-z]{1,20}$/.test(x)))].slice(0, 50) : []);
  s.secrets = idList(s.secrets);
  s.visited = idList(s.visited);
  s.hat = typeof s.hat === 'string' && /^[a-z]{1,20}$/.test(s.hat) ? s.hat : null;
  s.giftTick = count(s.giftTick, 9);
  const w = s.world && typeof s.world === 'object' && !Array.isArray(s.world) ? s.world : {};
  const items = {};
  if (w.items && typeof w.items === 'object' && !Array.isArray(w.items)) {
    for (const [k, v] of Object.entries(w.items).slice(0, 200)) {
      if (!v || typeof v !== 'object' || k.length > 12) continue;
      const num = (n, lo, hi) => (Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : undefined);
      items[k] = { x: num(v.x, 0, 100), y: num(v.y, 0, 100), s: num(v.s, 0.5, 2.5), f: v.f === true, away: v.away === true };
    }
  }
  s.world = { scene: typeof w.scene === 'string' ? w.scene.slice(0, 20) : 'meadow', items };
  const d = s.daily;
  s.daily = d && typeof d === 'object' && /^\d{4}-\d\d-\d\d$/.test(d.day) ? { day: d.day, games: Array.isArray(d.games) ? d.games.filter((g) => typeof g === 'string').slice(0, 20) : [], claimed: d.claimed === true } : undefined;
  const g = s.goal;
  s.goal = g && typeof g === 'object' && Number.isInteger(g.need) && g.need > 0 && g.need <= 200 && Number.isInteger(g.base) && g.base >= 0
    ? { label: String(g.label || '').slice(0, 40), icon: typeof g.icon === 'string' ? g.icon.slice(0, 8) : '🎁', need: g.need, base: g.base, reached: g.reached === true }
    : undefined;
  return s;
}

let state = load();

function save() {
  try { const saved = { ...state }; delete saved.sound; localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* private mode etc. */ }
}

export const store = {
  get: () => state,
  set(patch) { state = { ...state, ...patch }; save(); },
  game(id) { return state.games[id] || { plays: 0 }; },
  setGame(id, patch) {
    state.games = { ...state.games, [id]: { ...store.game(id), ...patch } };
    save();
  },
  addStar(n = 1) { state.stars += n; save(); return state.stars; },
  // Clears stars, stickers and levels; keeps name, look, sound, difficulty, voice, character, play lock/PIN and Sound Check picks.
  reset() {
    const { name, sound, difficulty, voiceName, soundSpellings, theme, ttsVoice, character, locked, pinSalt, pinHash } = state;
    state = { ...defaults(), name, sound, difficulty, voiceName, soundSpellings, theme, ttsVoice, character, locked, pinSalt, pinHash };
    save();
  },

  // Difficulty
  getDifficulty() { return state.difficulty ?? 1; },
  setDifficulty(d) { state.difficulty = Math.max(0, Math.min(2, d)); save(); },

  // Each difficulty keeps its own level per game.
  // (Older saves had a single `level`, which was Growing Strong.)
  level(id, d) {
    const g = state.games[id] || {};
    return g.levels?.[d] ?? (d === 1 ? g.level : undefined) ?? 1;
  },
  setLevel(id, d, level) {
    store.setGame(id, { levels: { ...(store.game(id).levels || {}), [d]: level } });
  },
};

/** Highest level a game goes to on a given difficulty. */
export function levelCap(game, d) {
  return game.maxLevels?.[d] ?? game.maxLevel ?? 1;
}
