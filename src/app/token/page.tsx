'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTokenInfo, fetchTokenHolders, fetchTokenActivity } from '@/lib/api/helius';
import { shortenAddress } from '@/components/AddressLink';
import { TransactionDrawer } from '@/components/TransactionDrawer';
import { formatTimeAgo, formatUsd, formatTokenAmount } from '@/lib/utils';

const TABS = ['overview', 'holders', 'activity'] as const;
const QUANT_DECIMALS = 6;

const TX_TYPE_COLORS: Record<string, string> = {
  SWAP: 'text-accent bg-accent/10',
  TRANSFER: 'text-sky-400 bg-sky-400/10',
  NFT_SALE: 'text-purple-400 bg-purple-400/10',
  BURN: 'text-red-400 bg-red-400/10',
};

function HoldersTab({ onAddressClick }: { onAddressClick: (addr: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['quant-holders'],
    queryFn: () => fetchTokenHolders(),
    staleTime: 30_000,
  });

  const holders = data?.holders ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
          Top Holders
        </h3>
        <span className="text-[10px] text-zinc-400 tabular-nums">
          {total.toLocaleString()} total accounts
        </span>
      </div>
      {isLoading && Array.from({ length: 10 }, (_, i) => (
        <div key={i} className="h-9 animate-pulse rounded-lg bg-white/[0.03]" />
      ))}
      <div className="space-y-1">
        {holders.map((h, i) => {
          const displayAmount = formatTokenAmount(h.amount, QUANT_DECIMALS);
          const pct = holders[0] ? ((h.amount / holders[0].amount) * 100) : 0;
          return (
            <div
              key={h.owner}
              className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 group hover:bg-white/[0.04] transition-colors"
            >
              <span className="text-[10px] text-zinc-500 tabular-nums w-5 text-right shrink-0">
                #{i + 1}
              </span>
              <button
                type="button"
                onClick={() => onAddressClick(h.owner)}
                className="font-mono text-[11px] text-accent/80 hover:text-accent hover:underline transition-colors"
              >
                {shortenAddress(h.owner, 6)}
              </button>
              <div className="ml-auto flex items-center gap-2">
                <span className="font-mono text-[11px] text-zinc-300 tabular-nums">
                  {displayAmount}
                </span>
                {i > 0 && (
                  <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-accent/40"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActivityTab({ onAddressClick }: { onAddressClick: (addr: string) => void }) {
  const { data: txs = [], isLoading } = useQuery({
    queryKey: ['quant-activity'],
    queryFn: () => fetchTokenActivity(undefined, 30),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  return (
    <div className="space-y-3">
      <h3 className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500">
        Recent Token Activity
      </h3>
      {isLoading && Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-lg bg-white/[0.03]" />
      ))}
      <div className="space-y-1">
        {txs.map((tx) => {
          const typeColor = TX_TYPE_COLORS[tx.type] ?? 'text-zinc-400 bg-white/[0.04]';
          return (
            <a
              key={tx.signature}
              href={`https://solscan.io/tx/${tx.signature}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-colors hover:bg-white/[0.05]"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${typeColor}`}>
                  {tx.type}
                </span>
                <span className="text-[9px] text-zinc-500 uppercase">{tx.source}</span>
                <button
                  type="button"
                  className="ml-1 font-mono text-[9px] text-accent/60 hover:text-accent"
                  onClick={(e) => { e.preventDefault(); onAddressClick(tx.feePayer); }}
                >
                  {shortenAddress(tx.feePayer)}
                </button>
                <span className="ml-auto text-[9px] text-zinc-500 tabular-nums">
                  {formatTimeAgo(tx.timestamp * 1000)}
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2">
                {tx.description || `${tx.type} via ${tx.source}`}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
}

export default function TokenPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('overview');
  const [txDrawerAddress, setTxDrawerAddress] = useState<string | null>(null);

  const { data: asset, isLoading } = useQuery({
    queryKey: ['quant-token-info'],
    queryFn: () => fetchTokenInfo(),
    staleTime: 60_000,
  });

  const { data: holdersData } = useQuery({
    queryKey: ['quant-holders-count'],
    queryFn: () => fetchTokenHolders(),
    staleTime: 30_000,
  });

  const name = asset?.content?.metadata?.name ?? '$QUANT';
  const symbol = asset?.content?.metadata?.symbol ?? 'QUANT';
  const description = asset?.content?.metadata?.description;
  const image = asset?.content?.links?.image ?? asset?.content?.files?.[0]?.uri;
  const supply = asset?.token_info?.supply;
  const decimals = asset?.token_info?.decimals ?? QUANT_DECIMALS;
  const price = asset?.token_info?.price_info?.price_per_token;
  const holderCount = holdersData?.total ?? 0;
  const mcap = price != null && supply != null ? price * (supply / 10 ** decimals) : null;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-white/[0.06] px-5 py-4">
        <div className="flex items-center gap-4">
          {image && (
            <img src={image} alt="" className="h-12 w-12 rounded-xl ring-1 ring-white/[0.08]" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-bold text-zinc-100">{name}</h1>
              <span className="rounded bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent">
                {symbol}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-[11px] flex-wrap">
              {price != null && (
                <span className="font-mono font-semibold text-accent tabular-nums">
                  ${price < 0.01 ? price.toExponential(2) : price.toFixed(4)}
                </span>
              )}
              {mcap != null && (
                <span className="text-zinc-400">
                  MCap: <span className="text-zinc-300 tabular-nums">{formatUsd(mcap)}</span>
                </span>
              )}
              {supply != null && (
                <span className="text-zinc-400">
                  Supply: <span className="text-zinc-300 tabular-nums">
                    {formatTokenAmount(supply, decimals)}
                  </span>
                </span>
              )}
              {holderCount > 0 && (
                <span className="text-zinc-400">
                  Holders: <span className="text-zinc-300 tabular-nums">
                    {holderCount.toLocaleString()}
                  </span>
                </span>
              )}
            </div>
          </div>
          <a
            href="https://pump.fun/coin/3pMnJYtaLD1WP5mVjVAw7ExxWywMtvmh1uhHqribpump"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto shrink-0 rounded-lg bg-accent/10 border border-accent/15 px-4 py-2 text-[12px] font-semibold text-accent transition-all hover:bg-accent/20"
          >
            Buy on Pump.fun
          </a>
        </div>
        {description && (
          <p className="mt-3 text-[12px] text-zinc-400 leading-relaxed max-w-2xl">
            {description}
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-5 py-2 border-b border-white/[0.06] shrink-0">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-md px-3 py-1.5 text-[11px] font-medium transition-colors ${
              tab === t
                ? 'bg-accent/15 text-accent'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
            }`}
          >
            {t === 'overview' ? 'Overview' : t === 'holders' ? 'Holders' : 'Activity'}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isLoading && tab === 'overview' && (
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-lg bg-white/[0.03]" />
            ))}
          </div>
        )}

        {tab === 'overview' && !isLoading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-4xl">
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Token Address</span>
              <p className="mt-1 text-[11px] font-mono text-zinc-300 break-all">
                3pMnJYtaLD1WP5mVjVAw7ExxWywMtvmh1uhHqribpump
              </p>
            </div>
            {price != null && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Price</span>
                <p className="mt-1 text-[18px] font-bold text-accent tabular-nums">
                  ${price < 0.01 ? price.toExponential(2) : price.toFixed(6)}
                </p>
              </div>
            )}
            {mcap != null && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Market Cap</span>
                <p className="mt-1 text-[16px] font-bold text-zinc-200 tabular-nums">
                  {formatUsd(mcap)}
                </p>
              </div>
            )}
            {supply != null && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Total Supply</span>
                <p className="mt-1 text-[16px] font-bold text-zinc-200 tabular-nums">
                  {formatTokenAmount(supply, decimals)}
                </p>
              </div>
            )}
            {holderCount > 0 && (
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Holders</span>
                <p className="mt-1 text-[16px] font-bold text-zinc-200 tabular-nums">
                  {holderCount.toLocaleString()}
                </p>
              </div>
            )}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Decimals</span>
              <p className="mt-1 text-[16px] font-bold text-zinc-200 tabular-nums">
                {decimals}
              </p>
            </div>
          </div>
        )}

        {tab === 'holders' && <HoldersTab onAddressClick={setTxDrawerAddress} />}
        {tab === 'activity' && <ActivityTab onAddressClick={setTxDrawerAddress} />}
      </div>

      <TransactionDrawer address={txDrawerAddress} onClose={() => setTxDrawerAddress(null)} />
    </div>
  );
}
