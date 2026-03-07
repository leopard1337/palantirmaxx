'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTrackedWallet } from '@/lib/api/helius';
import { shortenAddress } from '@/components/AddressLink';
import { formatTimeAgo } from '@/lib/utils';
import { TransactionDrawer } from '@/components/TransactionDrawer';
import { useTrackedWallets } from '@/hooks/useTrackedWallets';

function formatUsd(val: number): string {
  if (val >= 1_000_000) return `$${(val / 1e6).toFixed(2)}M`;
  if (val >= 1_000) return `$${(val / 1e3).toFixed(1)}K`;
  return `$${val.toFixed(2)}`;
}

function formatBalance(val: number): string {
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  if (val >= 1) return val.toFixed(2);
  return val.toPrecision(4);
}

const TX_TYPE_COLORS: Record<string, string> = {
  SWAP: 'text-accent bg-accent/10',
  TRANSFER: 'text-sky-400 bg-sky-400/10',
  NFT_SALE: 'text-purple-400 bg-purple-400/10',
  BURN: 'text-red-400 bg-red-400/10',
  UNKNOWN: 'text-zinc-400 bg-white/[0.04]',
};

function WalletCard({
  address,
  onRemove,
  onAddressClick,
}: {
  address: string;
  onRemove: () => void;
  onAddressClick: (addr: string) => void;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['tracked-wallet', address],
    queryFn: () => fetchTrackedWallet(address),
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
      {/* Wallet header */}
      <div className="flex items-center gap-3 border-b border-white/[0.05] px-4 py-2.5">
        <div className="h-2 w-2 rounded-full bg-accent animate-pulse shrink-0" />
        <button
          type="button"
          onClick={() => onAddressClick(address)}
          className="font-mono text-[12px] font-semibold text-zinc-100 hover:text-accent transition-colors"
        >
          {shortenAddress(address, 6)}
        </button>
        {data && (
          <div className="flex items-center gap-3 ml-2">
            <span className="text-[11px] font-semibold text-accent tabular-nums">
              {formatUsd(data.totalUsdValue)}
            </span>
            <span className="text-[10px] text-zinc-400 tabular-nums">
              {data.solBalance.toFixed(3)} SOL
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={onRemove}
          className="ml-auto rounded p-1 text-zinc-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          title="Remove wallet"
          aria-label="Remove tracked wallet"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {isLoading && (
        <div className="px-4 py-4 space-y-2">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-lg bg-white/[0.03]" />
          ))}
        </div>
      )}

      {error && (
        <div className="px-4 py-4 text-[11px] text-red-400/70 text-center">
          Failed to load wallet data
        </div>
      )}

      {data && (
        <div className="px-4 py-3 space-y-3">
          {/* Top tokens */}
          {data.tokens.length > 0 && (
            <div>
              <h4 className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                Holdings ({data.tokens.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {data.tokens.slice(0, 8).map((t) => (
                  <span
                    key={t.mint}
                    className="inline-flex items-center gap-1.5 rounded-md bg-white/[0.04] border border-white/[0.06] px-2 py-1 text-[10px]"
                  >
                    <span className="font-semibold text-zinc-200">{t.symbol}</span>
                    <span className="text-zinc-400 tabular-nums">{formatBalance(t.balance)}</span>
                    {t.usdValue != null && t.usdValue > 0 && (
                      <span className="text-zinc-500 tabular-nums">{formatUsd(t.usdValue)}</span>
                    )}
                  </span>
                ))}
                {data.tokens.length > 8 && (
                  <span className="inline-flex items-center px-2 py-1 text-[9px] text-zinc-500">
                    +{data.tokens.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Recent activity */}
          {data.recentTxs.length > 0 && (
            <div>
              <h4 className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                Recent Activity
              </h4>
              <div className="space-y-1">
                {data.recentTxs.slice(0, 5).map((tx) => {
                  const typeColor = TX_TYPE_COLORS[tx.type] ?? TX_TYPE_COLORS.UNKNOWN;
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

export default function WalletsPage() {
  const { wallets, addWallet, removeWallet, loaded } = useTrackedWallets();
  const [input, setInput] = useState('');
  const [txDrawerAddress, setTxDrawerAddress] = useState<string | null>(null);

  const handleAdd = () => {
    if (input.trim().length >= 32 && input.trim().length <= 44) {
      addWallet(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="shrink-0 border-b border-white/[0.06] px-6 py-3.5 text-center">
        <h1 className="text-[15px] font-bold text-zinc-100">Wallet Tracker</h1>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Track Solana wallets — holdings, balances, and recent activity
        </p>
      </div>

      {/* Add wallet */}
      <div className="shrink-0 border-b border-white/[0.06] px-6 py-3">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Paste wallet address..."
            className="flex-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-[12px] text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-accent/30 font-mono"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={input.trim().length < 32}
            className="rounded-lg bg-accent/15 px-4 py-2 text-[11px] font-semibold text-accent hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            Track
          </button>
        </div>
        {wallets.length > 0 && (
          <p className="mt-1.5 text-[10px] text-zinc-500 text-center">
            Tracking {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Wallet list */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {!loaded && (
          <div className="space-y-3">
            {Array.from({ length: 2 }, (_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-white/[0.03]" />
            ))}
          </div>
        )}

        {loaded && wallets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06] mb-3">
              <svg className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
              </svg>
            </div>
            <p className="text-[12px] text-zinc-500 mb-0.5">No wallets yet</p>
            <p className="text-[11px] text-zinc-600">Paste an address above to track</p>
          </div>
        )}

        <div className="space-y-3">
          {wallets.map((addr) => (
            <WalletCard
              key={addr}
              address={addr}
              onRemove={() => removeWallet(addr)}
              onAddressClick={setTxDrawerAddress}
            />
          ))}
        </div>
      </div>

      <TransactionDrawer address={txDrawerAddress} onClose={() => setTxDrawerAddress(null)} />
    </div>
  );
}
