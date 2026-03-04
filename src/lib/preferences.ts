'use client';

const STORAGE_KEY = 'palantir-preferences';

export interface StoredPreferences {
  feedType?: 'all' | 'news' | 'tweet' | 'telegram';
  intelTab?: 'Markets' | 'Economy' | 'Disasters';
  eventsCategory?: string;
  marketsCategory?: string;
}

function load(): StoredPreferences {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as StoredPreferences;
  } catch {
    /* ignore */
  }
  return {};
}

function save(prefs: StoredPreferences) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

export function getPreference<K extends keyof StoredPreferences>(key: K): StoredPreferences[K] | undefined {
  return load()[key];
}

export function setPreference<K extends keyof StoredPreferences>(key: K, value: StoredPreferences[K]) {
  const prefs = load();
  prefs[key] = value;
  save(prefs);
}
