'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchCoinInfo } from '@/lib/api/helius';
import { useWatchlistCoins } from '@/hooks/useWatchlistCoins';

function formatPrice(val: number): string {
  if (val >= 1) return `$${val.toFixed(2)}`;
  if (val >= 0.01) return `$${val.toFixed(4)}`;
  return `$${val.toExponential(2)}`;
}

function CoinMiniCard({ mint }: { mint: string }) {
  const { data: asset, isLoading } = useQuery({
    queryKey: ['coin-info', mint],
    queryFn: () => fetchCoinInfo(mint),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return <div className="h-10 animate-pulse rounded-lg bg-white/[0.03]" />;
  }

  if (!asset) return null;

  const symbol = asset.content?.metadata?.symbol ?? '???';
  const name = asset.content?.metadata?.name ?? 'Unknown';
  const price = asset.token_info?.price_info?.price_per_token;
  const image = asset.content?.links?.image ?? asset.content?.files?.[0]?.uri;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2">
      {image ? (
        <img src={image} alt="" className="h-5 w-5 rounded-md shrink-0" />
      ) : (
        <div className="h-5 w-5 rounded-md bg-white/[0.06] flex items-center justify-center text-[8px] font-bold text-zinc-500 shrink-0">
          {symbol.slice(0, 2)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-semibold text-zinc-200 truncate">{name}</span>
          <span className="text-[9px] text-zinc-500">{symbol}</span>
        </div>
      </div>
      {price != null && (
        <span className="ml-auto text-[10px] font-mono font-semibold text-accent tabular-nums">
          {formatPrice(price)}
        </span>
      )}
    </div>
  );
}

export function CoinWatchlistWidget() {
  const { coins } = useWatchlistCoins();

  if (coins.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <p className="text-[11px] text-zinc-500 mb-1">No coins watched</p>
        <p className="text-[10px] text-zinc-600">Go to Watchlist page to add tokens</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        {coins.map((mint) => (
          <CoinMiniCard key={mint} mint={mint} />
        ))}
      </div>
    </div>
  );
}
