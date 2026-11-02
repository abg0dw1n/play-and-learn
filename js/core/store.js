// Progress saved on this device (localStorage). Safe if storage is blocked.

const KEY = 'playlearn:v1';
const defaults = () => ({ name: '', sound: true, stars: 0, games: {} });

// Difficulty modes: 0 = First Steps (Beginner), 1 = Growing Strong (Medium), 2 = Super Star (Advanced)
const DIFFICULTY_LABELS = ['First Steps 🐣', 'Growing Strong 🌱', 'Super Star ⭐'];
const DIFFICULTY_KEY = 'difficulty';

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
  game(id) { return state.games[id] || { level: 1, plays: 0 }; },
  setGame(id, patch) {
    state.games = { ...state.games, [id]: { ...store.game(id), ...patch } };
    save();
  },
  addStar(n = 1) { state.stars += n; save(); return state.stars; },
  reset() { state = { ...defaults(), name: state.name }; save(); },

  // Difficulty helpers
  getDifficulty() { return state[DIFFICULTY_KEY] ?? 1; }, // default to Medium (1)
  setDifficulty(d) { state[DIFFICULTY_KEY] = Math.max(0, Math.min(2, d)); save(); },
  getDifficultyLabel(d) { return DIFFICULTY_LABELS[store.getDifficulty()]; },
};
