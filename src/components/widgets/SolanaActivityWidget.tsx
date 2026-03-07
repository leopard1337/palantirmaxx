'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { fetchSolanaActivity } from '@/lib/api/helius';
import type { SolanaActivityItem } from '@/lib/api/helius-types';
import { AddressLink, shortenAddress } from '@/components/AddressLink';
import { formatTimeAgo } from '@/lib/utils';
import { useHeliusDrawer } from '@/context/HeliusDrawerContext';
import { WhaleAlertFeed } from '@/components/WhaleAlertFeed';

const FILTERS = ['all', 'whale', 'swap'] as const;
const TRACKED_WALLETS_KEY = 'quantis-tracked-wallets';

function isValidSolanaAddress(addr: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim());
}

function formatAmount(item: SolanaActivityItem): string {
  if (item.amountUsd != null && item.amountUsd > 0) {
    if (item.amountUsd >= 1_000_000) return `$${(item.amountUsd / 1e6).toFixed(1)}M`;
    if (item.amountUsd >= 1_000) return `$${(item.amountUsd / 1e3).toFixed(0)}K`;
    return `$${item.amountUsd.toFixed(0)}`;
  }
  if (item.amountSol != null && item.amountSol > 0) {
    if (item.amountSol >= 1_000) return `${(item.amountSol / 1e3).toFixed(1)}K SOL`;
    return `${item.amountSol.toFixed(2)} SOL`;
  }
  return '';
}

