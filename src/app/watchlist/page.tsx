'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchCoinInfo, fetchCoinHolders, fetchCoinActivity } from '@/lib/api/helius';
import { shortenAddress } from '@/components/AddressLink';
import { formatTimeAgo } from '@/lib/utils';
import { TransactionDrawer } from '@/components/TransactionDrawer';
import { useWatchlistCoins } from '@/hooks/useWatchlistCoins';

function formatNumber(val: number): string {
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return val.toFixed(0);
}

function formatPrice(val: number): string {
  if (val >= 1) return `$${val.toFixed(2)}`;
  if (val >= 0.01) return `$${val.toFixed(4)}`;
  return `$${val.toExponential(2)}`;
}

const TX_TYPE_COLORS: Record<string, string> = {
  SWAP: 'text-accent bg-accent/10',
  TRANSFER: 'text-sky-400 bg-sky-400/10',
  BURN: 'text-red-400 bg-red-400/10',
};

function CoinCard({
  mint,
  onRemove,
  onAddressClick,
}: {
  mint: string;
  onRemove: () => void;
  onAddressClick: (addr: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const { data: asset, isLoading } = useQuery({
    queryKey: ['coin-info', mint],
    queryFn: () => fetchCoinInfo(mint),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const { data: holdersData } = useQuery({
    queryKey: ['coin-holders', mint],
    queryFn: () => fetchCoinHolders(mint),
    staleTime: 60_000,
    enabled: expanded,
  });

  const { data: activity = [] } = useQuery({
    queryKey: ['coin-activity', mint],
    queryFn: () => fetchCoinActivity(mint, 10),
    staleTime: 15_000,
    enabled: expanded,
  });

  const name = asset?.content?.metadata?.name ?? 'Unknown';
  const symbol = asset?.content?.metadata?.symbol ?? '???';
  const image = asset?.content?.links?.image ?? asset?.content?.files?.[0]?.uri;
  const supply = asset?.token_info?.supply;
  const decimals = asset?.token_info?.decimals ?? 6;
  const price = asset?.token_info?.price_info?.price_per_token;
  const holders = holdersData?.holders ?? [];
  const holderTotal = holdersData?.total ?? 0;

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden transition-all">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {image && (
          <img src={image} alt="" className="h-8 w-8 rounded-lg ring-1 ring-white/[0.08] shrink-0" />
        )}
        {!image && (
          <div className="h-8 w-8 rounded-lg bg-white/[0.06] ring-1 ring-white/[0.06] flex items-center justify-center text-[10px] font-bold text-zinc-500 shrink-0">
            {symbol.slice(0, 2)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold text-zinc-100">{name}</span>
            <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold text-accent">{symbol}</span>
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-[10px]">
            {price != null && (
              <span className="font-mono font-semibold text-accent tabular-nums">
                {formatPrice(price)}
              </span>
            )}
            {supply != null && (
              <span className="text-zinc-500">
                Supply: <span className="text-zinc-400 tabular-nums">{formatNumber(supply / 10 ** decimals)}</span>
              </span>
            )}
            {holderTotal > 0 && (
              <span className="text-zinc-500">
                Holders: <span className="text-zinc-400 tabular-nums">{formatNumber(holderTotal)}</span>
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={`https://pump.fun/coin/${mint}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded px-2 py-1 text-[9px] font-semibold text-accent bg-accent/10 border border-accent/15 hover:bg-accent/20 transition-colors"
          >
            Chart
          </a>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="rounded p-1 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            title="Remove from watchlist"
            aria-label="Remove coin"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <svg
            className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {isLoading && (
        <div className="px-4 py-3">
          <div className="h-8 animate-pulse rounded-lg bg-white/[0.03]" />
        </div>
      )}

      {/* Expanded details */}
      {expanded && asset && (
        <div className="border-t border-white/[0.06] px-4 py-3 space-y-3">
          {/* Token address */}
          <div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Mint Address</span>
            <p className="mt-0.5 font-mono text-[10px] text-zinc-300 break-all">{mint}</p>
          </div>

          {/* Top holders */}
          {holders.length > 0 && (
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                Top Holders
              </span>
              <div className="mt-1.5 space-y-1">
                {holders.slice(0, 5).map((h, i) => (
                  <div
                    key={h.owner}
                    className="flex items-center gap-2 rounded-lg bg-white/[0.02] border border-white/[0.04] px-2.5 py-1.5"
                  >
                    <span className="text-[9px] text-zinc-500 tabular-nums w-4 text-right">#{i + 1}</span>
                    <button
                      type="button"
                      onClick={() => onAddressClick(h.owner)}
                      className="font-mono text-[10px] text-accent/80 hover:text-accent transition-colors"
                    >
                      {shortenAddress(h.owner, 5)}
                    </button>
                    <span className="ml-auto font-mono text-[10px] text-zinc-300 tabular-nums">
                      {formatNumber(h.amount / 10 ** decimals)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent activity */}
          {activity.length > 0 && (
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                Recent Activity
              </span>
              <div className="mt-1.5 space-y-1">
                {activity.slice(0, 5).map((tx) => {
                  const typeColor = TX_TYPE_COLORS[tx.type] ?? 'text-zinc-400 bg-white/[0.04]';
                  return (
                    <a
                      key={tx.signature}
                      href={`https://solscan.io/tx/${tx.signature}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.01] px-2.5 py-1.5 transition-colors hover:bg-white/[0.04]"
                    >
                      <span className={`rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${typeColor}`}>
                        {tx.type}
                      </span>
                      <p className="flex-1 text-[10px] text-zinc-300 truncate min-w-0">
                        {tx.description || `${tx.type} via ${tx.source}`}
                      </p>
                      <span className="text-[9px] text-zinc-500 tabular-nums shrink-0">
                        {formatTimeAgo(tx.timestamp * 1000)}
                      </span>
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WatchlistPage() {
  const { coins, addCoin, removeCoin, loaded } = useWatchlistCoins();
  const [input, setInput] = useState('');
  const [txDrawerAddress, setTxDrawerAddress] = useState<string | null>(null);

  const handleAdd = () => {
    if (input.trim().length >= 32 && input.trim().length <= 44) {
      addCoin(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.06] px-6 py-3.5 text-center">
        <h1 className="text-[15px] font-bold text-zinc-100">Coin Watchlist</h1>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Track tokens — price, supply, holders, and activity
        </p>
      </div>

      {/* Add coin */}
      <div className="shrink-0 border-b border-white/[0.06] px-6 py-3">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Paste token mint address..."
            className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[12px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-accent/30 font-mono"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={input.trim().length < 32}
            className="rounded-lg bg-accent/15 px-4 py-2 text-[11px] font-semibold text-accent hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            Watch
          </button>
        </div>
        {coins.length > 0 && (
          <p className="mt-1.5 text-[10px] text-zinc-500 text-center">
            Watching {coins.length} token{coins.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Coin list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {!loaded && (
          <div className="space-y-3">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        )}

        {loaded && coins.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] mb-3">
              <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </svg>
            </div>
            <p className="text-[12px] text-zinc-500 mb-0.5">No tokens yet</p>
            <p className="text-[11px] text-zinc-600">Paste a mint address above to watch</p>
          </div>
        )}

        <div className="space-y-3">
          {coins.map((mint) => (
            <CoinCard
              key={mint}
              mint={mint}
              onRemove={() => removeCoin(mint)}
              onAddressClick={setTxDrawerAddress}
            />
          ))}
        </div>
      </div>

      <TransactionDrawer address={txDrawerAddress} onClose={() => setTxDrawerAddress(null)} />
    </div>
  );
}
