// Progress saved on this device (localStorage). Safe if storage is blocked.

const KEY = 'playlearn:v1';
const defaults = () => ({ name: '', sound: true, stars: 0, games: {} });

// Difficulty modes: 0 = First Steps, 1 = Growing Strong (default), 2 = Super Star
export const DIFFICULTY_NAMES = ['First Steps', 'Growing Strong', 'Super Star'];

function load() {
  try {
    return { ...defaults(), ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return defaults();
  }
}

let state = load();

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode etc. */ }
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
  // Clears stars, stickers and levels; keeps name, sound, difficulty, voice and Sound Check picks.
  reset() {
    const { name, sound, difficulty, voiceName, soundSpellings } = state;
    state = { ...defaults(), name, sound, difficulty, voiceName, soundSpellings };
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
