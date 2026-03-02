'use client';

import { useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';
import { fetchEvents } from '@/lib/api/events';
import type { EventMarket } from '@/lib/api/types';
import { formatVolume, formatProbability } from '@/lib/utils';

const CompactMarket = memo(function CompactMarket({
  market,
}: {
  market: EventMarket;
}) {
  return (
    <a
      href={`https://polymarket.com/event/${market.slug}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 px-3 py-2 border-b border-white/[0.06] hover:bg-white/[0.06] transition-colors"
    >
      {market.image && (
        <img
          src={market.image}
          alt=""
          className="h-6 w-6 rounded object-cover shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-zinc-200 leading-snug line-clamp-2">
          {market.question || market.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-[10px]">
          <span className="text-accent font-mono">
            {formatProbability(market.yes_probability)}
          </span>
          <span className="text-zinc-400">{formatVolume(market.volume)}</span>
        </div>
      </div>
      <div className="w-10 h-1.5 rounded-full bg-white/[0.06] overflow-hidden shrink-0">
        <div
          className="h-full bg-accent/30 rounded-full"
          style={{
            width: `${Math.round(market.yes_probability * 100)}%`,
          }}
        />
      </div>
    </a>
  );
});

export function MarketsWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['events', 'widget-markets', 'all'],
    queryFn: () => fetchEvents('all'),
  });

  const markets = useMemo(() => {
    if (!data) return [];
    const result: EventMarket[] = [];
    for (const ev of data) {
      for (const m of ev.markets ?? []) result.push(m);
    }
    return result.sort((a, b) => b.volume - a.volume).slice(0, 50);
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-px p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-11 animate-pulse rounded bg-white/[0.02]"
            style={{ animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-zinc-500">
        No markets
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="flex flex-col">
        {markets.map((m) => (
          <CompactMarket key={m.id} market={m} />
        ))}
      </div>
    </div>
  );
}
