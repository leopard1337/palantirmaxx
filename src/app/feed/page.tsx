'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useMemo, useState } from 'react';
import { fetchFeed } from '@/lib/api/feed';
import type { FeedItem } from '@/lib/api/types';
import { FeedDetailDrawer } from '@/components/FeedDetailDrawer';
import { FeedListSkeleton } from '@/components/LoadingSkeleton';
import { QueryErrorBanner } from '@/components/QueryErrorBanner';
import { ShortcutHelp } from '@/components/ShortcutHelp';
import { VirtualizedFeedList } from '@/components/VirtualizedFeedList';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import {
  SEVERITY_OPTIONS,
  CATEGORY_OPTIONS,
  TOPIC_OPTIONS,
} from '@/lib/constants';
import { getItemSeverity, itemMatchesTopic } from '@/lib/utils';

const FEED_TYPES = ['all', 'news', 'tweet', 'telegram'] as const;
type FeedTypeFilter = (typeof FEED_TYPES)[number];
const API_TYPES = ['news', 'tweet', 'telegram'] as const;
const PAGE_SIZE = 20;

function FilterPill({
  label,
  active,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 rounded-md px-2.5 py-1 text-[10px] font-medium transition-all duration-150 border ${
        active
          ? className ?? 'bg-white/[0.1] text-zinc-100 border-white/[0.12]'
          : 'bg-transparent text-zinc-500 border-transparent hover:bg-white/[0.06] hover:text-zinc-300'
      }`}
    >
      {label}
    </button>
  );
}

function FeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type') as FeedTypeFilter | null;
  const type =
    typeParam && FEED_TYPES.includes(typeParam) ? typeParam : 'all';

  const [selectedItem, setSelectedItem] = useState<FeedItem | null>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [severity, setSeverity] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);

  const activeFilterCount =
    (severity ? 1 : 0) + (category ? 1 : 0) + (topic ? 1 : 0);

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

  const rawItems = useMemo(() => {
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

  const allItems = useMemo(() => {
    let items = rawItems;

    if (severity) {
      items = items.filter((i) => getItemSeverity(i) === severity);
    }
    if (category) {
      const cat = category.toLowerCase();
      items = items.filter((i) =>
        i.categories?.some((c) => c.toLowerCase() === cat),
      );
    }
    if (topic) {
      const topicOpt = TOPIC_OPTIONS.find((t) => t.slug === topic);
      if (topicOpt) {
        items = items.filter((i) => itemMatchesTopic(i, topicOpt));
      }
    }

    return items;
  }, [rawItems, severity, category, topic]);

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

  const clearFilters = useCallback(() => {
    setSeverity(null);
    setCategory(null);
    setTopic(null);
  }, []);

  const showList = !isLoading && !error && allItems.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header - centered */}
      <div className="border-b border-white/[0.06] px-5 py-3.5 shrink-0">
        <div className="flex flex-col items-center text-center mb-3">
          <h1 className="text-[15px] font-semibold text-zinc-100">
            Live Feed
          </h1>
          {totalCount > 0 && (
            <span className="text-[10px] tabular-nums text-zinc-500 mt-0.5">
              {totalCount.toLocaleString()} signals
            </span>
          )}
        </div>

        {/* Source type pills - centered */}
        <div className="flex flex-col items-center gap-2">
          <div
            className="flex flex-wrap justify-center gap-1.5"
            data-walkthrough="feed-type-pills"
          >
            {FEED_TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => updateType(t)}
                className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all duration-150 active:scale-[0.98] ${
                  type === t
                    ? 'bg-white/[0.1] text-zinc-100'
                    : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200'
                }`}
              >
                {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltersOpen(!filtersOpen)}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors border ${
                  filtersOpen || activeFilterCount > 0
                    ? 'bg-accent/10 text-accent border-accent/20'
                    : 'bg-white/[0.04] text-zinc-400 border-transparent hover:bg-white/[0.08] hover:text-zinc-200'
                }`}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-accent text-[8px] font-bold text-black">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <span className="text-[10px] text-zinc-500">
                Press ? for shortcuts
              </span>
            </div>
        </div>

        {/* Expandable filter panel */}
        {filtersOpen && (
          <div className="mt-3 space-y-2.5 animate-fade-in">
            {/* Severity */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                  Severity
                </span>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-[9px] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {SEVERITY_OPTIONS.map((s) => (
                  <FilterPill
                    key={s.value}
                    label={s.label}
                    active={severity === s.value}
                    onClick={() => setSeverity(severity === s.value ? null : s.value)}
                    className={severity === s.value ? s.color + ' border-current/20' : undefined}
                  />
                ))}
              </div>
            </div>

            {/* Categories */}
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                Category
              </span>
              <div className="flex flex-wrap gap-1">
                {CATEGORY_OPTIONS.map((c) => (
                  <FilterPill
                    key={c}
                    label={c}
                    active={category === c}
                    onClick={() => setCategory(category === c ? null : c)}
                  />
                ))}
              </div>
            </div>

            {/* Topics */}
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1">
                Topic
              </span>
              <div className="flex flex-wrap gap-1">
                {TOPIC_OPTIONS.map((t) => (
                  <FilterPill
                    key={t.slug}
                    label={t.label}
                    active={topic === t.slug}
                    onClick={() => setTopic(topic === t.slug ? null : t.slug)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active filter chips (shown when panel is closed) */}
      {!filtersOpen && activeFilterCount > 0 && (
        <div className="flex items-center gap-1.5 px-5 py-2 border-b border-white/[0.06] shrink-0 animate-fade-in">
          <span className="text-[9px] text-zinc-500 shrink-0">Active:</span>
          {severity && (
            <button
              onClick={() => setSeverity(null)}
              className="flex items-center gap-1 rounded-md bg-white/[0.08] px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-white/[0.12] transition-colors"
            >
              {SEVERITY_OPTIONS.find((s) => s.value === severity)?.label}
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {category && (
            <button
              onClick={() => setCategory(null)}
              className="flex items-center gap-1 rounded-md bg-white/[0.08] px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-white/[0.12] transition-colors"
            >
              {category}
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          {topic && (
            <button
              onClick={() => setTopic(null)}
              className="flex items-center gap-1 rounded-md bg-white/[0.08] px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-white/[0.12] transition-colors"
            >
              {TOPIC_OPTIONS.find((t) => t.slug === topic)?.label}
              <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            onClick={clearFilters}
            className="ml-auto text-[9px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col" data-walkthrough="feed-content">
      {!showList && (
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4">
              <QueryErrorBanner
                message={`Error loading feed: ${String(error)}`}
                onRetry={() => refetch()}
              />
            </div>
          )}
          {isLoading && <FeedListSkeleton />}
          {!isLoading && !error && allItems.length === 0 && (
            <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] py-16 text-center">
              <p className="text-zinc-300 text-[12px]">No signals found</p>
              <p className="mt-1 text-[10px] text-zinc-500">
                {activeFilterCount > 0
                  ? 'Try adjusting your filters.'
                  : 'Try adjusting filters or check back later.'}
              </p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 rounded-lg bg-white/[0.06] px-3 py-1.5 text-[11px] text-zinc-300 hover:bg-white/[0.1] transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {showList && (
        <div className="flex-1 min-h-0 flex flex-col p-4 pb-0">
          {activeFilterCount > 0 && (
            <div className="mb-2 text-[10px] text-zinc-500 shrink-0">
              Showing {allItems.length} of {rawItems.length} signals
            </div>
          )}
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
            <div className="flex justify-center pt-4 pb-2 shrink-0">
              <button
                type="button"
                onClick={() => fetchNextPage()}
                disabled={isFetching}
                className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-white/[0.08] active:scale-[0.98] disabled:opacity-50 transition-all duration-150"
              >
                {isFetching ? 'Loading...' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}
      </div>

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
