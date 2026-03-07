'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchTrackedWallet } from '@/lib/api/helius';
import { shortenAddress } from '@/components/AddressLink';
import { useTrackedWallets } from '@/hooks/useTrackedWallets';

function formatUsd(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1e6).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1e3).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
}

function WalletMiniCard({ address }: { address: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['tracked-wallet', address],
    queryFn: () => fetchTrackedWallet(address),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return <div className="h-10 animate-pulse rounded-lg bg-white/[0.03]" />;
  }

  if (!data) return null;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
      <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse shrink-0" />
      <span className="font-mono text-[10px] text-zinc-200">{shortenAddress(address, 4)}</span>
      <span className="ml-auto text-[10px] font-semibold text-accent tabular-nums">
        {formatUsd(data.totalUsdValue)}
      </span>
      <span className="text-[9px] text-zinc-500 tabular-nums">{data.solBalance.toFixed(2)} SOL</span>
    </div>
  );
}

export function WalletTrackerWidget() {
  const { wallets } = useTrackedWallets();

  if (wallets.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <p className="text-[11px] text-zinc-500 mb-1">No wallets tracked</p>
        <p className="text-[10px] text-zinc-600">Go to Wallets page to add addresses</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {wallets.map((addr) => (
          <WalletMiniCard key={addr} address={addr} />
        ))}
      </div>
    </div>
  );
}
