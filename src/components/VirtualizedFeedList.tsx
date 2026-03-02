'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';
import type { FeedItem } from '@/lib/api/types';
import { FEED_CARD_GAP } from '@/lib/constants';
import { FeedCard } from './FeedCard';

export function VirtualizedFeedList({
  items,
  onItemClick,
  loading,
}: {
  items: FeedItem[];
  onItemClick: (item: FeedItem) => void;
  loading?: boolean;
}) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120 + FEED_CARD_GAP,
    gap: 0, // gap doesn't work with measureElement; we bake it into each item
    overscan: 8,
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-lg bg-white/[0.02]"
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div
      ref={parentRef}
      className="h-full overflow-y-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={item.id}
              data-index={virtualRow.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: FEED_CARD_GAP,
                willChange: 'transform',
              }}
            >
              <FeedCard item={item} onClick={() => onItemClick(item)} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
