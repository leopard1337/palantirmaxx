'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { fetchFeed } from '@/lib/api/feed';
import type { FeedItem } from '@/lib/api/types';
import { FeedDetailDrawer } from '@/components/FeedDetailDrawer';
import { FeedListSkeleton } from '@/components/LoadingSkeleton';
import { ShortcutHelp } from '@/components/ShortcutHelp';
import { VirtualizedFeedList } from '@/components/VirtualizedFeedList';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

const FEED_TYPES = ['all', 'news', 'tweet', 'telegram'] as const;
type FeedTypeFilter = (typeof FEED_TYPES)[number];

const API_TYPES = ['news', 'tweet', 'telegram'] as const;

const PAGE_SIZE = 20;

function FeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as FeedTypeFilter | null;
  const type =
    typeParam && FEED_TYPES.includes(typeParam) ? typeParam : 'all';

  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  const apiType =
    type === 'all'
      ? undefined
      : (API_TYPES as readonly string[]).includes(type)
        ? (type as 'news' | 'tweet' | 'telegram')
        : undefined;

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['feed', type],
    queryFn: ({ pageParam }) =>
      fetchFeed({ page: pageParam, count: PAGE_SIZE, type: apiType }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.items.length >= PAGE_SIZE
        ? allPages.length + 1
        : undefined,
  });

  const allItems = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    return data.pages
      .flatMap((p) => p.items)
      .filter((i) => {
        if (seen.has(i.id)) return false;
        seen.add(i.id);
        return true;
      });
  }, [data, type]);

  const totalCount = data?.pages?.[0]?.total ?? 0;

  const { showHelp, setShowHelp } = useKeyboardShortcuts({
    onJ: () => {
      const next = Math.min(allItems.length - 1, focusedIndex + 1);
      setFocusedIndex(next);
      if (allItems[next]) setSelectedItem(allItems[next]);
    },
    onK: () => {
      const prev = Math.max(0, focusedIndex - 1);
      setFocusedIndex(prev);
      if (allItems[prev]) setSelectedItem(allItems[prev]);
    },
  });

  const updateType = useCallback(
    (newType: FeedTypeFilter) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newType === 'all') params.delete('type');
      else params.set('type', newType);
      const qs = params.toString();
      router.push(qs ? `/feed?${qs}` : '/feed');
    },
    [router, searchParams],
  );

  const showList = !isLoading && !error && allItems.length > 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] px-5 py-3.5 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <h1 className="text-[15px] font-semibold text-zinc-100">
            Live Feed
          </h1>
          {totalCount > 0 && (
            <span className="text-[10px] tabular-nums text-zinc-400">
              {totalCount.toLocaleString()} signals
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {FEED_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => updateType(t)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors ${
                type === t
                  ? 'bg-white/[0.1] text-zinc-100'
                  : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200'
              }`}
            >
              {t === 'all'
                ? 'All'
                : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-zinc-500 self-center">
            Press ? for shortcuts
          </span>
        </div>
      </div>

      {!showList && (
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 rounded-lg border border-red-900/40 bg-red-950/20 p-4 text-red-300">
              <p className="text-[12px] font-medium">Error loading feed</p>
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
          {isLoading && <FeedListSkeleton />}
          {!isLoading && !error && allItems.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] py-16 text-center">
              <p className="text-zinc-300 text-[12px]">No signals found</p>
              <p className="mt-1 text-[10px] text-zinc-500">
                Try adjusting filters or check back later.
              </p>
            </div>
          )}
        </div>
      )}

      {showList && (
        <div className="flex-1 min-h-0 flex flex-col p-4 pb-0">
          <div className="flex-1 min-h-0">
            <VirtualizedFeedList
              items={allItems}
              onItemClick={(item) => {
                setSelectedItem(item);
                setFocusedIndex(allItems.indexOf(item));
              }}
              loading={false}
            />
          </div>
          {hasNextPage && (
            <div className="flex justify-center py-2 shrink-0">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetching}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-white/[0.08] disabled:opacity-50"
              >
                {isFetching ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}

      <FeedDetailDrawer
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {showHelp && (
        <ShortcutHelp onClose={() => setShowHelp(false)} feedShortcuts />
      )}
    </div>
  );
}

export default function FeedPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-[11px] text-zinc-500">Loading feed...</div>
      }
    >
      <FeedContent />
    </Suspense>
  );
}
