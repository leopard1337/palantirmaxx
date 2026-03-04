'use client';

import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { useState } from 'react';
import { fetchEvents, CATEGORIES, type EventCategory } from '@/lib/api/events';
import type { EventData, EventMarket } from '@/lib/api/types';
import { formatVolume, formatProbability } from '@/lib/utils';
import { getPreference, setPreference } from '@/lib/preferences';
import { QueryErrorBanner } from '@/components/QueryErrorBanner';

function MarketRow({
  market,
  event,
}: {
  market: EventMarket;
  event: EventData;
}) {
  return (
    <a
      href={`https://polymarket.com/event/${market.slug || event.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] p-3.5 transition-all hover:border-white/[0.14] hover:bg-white/[0.05] active:scale-[0.998]"
    >
      {market.image && (
        <Image
          src={market.image}
          alt=""
          width={36}
          height={36}
          className="h-9 w-9 rounded-lg object-cover shrink-0 ring-1 ring-white/[0.08]"
          unoptimized={market.image.startsWith('data:')}
        />
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-medium text-zinc-100 leading-snug line-clamp-2">
          {market.question || market.title || event.title}
        </p>
        <div className="mt-1.5 flex items-center gap-2.5 text-[10px]">
          <span className="font-mono font-semibold text-accent">
            {formatProbability(market.yes_probability)} Yes
          </span>
          <span className="font-mono text-red-400/70">
            {formatProbability(market.no_probability)} No
          </span>
          <span className="text-zinc-400">{formatVolume(market.volume)}</span>
          {market.end_date && (
            <span className="text-zinc-500">
              Ends {new Date(market.end_date).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0">
        <div className="h-5 w-14 rounded bg-white/[0.06] overflow-hidden">
          <div
            className="h-full bg-accent/25"
            style={{
              width: `${Math.round(market.yes_probability * 100)}%`,
            }}
          />
        </div>
      </div>
    </a>
  );
}

export default function MarketsPage() {
  const [category, setCategory] = useState<EventCategory>(() => {
    const stored = getPreference('marketsCategory');
    return (stored && (CATEGORIES as readonly string[]).includes(stored) ? stored : 'all') as EventCategory;
  });
  const setCategoryAndSave = (c: EventCategory) => {
    setCategory(c);
    setPreference('marketsCategory', c);
  };
  const [search, setSearch] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['events', category],
    queryFn: () => fetchEvents(category),
  });

  const allMarkets: { market: EventMarket; event: EventData }[] = [];
  if (data) {
    for (const event of data) {
      for (const market of event.markets ?? []) {
        allMarkets.push({ market, event });
      }
    }
  }

  const filtered = search.trim()
    ? allMarkets.filter(({ market, event }) => {
        const q = search.toLowerCase();
        return (
          (market.question || '').toLowerCase().includes(q) ||
          (market.title || '').toLowerCase().includes(q) ||
          event.title.toLowerCase().includes(q)
        );
      })
    : allMarkets;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] px-5 py-3.5 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <h1 className="text-[15px] font-semibold text-zinc-100">Markets</h1>
          <span className="text-[10px] tabular-nums text-zinc-400">
            {filtered.length} contract{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
        <input
          type="text"
          placeholder="Search markets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-2.5 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[12px] text-zinc-200 placeholder-zinc-500 outline-none focus:border-white/[0.14] transition-colors"
        />
        <div className="flex flex-wrap gap-1 overflow-x-auto pb-0.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryAndSave(c)}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors ${
                category === c
                  ? 'bg-white/[0.1] text-zinc-100'
                  : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200'
              }`}
            >
              {c === 'all' ? 'All' : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <QueryErrorBanner
            message={`Error loading markets: ${String(error)}`}
            onRetry={() => refetch()}
          />
        )}

        {isLoading && (
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-lg bg-white/[0.02]"
                style={{ animationDelay: `${i * 45}ms` }}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] py-16 text-center">
            <p className="text-zinc-300 text-[12px]">No markets found</p>
            <p className="mt-1 text-[10px] text-zinc-500">
              {search
                ? 'Try a different search term.'
                : 'Try a different category.'}
            </p>
          </div>
        )}

        {!isLoading && !error && filtered.length > 0 && (
          <div className="flex flex-col gap-1.5 stagger-list">
            {filtered.map(({ market, event }) => (
              <MarketRow key={market.id} market={market} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