const ActivityRow = memo(function ActivityRow({
  item,
  onAddressClick,
}: {
  item: SolanaActivityItem;
  onAddressClick?: (address: string) => void;
}) {
  const isWhale = item.type === 'whale';
  const amountLabel = formatAmount(item);

  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors hover:bg-white/[0.04] ${
      isWhale ? 'border-amber-400/20 bg-amber-400/[0.03]' : 'border-white/[0.06] bg-white/[0.02]'
    }`}>
      <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${isWhale ? 'bg-amber-400 animate-pulse' : 'bg-accent/60'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          {isWhale && (
            <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-400">
              Whale
            </span>
          )}
          <span className="text-[10px] font-medium text-zinc-400 uppercase">{item.source}</span>
          {amountLabel && (
            <span className={`ml-auto text-[10px] font-mono font-semibold tabular-nums ${isWhale ? 'text-amber-400' : 'text-accent/70'}`}>
              {amountLabel}
            </span>
          )}
        </div>
        <p className="text-[11px] text-zinc-200 leading-snug line-clamp-2">{item.description}</p>
        <div className="mt-1 flex items-center gap-2 text-[10px]">
          <AddressLink address={item.from} onClick={onAddressClick} className="text-[10px]" />
          {item.to && (
            <>
              <span className="text-zinc-600">&rarr;</span>
              <AddressLink address={item.to} onClick={onAddressClick} className="text-[10px]" />
            </>
          )}
          <span className="ml-auto text-zinc-500 tabular-nums">{formatTimeAgo(item.timestamp * 1000)}</span>
        </div>
      </div>
    </div>
  );
});

export function SolanaActivityWidget({
  onAddressClick,
}: {
  onAddressClick?: (address: string) => void;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [trackedWallets, setTrackedWallets] = useState<string[]>([]);
  const [addInput, setAddInput] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const { openTransactionDrawer } = useHeliusDrawer();

  const loadWallets = useCallback(() => {
    try {
      const raw = localStorage.getItem(TRACKED_WALLETS_KEY);
      if (raw) setTrackedWallets(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => loadWallets(), [loadWallets]);

  const addWallet = () => {
    const addr = addInput.trim();
    if (!addr || !isValidSolanaAddress(addr)) return;
    const next = [...new Set([...trackedWallets, addr])].slice(0, 10);
    setTrackedWallets(next);
    localStorage.setItem(TRACKED_WALLETS_KEY, JSON.stringify(next));
    setAddInput('');
    setShowAdd(false);
  };

  const removeWallet = (addr: string) => {
    const next = trackedWallets.filter((w) => w !== addr);
    setTrackedWallets(next);
    localStorage.setItem(TRACKED_WALLETS_KEY, JSON.stringify(next));
  };

  const handleAddressClick = (addr: string) => {
    onAddressClick?.(addr);
    openTransactionDrawer(addr);
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['solana-activity', filter, trackedWallets.join(',')],
    queryFn: () => fetchSolanaActivity(filter, 30, trackedWallets.length > 0 ? trackedWallets : undefined),
    refetchInterval: 8_000,
    staleTime: 5_000,
  });

  const items = data?.items ?? [];
  const whaleCount = items.filter((i) => i.type === 'whale').length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex flex-col gap-1.5 px-3 py-2 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] font-semibold text-zinc-200 mr-1">Solana Activity</span>
          {whaleCount > 0 && (
            <span className="rounded-full bg-amber-400/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-400 tabular-nums">
              {whaleCount} whale{whaleCount !== 1 ? 's' : ''}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  filter === f
                    ? f === 'whale' ? 'bg-amber-400/15 text-amber-400' : 'bg-accent/15 text-accent'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]'
                }`}
              >
                {f === 'all' ? 'All' : f === 'whale' ? 'Whales' : 'Swaps'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {trackedWallets.slice(0, 3).map((addr) => (
            <span key={addr} className="inline-flex items-center gap-0.5 rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px]">
              <button type="button" onClick={() => handleAddressClick(addr)} className="font-mono text-accent/80 hover:text-accent truncate max-w-[60px]">
                {shortenAddress(addr, 4)}
              </button>
              <button type="button" onClick={() => removeWallet(addr)} className="text-zinc-500 hover:text-red-400" aria-label="Remove">×</button>
            </span>
          ))}
          {trackedWallets.length > 3 && (
            <Link href="/wallets" className="text-[9px] text-accent/70 hover:text-accent">+{trackedWallets.length - 3} more</Link>
          )}
          {showAdd ? (
            <span className="inline-flex items-center gap-0.5">
              <input
                type="text"
                value={addInput}
                onChange={(e) => setAddInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addWallet()}
                placeholder="Wallet..."
                className="w-20 rounded border border-white/[0.1] bg-white/[0.04] px-1.5 py-0.5 text-[9px] font-mono text-zinc-200 placeholder:text-zinc-500"
              />
              <button type="button" onClick={addWallet} className="rounded bg-accent/15 px-1.5 py-0.5 text-[9px] font-medium text-accent">Add</button>
              <button type="button" onClick={() => { setShowAdd(false); setAddInput(''); }} className="text-zinc-500 hover:text-zinc-300 text-[10px]">×</button>
            </span>
          ) : (
            <button type="button" onClick={() => setShowAdd(true)} className="text-[9px] text-zinc-500 hover:text-accent">+ Track</button>
          )}
          {trackedWallets.length > 0 && (
            <Link href="/wallets" className="text-[9px] text-zinc-500 hover:text-accent">Manage</Link>
          )}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
        <WhaleAlertFeed maxItems={10} />
        {isLoading && Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-[52px] animate-pulse rounded-lg bg-white/[0.03]" />
        ))}
        {error && (
          <div className="px-3 py-4 text-center text-[11px] text-red-400/70">
            Failed to load activity
          </div>
        )}
        {!isLoading && !error && items.length === 0 && (
          <div className="px-3 py-6 text-center">
            <p className="text-[11px] text-zinc-500 mb-1">No activity yet</p>
            <p className="text-[10px] text-zinc-600">
              {filter === 'whale' ? 'No whale transactions detected. Try lowering the filter.' : 'Waiting for new transactions...'}
            </p>
          </div>
        )}
        {items.map((item) => (
          <ActivityRow key={item.id} item={item} onAddressClick={handleAddressClick} />
        ))}
      </div>
    </div>
  );
}
