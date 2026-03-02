'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { memo, useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { fetchFeed } from '@/lib/api/feed';
import type { FeedItem } from '@/lib/api/types';
import {
  getFeedSourceType,
  getFeedBody,
  getFeedTitle,
  getFeedSourceLabel,
  formatTimeAgo,
} from '@/lib/utils';
import { SOURCE_DOT } from '@/lib/constants';

const ITEM_GAP = 0;

const CompactItem = memo(function CompactItem({
  item,
  onClick,
}: {
  item: FeedItem;
  onClick: () => void;
}) {
  const src = getFeedSourceType(item);
  const body = getFeedBody(item) || '';
  const title = getFeedTitle(item);
  const displayText = body || title;
  const source = getFeedSourceLabel(item);
  const topMkt = item.related_markets?.[0];

  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 border-b border-white/[0.06] hover:bg-white/[0.06] transition-colors"
    >
      <div className="flex items-center gap-1.5">
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${SOURCE_DOT[src] ?? 'bg-zinc-500'}`} />
        <span className="text-[10px] text-zinc-400 truncate min-w-0">{source}</span>
        {topMkt && (
          <span className="text-[10px] text-accent font-mono font-medium shrink-0">
            {Math.round(topMkt.yes_probability * 100)}%
          </span>
        )}
        <span className="ml-auto text-[10px] text-zinc-600 tabular-nums shrink-0">
          {formatTimeAgo(item.timestamp)}
        </span>
      </div>
      <p className="text-[11px] text-zinc-200 leading-snug line-clamp-1 mt-0.5">
        {displayText}
      </p>
    </button>
  );
});

export function FeedWidget({
  type,
  onSelectItem,
}: {
  type: 'all' | 'news' | 'tweet' | 'telegram';
  onSelectItem?: (item: FeedItem) => void;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const apiType = type === 'all' ? undefined : type;

  const { data, isLoading } = useInfiniteQuery({
    queryKey: ['feed', 'widget', type],
    queryFn: ({ pageParam }) =>
      fetchFeed({ page: pageParam, count: 30, type: apiType }),
    initialPageParam: 1,
    getNextPageParam: () => undefined,
  });

  const items = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    return data.pages
      .flatMap((p) => p.items)
      .filter((i) => {
        if (seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
      });
  }, [data]);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 46,
    gap: ITEM_GAP,
    overscan: 10,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col p-2 gap-px">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[44px] animate-pulse rounded bg-white/[0.03]" style={{ animationDelay: `${i * 30}ms` }} />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-zinc-500">
        No signals
      </div>
    );
  }

  return (
    <div ref={parentRef} className="absolute inset-0 overflow-y-auto">
      <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {virtualizer.getVirtualItems().map((row) => {
          const item = items[row.index];
          return (
            <div
              key={item.id}
              data-index={row.index}
              ref={virtualizer.measureElement}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${row.start}px)` }}
            >
              <CompactItem item={item} onClick={() => onSelectItem?.(item)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
