'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useHeliusDrawer } from '@/context/HeliusDrawerContext';

export function ConnectWalletButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const { openWalletProfile } = useHeliusDrawer();

  const shortAddress = (addr: string) =>
    `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={openWalletProfile}
          className="flex items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-zinc-100 transition-colors"
          title="View wallet profile"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {shortAddress(publicKey.toBase58())}
        </button>
        <button
          type="button"
          onClick={() => disconnect()}
          className="rounded p-1 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors"
          title="Disconnect wallet"
          aria-label="Disconnect wallet"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setVisible(true)}
      className="rounded-lg bg-accent px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-accent/90 transition-colors"
    >
      Connect Wallet
    </button>
  );
}
