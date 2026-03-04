'use client';

import { memo } from 'react';
import type { FeedItem } from '@/lib/api/types';
import {
  getFeedSourceType,
  getFeedBody,
  getFeedTitle,
  getFeedSourceLabel,
  formatTimeAgo,
  getFeedTimestamp,
} from '@/lib/utils';
import { SOURCE_DOT } from '@/lib/constants';

const GlobeFeedItem = memo(function GlobeFeedItem({
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
      type="button"
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 border-b border-white/[0.06] hover:bg-white/[0.06] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-inset"
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
          {formatTimeAgo(getFeedTimestamp(item))}
        </span>
      </div>
      <p className="text-[11px] text-zinc-200 leading-snug line-clamp-2 mt-0.5">
        {displayText}
      </p>
      {item.related_markets && item.related_markets.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {item.related_markets.slice(0, 3).map((m) => (
            <span
              key={m.id}
              className="rounded bg-white/[0.06] px-2 py-0.5 text-[9px] text-zinc-400 truncate max-w-[140px]"
              title={m.question || m.event_title}
            >
              {Math.round(m.yes_probability * 100)}% {m.question || m.event_title?.slice(0, 30)}
            </span>
          ))}
          {item.related_markets.length > 3 && (
            <span className="text-[9px] text-zinc-500">+{item.related_markets.length - 3}</span>
          )}
        </div>
      )}
    </button>
  );
});

export function GlobeCountryFeedPanel({
  country,
  count,
  recent,
  onSelectItem,
  onClose,
}: {
  country: string;
  count: number;
  recent: FeedItem[];
  onSelectItem: (item: FeedItem) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex h-full flex-col border-l border-white/[0.06] bg-background w-64 sm:w-72 shrink-0">
      <div className="shrink-0 flex items-center justify-between border-b border-white/[0.06] px-4 py-2.5">
        <div>
          <h3 className="text-[12px] font-semibold text-zinc-100">{country}</h3>
          <p className="text-[10px] text-zinc-500">{count} signal{count !== 1 ? 's' : ''}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded p-1 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        <p className="px-3 py-2 text-[10px] text-zinc-500">
          Click a post to view full detail and related markets
        </p>
        {recent.map((item) => (
          <GlobeFeedItem key={item.id} item={item} onClick={() => onSelectItem(item)} />
        ))}
      </div>
    </div>
  );
}
