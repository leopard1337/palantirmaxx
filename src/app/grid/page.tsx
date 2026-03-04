'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { Suspense, useMemo, useState } from 'react';
import { fetchFeed } from '@/lib/api/feed';
import { flattenFeedPages, getFeedNextPageParam } from '@/lib/feed-infinite';
import type { FeedItem } from '@/lib/api/types';
import { FeedCard } from '@/components/FeedCard';
import { FeedDetailDrawer } from '@/components/FeedDetailDrawer';
import { FeedListSkeleton } from '@/components/LoadingSkeleton';
import { QueryErrorBanner } from '@/components/QueryErrorBanner';

const FEED_TYPES = ['all', 'news', 'tweet', 'telegram'] as const;

function GridColumn({
  type,
  onItemClick,
}: {
  type: (typeof FEED_TYPES)[number];
  onItemClick: (item: FeedItem) => void;
}) {
  const { data, isLoading, error, refetch, fetchNextPage, hasNextPage, isFetching } =
    useInfiniteQuery({
      queryKey: ['feed', 'grid', type],
      queryFn: ({ pageParam }) =>
        fetchFeed({
          page: pageParam,
          count: 15,
          type: type === 'all' ? undefined : type,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage, allPages) =>
        getFeedNextPageParam(lastPage, allPages, 15),
      staleTime: 20_000,
    });

  const items = useMemo(
    () => flattenFeedPages(data?.pages),
    [data?.pages],
  );

  const typeLabels: Record<string, string> = {
    all: 'All',
    news: 'News',
    tweet: 'X / Twitter',
    telegram: 'Telegram',
  };

  if (isLoading) return <FeedListSkeleton />;
  if (error) {
    return (
      <div className="flex flex-col p-3 rounded-lg border border-white/[0.08] bg-white/[0.03]">
        <QueryErrorBanner
          message={`Failed to load ${typeLabels[type] ?? type} feed`}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.03] animate-fade-in">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] font-semibold text-zinc-300 tracking-wide">
            {typeLabels[type] ?? type}
          </span>
        </div>
        <span className="text-[9px] text-zinc-500 tabular-nums">
          {items.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              onClick={() => onItemClick(item)}
            />
          ))}
        </div>
        {hasNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetching}
            className="mt-2 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-1.5 text-[10px] text-zinc-400 hover:bg-white/[0.06] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            {isFetching ? 'Loading...' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}

function GridContent() {
  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [cols, setCols] = useState(3);

  return (
    <div className="flex h-full flex-col p-3">
      <div className="mb-3 flex items-center justify-between shrink-0">
        <h1 className="text-[15px] font-semibold text-zinc-100">Grid View</h1>
        <div className="flex gap-1">
          {[2, 3].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCols(n)}
              className={`rounded-lg px-2 py-1 text-[10px] font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                cols === n
                  ? 'bg-white/[0.1] text-zinc-100'
                  : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08]'
              }`}
            >
              {n} col
            </button>
          ))}
        </div>
      </div>
      <div
        className={`grid flex-1 gap-2 min-h-0 grid-cols-1 ${cols >= 2 ? 'sm:grid-cols-2' : ''} ${cols >= 3 ? 'lg:grid-cols-3' : ''}`}
      >
        <GridColumn type="news" onItemClick={setSelectedItem} />
        <GridColumn type="tweet" onItemClick={setSelectedItem} />
        {cols >= 3 && (
          <GridColumn type="telegram" onItemClick={setSelectedItem} />
        )}
      </div>
      <FeedDetailDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}

export default function GridPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-[11px] text-zinc-500">Loading grid...</div>
      }
    >
      <GridContent />
    </Suspense>
  );
}
