'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';

const GATED_ROUTES = ['/markets', '/movers', '/events'];
const GATED_WIDGETS = ['markets', 'movers', 'events'] as const;
const REQUIRED_BALANCE = 10_000;

export type WalletContextValue = {
  connected: boolean;
  hasAccess: boolean;
  balance: number | null;
  isLoading: boolean;
  refetchBalance: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function useWalletAccess() {
  const ctx = useContext(WalletContext);
  return (
    ctx ?? {
      connected: false,
      hasAccess: false,
      balance: null,
      isLoading: false,
      refetchBalance: async () => {},
    }
  );
}

export function isRouteGated(path: string): boolean {
  return GATED_ROUTES.some((r) => path === r || path.startsWith(r + '/'));
}

export function isWidgetGated(type: string): boolean {
  return (GATED_WIDGETS as readonly string[]).includes(type);
}

export function WalletProviderInner({ children }: { children: ReactNode }) {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchBalance = useCallback(async () => {
    if (!publicKey?.toBase58()) {
      setBalance(null);
      return;
    }
    setIsLoading(true);
    try {
      const url = `/api/wallet/token-balance?wallet=${encodeURIComponent(publicKey.toBase58())}`;
      const res = await fetch(url);
      const data = await res.json();
      setBalance(data?.balance ?? 0);
    } catch {
      setBalance(0);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (!connected || !publicKey) {
      setBalance(null);
      return;
    }
    fetchBalance();
  }, [connected, publicKey, fetchBalance]);

  const hasAccess = connected && balance !== null && balance >= REQUIRED_BALANCE;

  const value: WalletContextValue = {
    connected: !!connected,
    hasAccess,
    balance: balance ?? 0,
    isLoading,
    refetchBalance: fetchBalance,
  };

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}
