'use client';

import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import { fetchMovers } from '@/lib/api/movers';
import type { FeedItem, MoverEntry } from '@/lib/api/types';
import { getFeedBody, getFeedTitle, formatTimeAgo } from '@/lib/utils';

const CompactMover = memo(function CompactMover({
  mover,
  onClick,
}: {
  mover: MoverEntry;
  onClick: () => void;
}) {
  const fi = mover.feed_item;
  const body = getFeedBody(fi) || '';
  const title = getFeedTitle(fi);
  const topMkt = fi.related_markets?.[0];
  const change = topMkt?.highest_price_change ?? 0;
  const positive = change >= 0;

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 border-b border-white/[0.06] hover:bg-white/[0.06] transition-colors"
    >
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[10px] font-bold text-zinc-400 w-4 text-right shrink-0">
          #{mover.rank}
        </span>
        {change !== 0 && (
          <span className={`font-mono text-[10px] font-bold ${positive ? 'text-accent' : 'text-red-400'}`}>
            {positive ? '+' : ''}{(change * 100).toFixed(1)}%
          </span>
        )}
        {topMkt?.impact_level && (
          <span className={`text-[8px] font-bold uppercase rounded px-1 py-[0.5px] ${
            topMkt.impact_level === 'high' || topMkt.impact_level === 'critical'
              ? 'bg-red-500/10 text-red-400'
              : topMkt.impact_level === 'medium'
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-zinc-500/10 text-zinc-500'
          }`}>
            {topMkt.impact_level}
          </span>
        )}
        <span className="ml-auto text-[9px] text-zinc-500 tabular-nums">
          {formatTimeAgo(fi.timestamp)}
        </span>
      </div>
      {topMkt && (
        <p className="text-[10px] text-zinc-200 leading-snug line-clamp-1 pl-6 mb-0.5">
          {topMkt.question || topMkt.event_title}
        </p>
      )}
      <p className="text-[10px] text-zinc-400 leading-snug line-clamp-1 pl-6">
        {body || title}
      </p>
      {topMkt && (
        <div className="mt-0.5 pl-6 flex items-center gap-2 text-[9px]">
          <span className="font-mono text-accent/70">
            YES {Math.round(topMkt.yes_probability * 100)}\u00A2
          </span>
          <span className="font-mono text-red-400/50">
            NO {Math.round(topMkt.no_probability * 100)}\u00A2
          </span>
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
