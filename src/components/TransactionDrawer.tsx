'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import FocusTrap from 'focus-trap-react';
import { fetchWalletTransactions, fetchWalletProfile } from '@/lib/api/helius';
import { formatTimeAgo } from '@/lib/utils';
import { shortenAddress } from '@/components/AddressLink';

const TX_TYPE_COLORS: Record<string, string> = {
  SWAP: 'text-accent bg-accent/10',
  TRANSFER: 'text-sky-400 bg-sky-400/10',
  NFT_SALE: 'text-purple-400 bg-purple-400/10',
  NFT_LISTING: 'text-purple-300 bg-purple-300/10',
  BURN: 'text-red-400 bg-red-400/10',
};

export function TransactionDrawer({
  address,
  onClose,
}: {
  address: string | null;
  onClose: () => void;
}) {
  if (!address) return null;

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['wallet-profile', address],
    queryFn: () => fetchWalletProfile(address),
    staleTime: 60_000,
    enabled: !!address,
  });

  const { data: txs = [], isLoading: txLoading } = useQuery({
    queryKey: ['wallet-txs', address],
    queryFn: () => fetchWalletTransactions(address, 30),
    staleTime: 15_000,
    enabled: !!address,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const identity = profile?.identity;
  const funding = profile?.funding;
  const balances = profile?.balances;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] animate-backdrop-fade"
        onClick={onClose}
        aria-hidden="true"
      />
      <FocusTrap
        active
        focusTrapOptions={{ allowOutsideClick: true, escapeDeactivates: false, returnFocusOnDeactivate: true }}
      >
        <div
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[90vw] md:max-w-md flex-col border-l border-white/[0.06] bg-surface shadow-2xl animate-slide-in"
          role="dialog"
          aria-modal="true"
          aria-label="Wallet transactions"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 shrink-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-mono font-semibold text-zinc-100">
                  {shortenAddress(address, 6)}
                </span>
                {identity && (
                  <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold text-accent">
                    {identity.name}
                  </span>
                )}
              </div>
              {funding && (
                <p className="mt-0.5 text-[10px] text-zinc-500">
                  Funded by <span className="text-zinc-300">{funding.funderName || shortenAddress(funding.funder)}</span>
                  {funding.funderType && <span className="text-zinc-500"> ({funding.funderType})</span>}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Balance summary */}
          {balances && balances.totalUsdValue > 0 && (
            <div className="border-b border-white/[0.06] px-4 py-2.5 shrink-0">
              <div className="flex items-baseline gap-2">
                <span className="text-[18px] font-bold text-zinc-100 tabular-nums">
                  ${balances.totalUsdValue >= 1_000_000
                    ? `${(balances.totalUsdValue / 1e6).toFixed(2)}M`
                    : balances.totalUsdValue >= 1_000
                      ? `${(balances.totalUsdValue / 1e3).toFixed(1)}K`
                      : balances.totalUsdValue.toFixed(2)}
                </span>
                <span className="text-[10px] text-zinc-500">portfolio value</span>
              </div>
              {balances.nativeBalance != null && (
                <p className="text-[10px] text-zinc-400 mt-0.5">
                  {balances.nativeBalance.toFixed(4)} SOL
                </p>
              )}
              {balances.balances.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {balances.balances.slice(0, 8).map((b) => (
                    <span
                      key={b.mint}
                      className="inline-flex items-center gap-1 rounded bg-white/[0.04] px-1.5 py-0.5 text-[9px] text-zinc-300"
                    >
                      <span className="font-semibold">{b.symbol}</span>
                      <span className="text-zinc-500">
                        {b.balance >= 1_000 ? `${(b.balance / 1e3).toFixed(1)}K` : b.balance.toFixed(2)}
                      </span>
                    </span>
                  ))}
                  {balances.balances.length > 8 && (
                    <span className="text-[9px] text-zinc-500 px-1">+{balances.balances.length - 8} more</span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Transactions */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-2">
              <h4 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                Recent Activity
              </h4>
            </div>
            {(profileLoading || txLoading) && (
              <div className="px-4 space-y-2">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-lg bg-white/[0.03]" />
                ))}
              </div>
            )}
            {!txLoading && txs.length === 0 && (
              <div className="px-4 py-6 text-center text-[11px] text-zinc-500">
                No recent transactions
              </div>
            )}
            <div className="px-3 space-y-1">
              {txs.map((tx) => {
                const typeColor = TX_TYPE_COLORS[tx.type] ?? 'text-zinc-400 bg-white/[0.04]';
                return (
                  <a
                    key={tx.signature}
                    href={`https://solscan.io/tx/${tx.signature}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${typeColor}`}>
                        {tx.type}
                      </span>
                      <span className="text-[9px] text-zinc-500 uppercase">{tx.source}</span>
                      <span className="ml-auto text-[9px] text-zinc-500 tabular-nums">
                        {formatTimeAgo(tx.timestamp * 1000)}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-300 leading-snug line-clamp-2">
                      {tx.description || `${tx.type} via ${tx.source}`}
                    </p>
                    <p className="mt-0.5 text-[9px] text-zinc-600 font-mono truncate">
                      {shortenAddress(tx.signature, 8)}
                    </p>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.06] px-4 py-2.5 shrink-0">
            <a
              href={`https://solscan.io/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-accent/10 border border-accent/15 py-2 text-center text-[12px] font-semibold text-accent transition-all hover:bg-accent/20"
            >
              View on Solscan
            </a>
          </div>
        </div>
      </FocusTrap>
    </>
  );
}
