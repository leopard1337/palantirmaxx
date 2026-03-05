'use client';

import { useMemo, type ReactNode } from 'react';
import { ConnectionProvider, WalletProvider as AdapterWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import '@solana/wallet-adapter-react-ui/styles.css';

import { WalletProviderInner } from '@/context/WalletContext';

export function SolanaWalletProvider({ children }: { children: ReactNode }) {
  const endpoint = useMemo(
    () =>
      process.env.NEXT_PUBLIC_HELIUS_RPC ??
      'https://mainnet.helius-rpc.com/?api-key=3d53f1e2-28b8-4261-85b1-ba0d45765b19',
    []
  );

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new BackpackWalletAdapter()],
    []
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <AdapterWalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <WalletProviderInner>{children}</WalletProviderInner>
        </WalletModalProvider>
      </AdapterWalletProvider>
    </ConnectionProvider>
  );
}
