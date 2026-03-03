'use client';

import { useEffect } from 'react';
import type { FeedItem } from '@/lib/api/types';
import {
  getFeedSourceType,
  getFeedBody,
  getFeedTitle,
  getFeedSourceLabel,
  getFeedLink,
  formatTimeAgo,
  getCountryFlag,
  formatProbability,
  formatVolume,
} from '@/lib/utils';
import { SOURCE_STYLES } from '@/lib/constants';

export function FeedDetailDrawer({
  item,
  onClose,
}: {
  item: FeedItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!item) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [item, onClose]);

  if (!item) return null;

  const sourceType = getFeedSourceType(item);
  const title = getFeedTitle(item);
  const body = getFeedBody(item) || '';
  const sourceLabel = getFeedSourceLabel(item);
  const link = getFeedLink(item);
  const topMarket = item.related_markets?.[0];
  const s = SOURCE_STYLES[sourceType] ?? SOURCE_STYLES.news;
  const showTitle = title && title !== body;

  const sourceSection = (() => {
    if (item.tweet) {
      return {
        label: 'Tweet',
        sub: `@${item.tweet.user?.handle ?? 'unknown'}`,
        linkText: 'View on X',
        link: item.tweet.link ?? link,
      };
    }
    if (item.news) {
      return {
        label: 'News',
        sub: item.news.source ?? 'Unknown',
        linkText: 'Read article',
        link: item.news.url,
      };
    }
    if (item.telegram) {
      return {
        label: 'Telegram',
        sub: item.telegram.channel ?? 'Unknown channel',
        linkText: 'Open in Telegram',
        link: item.telegram.link,
      };
    }
    return { label: 'Source', sub: sourceLabel, linkText: 'View source', link };
  })();

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-white/[0.06] bg-surface shadow-2xl animate-slide-in">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 shrink-0">
          <div className="flex items-center gap-2.5">
            {item.tweet?.user.pfp ? (
              <img
                src={item.tweet.user.pfp}
                alt=""
                className="h-6 w-6 rounded-full ring-1 ring-white/[0.08] shrink-0"
              />
            ) : (
              <div
                className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold ${s.text} bg-white/[0.06]`}
              >
                {sourceType === 'tweet' ? '𝕏' : sourceType === 'telegram' ? 'TG' : '◇'}
              </div>
            )}
            <div className="min-w-0">
              <span className={`text-[11px] font-semibold ${s.text}`}>
                {sourceSection.label.toUpperCase()}
              </span>
              <span className="ml-2 text-[10px] text-zinc-400 truncate block">
                {sourceSection.sub}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500 tabular-nums">
              {formatTimeAgo(item.timestamp)}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="rounded p-1 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors"
              aria-label="Close"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-white/[0.06] px-4 py-3">
            <div className="mb-3 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Source</span>
              <p className="text-[12px] font-medium text-zinc-200 mt-0.5">
                {sourceSection.label} from {sourceSection.sub}
              </p>
              {sourceSection.link && (
                <a
                  href={sourceSection.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-accent hover:text-accent/80"
                >
                  {sourceSection.linkText}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
            {item.countries && item.countries.length > 0 && (
              <div className="mb-2 flex items-center gap-1.5 text-[11px]">
                {item.countries.map((c) => (
                  <span key={c}>{getCountryFlag(c)}</span>
                ))}
                <span className="text-zinc-400">
                  {item.countries.join(', ')}
                </span>
              </div>
            )}
            {showTitle && (
              <h2 className="text-[14px] font-semibold text-zinc-100 leading-snug mb-2">
                {title}
              </h2>
            )}
            {body ? (
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-zinc-100">
                {body}
              </p>
            ) : (
              <p className="text-[12px] text-zinc-500 italic">
                No additional content available.
              </p>
            )}
            {sourceSection.link && (
              <a
                href={sourceSection.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-[11px] text-accent hover:text-accent/80"
              >
                {sourceSection.linkText}
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>

          {item.related_markets && item.related_markets.length > 0 && (
            <div className="px-4 py-4">
              <h4 className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Related Markets ({item.related_markets.length})
              </h4>
              <div className="flex flex-col gap-2">
                {item.related_markets.map((m) => (
                  <a
                    key={m.id}
                    href={`https://polymarket.com/event/${m.event_slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 transition-all hover:border-white/[0.14] hover:bg-white/[0.05]"
                  >
                    <div className="flex items-start gap-2.5">
                      {m.image && (
                        <img
                          src={m.image}
                          alt=""
                          className="h-8 w-8 rounded object-cover shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-medium text-zinc-100 leading-snug">
                          {m.question || m.event_title}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2.5 text-[10px]">
                          <span className="font-mono font-semibold text-accent">
                            {formatProbability(m.yes_probability)} Yes
                          </span>
                          <span className="font-mono text-red-400/70">
                            {formatProbability(m.no_probability)} No
                          </span>
                          <span className="text-zinc-400">
                            {formatVolume(m.volume)}
                          </span>
                        </div>
                        {m.impact_level && (
                          <div className="mt-1 flex items-center gap-1.5 text-[10px]">
                            <span
                              className={`font-semibold uppercase ${
                                m.impact_level === 'high'
                                  ? 'text-red-400'
                                  : m.impact_level === 'medium'
                                    ? 'text-amber-400'
                                    : 'text-zinc-500'
                              }`}
                            >
                              {m.impact_level}
                            </span>
                            {m.impact_reason && (
                              <span className="text-zinc-400 truncate">
                                {m.impact_reason}
                              </span>
                            )}
                          </div>
                        )}
                        {m.highest_price_change > 0 && (
                          <div className="mt-0.5 text-[10px] font-mono text-accent/70">
                            +{(m.highest_price_change * 100).toFixed(1)}% price
                            move
                          </div>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {((item.topics && item.topics.length > 0) || (item.categories && item.categories.length > 0)) && (
            <div className="border-t border-white/[0.06] px-4 py-3 space-y-2">
              {item.categories && item.categories.length > 0 && (
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mr-2">Categories</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.categories.map((c) => (
                      <span key={c} className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] text-zinc-300">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {item.topics && item.topics.length > 0 && (
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mr-2">Topics</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.topics.map((t) => (
                      <span key={t} className="rounded bg-accent/10 px-2 py-0.5 text-[10px] text-accent/80">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {topMarket && (
          <div className="border-t border-white/[0.06] px-4 py-3 shrink-0">
            <a
              href={`https://polymarket.com/event/${topMarket.event_slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full rounded-lg bg-accent/10 border border-accent/15 py-2 text-center text-[12px] font-semibold text-accent transition-all hover:bg-accent/20"
            >
              Trade on Polymarket
            </a>
          </div>
        )}
      </div>
    </>
  );
}
