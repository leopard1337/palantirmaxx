'use client';

import { useWalletAccess } from '@/context/WalletContext';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';

export function GateGuard({ children }: { children: React.ReactNode }) {
  const { connected, hasAccess, balance, isLoading } = useWalletAccess();

  if (isLoading && connected) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-accent" />
      </div>
    );
  }

  if (hasAccess) return <>{children}</>;

  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-6">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.12] bg-white/[0.04]">
        <svg
          className="h-8 w-8 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
          />
        </svg>
      </div>
      <div className="text-center max-w-sm">
        <h2 className="text-base font-semibold text-zinc-100 mb-1">
          Token-gated access
        </h2>
        <p className="text-[13px] text-zinc-400 leading-relaxed">
          {!connected
            ? 'Connect your wallet and hold ≥100,000 $QUANT tokens to access this section.'
            : `You need at least 100,000 $QUANT tokens. Your balance: ${(balance ?? 0).toLocaleString()}`}
        </p>
      </div>
      <ConnectWalletButton />
    </div>
  );
}
