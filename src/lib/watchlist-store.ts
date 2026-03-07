'use client';

const WALLETS_KEY = 'quantis-tracked-wallets';
const COINS_KEY = 'quantis-watchlist-coins';

const WALLETS_EVENT = 'quantis-tracked-wallets-changed';
const COINS_EVENT = 'quantis-watchlist-coins-changed';

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch { /* ignore */ }
  return fallback;
}

function save<T>(key: string, value: T, eventName: string) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(eventName, { detail: value }));
  } catch { /* ignore */ }
}

export function loadTrackedWallets(): string[] {
  const raw = load<string[]>(WALLETS_KEY, []);
  return Array.isArray(raw) ? raw.filter((s) => typeof s === 'string' && s.length >= 32) : [];
}

export function saveTrackedWallets(wallets: string[]) {
  const deduped = [...new Set(wallets)].slice(0, 20);
  save(WALLETS_KEY, deduped, WALLETS_EVENT);
}

export function loadWatchlistCoins(): string[] {
  const raw = load<string[]>(COINS_KEY, []);
  return Array.isArray(raw) ? raw.filter((s) => typeof s === 'string' && s.length >= 32) : [];
}

export function saveWatchlistCoins(coins: string[]) {
  const deduped = [...new Set(coins)].slice(0, 50);
  save(COINS_KEY, deduped, COINS_EVENT);
}

export { WALLETS_EVENT, COINS_EVENT };
