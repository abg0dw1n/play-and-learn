// Progress saved on this device (localStorage). Safe if storage is blocked.

const KEY = 'playlearn:v1';
// Sound is never remembered: every time the page loads it starts silent, and a grown-up or child turns it on with the bell.
const defaults = () => ({ name: '', sound: false, stars: 0, games: {}, ttsVoice: 'heart', character: 'bunny' });
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
  return s;
}

let state = load();

function save() {
  try { const { sound, ...saved } = state; localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* private mode etc. */ }
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
