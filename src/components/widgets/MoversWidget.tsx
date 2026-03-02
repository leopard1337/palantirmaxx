'use client';

import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import { fetchMovers } from '@/lib/api/movers';
import type { FeedItem, MoverEntry } from '@/lib/api/types';
import { getFeedBody, getFeedTitle, getFeedSourceType, formatTimeAgo } from '@/lib/utils';
import { SOURCE_DOT } from '@/lib/constants';

const CompactMover = memo(function CompactMover({
  mover,
  onClick,
}: {
  mover: MoverEntry;
  onClick: () => void;
}) {
  const fi = mover.feed_item;
  const src = getFeedSourceType(fi);
  const body = getFeedBody(fi) || '';
  const title = getFeedTitle(fi);
  const displayText = body || title;
  const topMkt = fi.related_markets?.[0];

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 border-b border-white/[0.06] hover:bg-white/[0.06] transition-colors"
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[10px] font-bold text-zinc-400 w-4 text-right shrink-0">
          #{mover.rank}
        </span>
        <span
          className={`h-1.5 w-1.5 rounded-full shrink-0 ${SOURCE_DOT[src] ?? 'bg-zinc-500'}`}
        />
        <span className="ml-auto text-[10px] text-zinc-500 tabular-nums">
          {formatTimeAgo(fi.timestamp)}
        </span>
      </div>
      <p className="text-[11px] text-zinc-200 leading-snug line-clamp-2 pl-6">
        {displayText}
      </p>
      {topMkt && topMkt.highest_price_change > 0 && (
        <div className="mt-0.5 pl-6 text-[10px] text-accent font-mono">
          +{(topMkt.highest_price_change * 100).toFixed(1)}% move
        </div>
      )}
    </button>
  );
});

export function MoversWidget({
  onSelectItem,
}: {
  onSelectItem?: (item: FeedItem) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['movers', 'widget'],
    queryFn: fetchMovers,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-px p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 animate-pulse rounded bg-white/[0.02]"
            style={{ animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
    );
  }

  const movers = data ?? [];
  if (movers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-zinc-500">
        No movers
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="flex flex-col">
        {movers.map((m) => (
          <CompactMover
            key={`${m.rank}-${m.feed_item.id}`}
            mover={m}
            onClick={() => onSelectItem?.(m.feed_item)}
          />
        ))}
      </div>
    </div>
  );
}
