'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import FocusTrap from 'focus-trap-react';
import { fetchWalletProfile, fetchWalletTransactions } from '@/lib/api/helius';
import { formatTimeAgo } from '@/lib/utils';
import { shortenAddress } from '@/components/AddressLink';

const TX_TYPE_COLORS: Record<string, string> = {
  SWAP: 'text-accent bg-accent/10',
  TRANSFER: 'text-sky-400 bg-sky-400/10',
  NFT_SALE: 'text-purple-400 bg-purple-400/10',
  BURN: 'text-red-400 bg-red-400/10',
};

export function WalletProfileDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { publicKey } = useWallet();
  const address = publicKey?.toBase58() ?? '';

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['my-wallet-profile', address],
    queryFn: () => fetchWalletProfile(address),
    staleTime: 30_000,
    enabled: open && !!address,
  });

  const { data: txs = [], isLoading: txLoading } = useQuery({
    queryKey: ['my-wallet-txs', address],
    queryFn: () => fetchWalletTransactions(address, 20),
    staleTime: 15_000,
    enabled: open && !!address,
  });

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open || !address) return null;

  const identity = profile?.identity;
  const funding = profile?.funding;
  const balances = profile?.balances;
  const isLoading = profileLoading || txLoading;

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
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[90vw] md:max-w-lg flex-col border-l border-white/[0.06] bg-surface shadow-2xl animate-slide-in"
          role="dialog"
          aria-modal="true"
          aria-label="Wallet profile"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 shrink-0">
            <div className="min-w-0">
              <span className="text-[13px] font-semibold text-zinc-100">My Wallet</span>
              <p className="text-[10px] text-zinc-400 font-mono mt-0.5">{shortenAddress(address, 8)}</p>
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

          <div className="flex-1 overflow-y-auto">
            {isLoading && (
              <div className="px-4 py-4 space-y-3">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className="h-10 animate-pulse rounded-lg bg-white/[0.03]" />
                ))}
              </div>
            )}

            {!isLoading && profile && (
              <>
                {/* Identity & Funding */}
                <div className="border-b border-white/[0.06] px-4 py-3 space-y-2">
                  {identity && (
                    <div className="rounded-lg border border-accent/15 bg-accent/5 px-3 py-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-accent/60">Known As</span>
                      <p className="text-[13px] font-semibold text-accent mt-0.5">{identity.name}</p>
                      <p className="text-[10px] text-zinc-400">{identity.category}</p>
                    </div>
                  )}
                  {funding && (
                    <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Funded By</span>
                      <p className="text-[12px] text-zinc-200 mt-0.5">
                        {funding.funderName || shortenAddress(funding.funder)}
                        {funding.funderType && (
                          <span className="text-zinc-500 ml-1">({funding.funderType})</span>
                        )}
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">
                        {(funding.amount / 1e9).toFixed(4)} SOL &middot; {formatTimeAgo(funding.timestamp * 1000)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Balances */}
                {balances && (
                  <div className="border-b border-white/[0.06] px-4 py-3">
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-[20px] font-bold text-zinc-100 tabular-nums">
                        ${balances.totalUsdValue >= 1_000_000
                          ? `${(balances.totalUsdValue / 1e6).toFixed(2)}M`
                          : balances.totalUsdValue >= 1_000
                            ? `${(balances.totalUsdValue / 1e3).toFixed(1)}K`
                            : balances.totalUsdValue.toFixed(2)}
                      </span>
                      <span className="text-[10px] text-zinc-500">total value</span>
                    </div>
                    {balances.nativeBalance != null && (
                      <div className="mb-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-zinc-200">SOL</span>
                        <span className="text-[11px] font-mono text-zinc-300 tabular-nums">
                          {balances.nativeBalance.toFixed(4)}
                        </span>
                      </div>
                    )}
                    <div className="space-y-1">
                      {balances.balances.slice(0, 15).map((b) => (
                        <div
                          key={b.mint}
                          className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-1.5"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {b.logoUri && (
                              <img src={b.logoUri} alt="" className="h-4 w-4 rounded-full shrink-0" />
                            )}
                            <span className="text-[11px] font-semibold text-zinc-200 truncate">{b.symbol}</span>
                            {b.name && <span className="text-[9px] text-zinc-500 truncate hidden md:inline">{b.name}</span>}
                          </div>
                          <div className="text-right shrink-0 ml-2">
                            <span className="text-[10px] font-mono text-zinc-300 tabular-nums block">
                              {b.balance >= 1_000_000
                                ? `${(b.balance / 1e6).toFixed(2)}M`
                                : b.balance >= 1_000
                                  ? `${(b.balance / 1e3).toFixed(1)}K`
                                  : b.balance.toFixed(b.decimals > 2 ? 4 : 2)}
                            </span>
                            {b.usdValue != null && (
                              <span className="text-[9px] text-zinc-500 tabular-nums">
                                ${b.usdValue.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Activity */}
                <div className="px-4 py-3">
                  <h4 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                    Recent Transactions
                  </h4>
                  {txs.length === 0 && (
                    <p className="text-[11px] text-zinc-500 py-3">No recent transactions</p>
                  )}
                  <div className="space-y-1">
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
                        </a>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-white/[0.06] px-4 py-2.5 shrink-0">
            <a
              href={`https://solscan.io/account/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-accent/10 border border-accent/15 py-2 text-center text-[12px] font-semibold text-accent transition-all hover:bg-accent/20"
            >
              View Full Profile on Solscan
            </a>
          </div>
        </div>
      </FocusTrap>
    </>
  );
}
