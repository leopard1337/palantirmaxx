'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  loadTrackedWallets,
  saveTrackedWallets,
  WALLETS_EVENT,
} from '@/lib/watchlist-store';

export function useTrackedWallets() {
  const [wallets, setWallets] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(() => {
    setWallets(loadTrackedWallets());
  }, []);

  useEffect(() => {
    reload();
    setLoaded(true);
  }, [reload]);

  useEffect(() => {
    const handler = () => reload();
    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'quantis-tracked-wallets') reload();
    };
    window.addEventListener(WALLETS_EVENT, handler);
    window.addEventListener('storage', storageHandler);
    return () => {
      window.removeEventListener(WALLETS_EVENT, handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, [reload]);

  const addWallet = useCallback((addr: string) => {
    const trimmed = addr.trim();
    if (!trimmed || trimmed.length < 32) return;
    const next = loadTrackedWallets();
    if (next.includes(trimmed)) return;
    saveTrackedWallets([...next, trimmed]);
    setWallets(loadTrackedWallets());
  }, []);

  const removeWallet = useCallback((addr: string) => {
    const next = loadTrackedWallets().filter((w) => w !== addr);
    saveTrackedWallets(next);
    setWallets(next);
  }, []);

  return { wallets, addWallet, removeWallet, loaded, reload };
}
