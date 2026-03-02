'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { fetchMovers } from '@/lib/api/movers';
import type { FeedItem } from '@/lib/api/types';
import {
  getFeedSourceType,
  getFeedBody,
  getFeedTitle,
  getFeedSourceLabel,
  formatTimeAgo,
  getCountryFlag,
  formatProbability,
  formatVolume,
} from '@/lib/utils';
import { FeedDetailDrawer } from '@/components/FeedDetailDrawer';
import { MoversTableSkeleton } from '@/components/LoadingSkeleton';
import { SOURCE_STYLES } from '@/lib/constants';

export default function MoversPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['movers'],
    queryFn: fetchMovers,
    refetchInterval: 60_000,
  });

  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const movers = data ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] px-5 py-3.5 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[15px] font-semibold text-zinc-100">
              Top Movers
            </h1>
            <p className="mt-0.5 text-[10px] text-zinc-500">
              Signals with the most market impact
            </p>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-zinc-100 disabled:opacity-50"
          >
            {isFetching ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <div className="mb-4 rounded-lg border border-red-900/40 bg-red-950/20 p-4 text-red-300">
            <p className="text-[12px] font-medium">Error loading movers</p>
            <p className="mt-1 text-[11px] text-red-400/70">
              {String(error)}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded bg-red-900/40 px-3 py-1.5 text-[11px] hover:bg-red-900/60"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading && <MoversTableSkeleton />}

        {!isLoading && !error && movers.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] py-16 text-center">
            <p className="text-zinc-300 text-[12px]">
              No movers data available
            </p>
          </div>
        )}

        {!isLoading && !error && movers.length > 0 && (
          <div className="flex flex-col gap-1.5 stagger-list">
            {movers.map((mover) => {
              const fi = mover.feed_item;
              const sourceType = getFeedSourceType(fi);
              const body = getFeedBody(fi) || '';
              const title = getFeedTitle(fi);
              const displayText = body || title;
              const sourceLabel = getFeedSourceLabel(fi);
              const topMarket = fi.related_markets?.[0];
              const s = SOURCE_STYLES[sourceType] ?? SOURCE_STYLES.news;

              return (
                <button
                  key={`mover-${mover.rank}-${fi.id}`}
                  type="button"
                  onClick={() => setSelectedItem(fi)}
                  className="group flex w-full items-start gap-3 rounded-lg border border-white/[0.08] bg-white/[0.03] p-3.5 text-left transition-all hover:border-white/[0.14] hover:bg-white/[0.05] active:scale-[0.998]"
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[11px] font-bold text-zinc-300">
                    #{mover.rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {fi.tweet?.user.pfp && (
                        <img
                          src={fi.tweet.user.pfp}
                          alt=""
                          className="h-4 w-4 rounded-full"
                        />
                      )}
                      <span
                        className={`flex items-center gap-1 text-[10px] font-semibold uppercase ${s.text}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${s.dot}`}
                        />
                        {sourceType}
                      </span>
                      <span className="text-[10px] text-zinc-400 truncate">
                        {sourceLabel}
                      </span>
                      {fi.countries && fi.countries.length > 0 && (
                        <span className="text-[11px]">
                          {fi.countries.map(getCountryFlag).join(' ')}
                        </span>
                      )}
                      <span className="ml-auto text-[10px] text-zinc-500 tabular-nums">
                        {formatTimeAgo(fi.timestamp)}
                      </span>
                    </div>
                    {title && title !== body && (
                      <p className="text-[11px] font-medium text-zinc-100 leading-snug line-clamp-1 mb-0.5">
                        {title}
                      </p>
                    )}
                    <p className="text-[11px] text-zinc-200 leading-relaxed line-clamp-2">
                      {displayText}
                    </p>
                    {topMarket && (
                      <div className="mt-1.5 flex items-center gap-2.5 text-[10px]">
                        <span className="font-mono font-semibold text-accent">
                          {formatProbability(topMarket.yes_probability)} Yes
                        </span>
                        <span className="text-zinc-400">
                          {formatVolume(topMarket.volume)} vol
                        </span>
                        {topMarket.highest_price_change > 0 && (
                          <span className="text-accent/70 font-mono">
                            +
                            {(topMarket.highest_price_change * 100).toFixed(1)}%
                          </span>
                        )}
                        <span className="truncate text-zinc-400">
                          {topMarket.question || topMarket.event_title}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
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
