'use client';

import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { fetchMovers } from '@/lib/api/movers';
import type { FeedItem, MoverEntry } from '@/lib/api/types';
import { FeedDetailDrawer } from '@/components/FeedDetailDrawer';
import { MoversTableSkeleton } from '@/components/LoadingSkeleton';
import { MoverCard } from '@/components/MoverCard';
import { QueryErrorBanner } from '@/components/QueryErrorBanner';

type SortKey = 'rank' | 'change' | 'volume' | 'recent';
type ImpactFilter = 'all' | 'critical' | 'medium' | 'low';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'rank', label: 'Rank' },
  { value: 'change', label: '% Change' },
  { value: 'volume', label: 'Volume' },
  { value: 'recent', label: 'Most Recent' },
];

const IMPACT_FILTERS: { value: ImpactFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'critical', label: 'Critical' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export default function MoversPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['movers'],
    queryFn: fetchMovers,
    refetchInterval: 60_000,
  });

  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [sort, setSort] = useState<SortKey>('rank');
  const [impact, setImpact] = useState<ImpactFilter>('all');

  const movers = useMemo(() => {
    let items = data ?? [];

    if (impact !== 'all') {
      items = items.filter((m) => {
        const level = m.feed_item.related_markets?.[0]?.impact_level?.toLowerCase();
        return level === impact;
      });
    }

    const sorted = [...items];
    switch (sort) {
      case 'change':
        sorted.sort(
          (a, b) =>
            (b.feed_item.related_markets?.[0]?.highest_price_change ?? 0) -
            (a.feed_item.related_markets?.[0]?.highest_price_change ?? 0),
        );
        break;
      case 'volume':
        sorted.sort(
          (a, b) =>
            (b.feed_item.related_markets?.[0]?.volume ?? 0) -
            (a.feed_item.related_markets?.[0]?.volume ?? 0),
        );
        break;
      case 'recent':
        sorted.sort((a, b) => b.feed_item.timestamp - a.feed_item.timestamp);
        break;
      default:
        sorted.sort((a, b) => a.rank - b.rank);
    }

    return sorted;
  }, [data, sort, impact]);

  const stats = useMemo(() => {
    const all = data ?? [];
    const totalChange = all.reduce(
      (sum, m) =>
        sum + (m.feed_item.related_markets?.[0]?.highest_price_change ?? 0),
      0,
    );
    const avgChange = all.length > 0 ? totalChange / all.length : 0;
    const critical = all.filter(
      (m) => m.feed_item.related_markets?.[0]?.impact_level?.toLowerCase() === 'critical',
    ).length;

    return { total: all.length, avgChange, critical };
  }, [data]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-white/[0.06] px-5 py-3.5 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[15px] font-semibold text-zinc-100">
              Top Movers
            </h1>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              Markets with the highest price impact from real-time signals
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="cursor-pointer rounded-lg border border-white/[0.1] bg-white/[0.05] px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition-all hover:border-white/[0.2] hover:bg-white/[0.1] hover:text-zinc-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-white/[0.05]"
          >
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Stats bar */}
        {stats.total > 0 && (
          <div className="flex items-center gap-4 mb-3 text-[10px]">
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">Tracking</span>
              <span className="font-mono text-zinc-200 font-medium">{stats.total}</span>
              <span className="text-zinc-500">markets</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-500">Avg move</span>
              <span className="font-mono text-accent font-medium">
                {stats.avgChange > 0 ? '+' : ''}
                {(stats.avgChange * 100).toFixed(1)}%
              </span>
            </div>
            {stats.critical > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                <span className="text-red-400 font-medium">{stats.critical} critical/high impact</span>
              </div>
            )}
          </div>
        )}

        {/* Sort + Filter controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mr-1">Sort</span>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSort(opt.value)}
                className={`cursor-pointer rounded-md border px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                  sort === opt.value
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-transparent bg-white/[0.03] text-zinc-500 hover:border-white/[0.12] hover:bg-white/[0.08] hover:text-zinc-300 active:scale-[0.98]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="h-3 w-px bg-white/[0.06]" />
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mr-1">Impact</span>
            {IMPACT_FILTERS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setImpact(opt.value)}
                className={`cursor-pointer rounded-md border px-2.5 py-1.5 text-[10px] font-medium transition-all ${
                  impact === opt.value
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-transparent bg-white/[0.03] text-zinc-500 hover:border-white/[0.12] hover:bg-white/[0.08] hover:text-zinc-300 active:scale-[0.98]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <QueryErrorBanner
            message={`Error loading movers: ${String(error)}`}
            onRetry={() => refetch()}
          />
        )}

        {isLoading && <MoversTableSkeleton />}

        {!isLoading && !error && movers.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] py-16 text-center">
            <p className="text-zinc-300 text-[12px]">
              {impact !== 'all'
                ? `No ${impact} impact movers found`
                : 'No movers data available'}
            </p>
            {impact !== 'all' && (
              <button
                type="button"
                onClick={() => setImpact('all')}
                className="mt-3 cursor-pointer rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-[11px] text-zinc-300 transition-all hover:border-white/[0.2] hover:bg-white/[0.1] hover:text-zinc-100"
              >
                Show all
              </button>
            )}
          </div>
        )}

        {!isLoading && !error && movers.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {movers.map((mover) => (
              <MoverCard
                key={`mover-${mover.rank}-${mover.feed_item.id}`}
                mover={mover}
                onClick={() => setSelectedItem(mover.feed_item)}
              />
            ))}
          </div>
        )}
      </div>

      <FeedDetailDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
