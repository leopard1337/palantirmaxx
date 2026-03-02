'use client';

import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import { fetchCryptoQuotes, fetchStablecoinMarkets } from '@/lib/api/intel';
import type { CryptoQuote, StablecoinMarket } from '@/lib/api/intel-types';

const CompactCrypto = memo(function CompactCrypto({ q }: { q: CryptoQuote }) {
  const price = q.price ?? q.priceUsd ?? 0;
  const change = q.change24h ?? 0;
  const positive = change >= 0;
  const symbol = (q.symbol ?? q.id ?? '').toUpperCase();

  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06]">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-zinc-400 tabular-nums">{symbol}</span>
        <span className="text-[11px] font-mono text-zinc-200">
          {price >= 1 ? `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${price.toFixed(4)}`}
        </span>
      </div>
      {change !== 0 && (
        <span className={`text-[10px] font-mono font-bold ${positive ? 'text-accent' : 'text-red-400'}`}>
          {positive ? '+' : ''}{change.toFixed(2)}%
        </span>
      )}
    </div>
  );
});

const CompactStable = memo(function CompactStable({ s }: { s: StablecoinMarket }) {
  const peg = s.pegStatus ?? 'Unknown';
  const isPegged = peg.toLowerCase().includes('peg') || peg === 'normal' || peg === 'pegged';
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06]">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-zinc-400">{s.symbol}</span>
        <span className="text-[11px] font-mono text-zinc-200">${s.price.toFixed(4)}</span>
      </div>
      <span className={`text-[9px] font-bold uppercase ${isPegged ? 'text-accent' : 'text-amber-400'}`}>
        {peg}
      </span>
    </div>
  );
});

export function CryptoStablecoinWidget() {
  const { data: crypto } = useQuery({
    queryKey: ['intel', 'crypto'],
    queryFn: () => fetchCryptoQuotes(['bitcoin', 'ethereum', 'solana']),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const { data: stable } = useQuery({
    queryKey: ['intel', 'stablecoins'],
    queryFn: () => fetchStablecoinMarkets(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const quotes = crypto ?? [];
  const stablecoins = stable?.stablecoins ?? [];

  const loading = !crypto && !stable;

  if (loading) {
    return (
      <div className="flex flex-col p-2 gap-px">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[40px] animate-pulse rounded bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  if (quotes.length === 0 && stablecoins.length === 0) {
    return (
      <div className="flex flex-col gap-2 p-3">
        <p className="text-[11px] text-zinc-500">Crypto & Stablecoins</p>
        <p className="text-[10px] text-zinc-600">No data available</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      {quotes.length > 0 && (
        <div className="border-b border-white/[0.08]">
          <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">Crypto</p>
          {quotes.map((q) => (
            <CompactCrypto key={q.id ?? q.symbol ?? q.name ?? Math.random()} q={q} />
          ))}
        </div>
      )}
      {stablecoins.length > 0 && (
        <div>
          <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">Stablecoins</p>
          {stablecoins.slice(0, 6).map((s) => (
            <CompactStable key={s.id} s={s} />
          ))}
        </div>
      )}
    </div>
  );
}
