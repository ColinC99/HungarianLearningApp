// Progress is stored on the phone (localStorage). Use Settings → Backup to export a copy.

const KEY = 'szokincs:v1';

export const DEFAULTS = {
  answerMode: 'flip', // 'flip' | 'type'
  intensity: 'challenging', // 'relaxed' | 'challenging' | 'brutal'
  mix: 'balanced', // 'words' | 'balanced' | 'grammar'
  directions: 'both', // 'both' | 'hu2en' | 'en2hu'
  goal: 50,
  speech: 'tap', // 'off' | 'tap' | 'auto'
  theme: 'system', // 'system' | 'light' | 'dark'
};

export function freshState() {
  return { v: 1, created: Date.now(), cards: {}, log: [], days: {}, settings: { ...DEFAULTS } };
}

/** Validate + fill in a loaded or imported state. Throws if it isn't one of ours. */
export function normalizeState(s) {
  if (!s || typeof s !== 'object' || !s.cards || typeof s.cards !== 'object') {
    throw new Error('This file is not a Szókincs backup.');
  }
  return {
    v: 1,
    created: Number(s.created) || Date.now(),
    cards: s.cards,
    log: Array.isArray(s.log) ? s.log.slice(-400) : [],
    days: s.days && typeof s.days === 'object' ? s.days : {},
    settings: { ...DEFAULTS, ...(s.settings || {}) },
  };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalizeState(JSON.parse(raw));
  } catch (e) {
    console.warn('Could not load saved progress', e);
  }
  return freshState();
}

export function saveState(state) {
  try {
    if (state.log.length > 400) state.log = state.log.slice(-400);
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    console.warn('Could not save progress', e);
    return false;
  }
}

/** Ask the browser not to evict our data (installed apps usually get this automatically). */
export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) return await navigator.storage.persist();
  } catch (e) {
    /* ignore */
  }
  return false;
}

export function backupBlob(state) {
  return new Blob([JSON.stringify({ app: 'szokincs', exported: new Date().toISOString(), ...state })], {
    type: 'application/json',
  });
}
