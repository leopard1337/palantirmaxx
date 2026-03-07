'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { TransactionDrawer } from '@/components/TransactionDrawer';
import { WalletProfileDrawer } from '@/components/WalletProfileDrawer';

interface HeliusDrawerContextValue {
  openTransactionDrawer: (address: string) => void;
  openWalletProfile: () => void;
}

const HeliusDrawerContext = createContext<HeliusDrawerContextValue>({
  openTransactionDrawer: () => {},
  openWalletProfile: () => {},
});

export function useHeliusDrawer() {
  return useContext(HeliusDrawerContext);
}

export function HeliusDrawerProvider({ children }: { children: ReactNode }) {
  const [txAddress, setTxAddress] = useState<string | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);

  const openTransactionDrawer = useCallback((address: string) => {
    setProfileOpen(false);
    setTxAddress(address);
  }, []);

  const openWalletProfile = useCallback(() => {
    setTxAddress(null);
    setProfileOpen(true);
  }, []);

  return (
    <HeliusDrawerContext.Provider value={{ openTransactionDrawer, openWalletProfile }}>
      {children}
      <TransactionDrawer address={txAddress} onClose={() => setTxAddress(null)} />
      <WalletProfileDrawer open={profileOpen} onClose={() => setProfileOpen(false)} />
    </HeliusDrawerContext.Provider>
  );
}
