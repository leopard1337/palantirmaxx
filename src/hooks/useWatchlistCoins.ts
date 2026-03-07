'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  loadWatchlistCoins,
  saveWatchlistCoins,
  COINS_EVENT,
} from '@/lib/watchlist-store';

export function useWatchlistCoins() {
  const [coins, setCoins] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    setCoins(loadWatchlistCoins());
  }, []);

  useEffect(() => {
    reload();
    setLoaded(true);
  }, [reload]);

  useEffect(() => {
    const handler = () => reload();
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'quantis-watchlist-coins') reload();
    };
    window.addEventListener(COINS_EVENT, handler);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener(COINS_EVENT, handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, [reload]);

  const addCoin = useCallback((mint: string) => {
    const trimmed = mint.trim();
    if (!trimmed || trimmed.length < 32) return;
    const next = loadWatchlistCoins();
    if (next.includes(trimmed)) return;
    saveWatchlistCoins([...next, trimmed]);
    setCoins(loadWatchlistCoins());
  }, []);

  const removeCoin = useCallback((mint: string) => {
    const next = loadWatchlistCoins().filter((c) => c !== mint);
    saveWatchlistCoins(next);
    setCoins(next);
  }, []);

  return { coins, addCoin, removeCoin, loaded, reload };
}
