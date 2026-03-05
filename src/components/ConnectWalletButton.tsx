'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';

export function ConnectWalletButton() {
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const shortAddress = (addr: string) =>
    `${addr.slice(0, 4)}...${addr.slice(-4)}`;

  if (connected && publicKey) {
    return (
      <button
        type="button"
        onClick={() => disconnect()}
        className="flex items-center gap-2 rounded-lg border border-white/[0.12] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-white/[0.08] hover:text-zinc-100 transition-colors"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        {shortAddress(publicKey.toBase58())}
      </button>
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
