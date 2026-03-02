'use client';

import { memo } from 'react';
import type { FeedItem, RelatedMarket, MoverEntry } from '@/lib/api/types';
import {
  getFeedSourceType,
  getFeedBody,
  getFeedTitle,
  getFeedSourceLabel,
  formatTimeAgo,
  getCountryFlag,
  formatVolume,
} from '@/lib/utils';
import { SOURCE_STYLES } from '@/lib/constants';
import { Sparkline } from './Sparkline';

const impactStyles: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/20' },
  high: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/15' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/15' },
  low: { bg: 'bg-zinc-500/10', text: 'text-zinc-400', border: 'border-zinc-500/15' },
};

function formatPrice(p: number): string {
  return `${Math.round(p * 100)}\u00A2`;
}

function formatPctChange(change: number): string {
  const pct = change * 100;
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(1)}%`;
}

function formatTimestamp(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function PriceTimeline({ market }: { market: RelatedMarket }) {
  const detected = market.detected_yes_price;
  const peak = market.highest_yes_price;
  const now = market.yes_probability;
  const hasTimeline = detected > 0 && peak > 0;

  if (!hasTimeline) return null;

  return (
    <div className="flex items-center gap-3 text-[10px]">
      <div className="flex flex-col items-center">
        <span className="text-zinc-500">Detected</span>
        <span className="font-mono text-zinc-300">{formatPrice(detected)}</span>
        {market.detected_at > 0 && (
          <span className="text-[8px] text-zinc-600">{formatTimestamp(market.detected_at)}</span>
        )}
      </div>
      <div className="flex-1 flex items-center">
        <div className="h-px flex-1 bg-gradient-to-r from-zinc-700 to-accent/30" />
        <svg className="h-2.5 w-2.5 text-zinc-600 shrink-0" viewBox="0 0 8 8">
          <path d="M2 0L6 4L2 8" fill="currentColor" />
        </svg>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-zinc-500">Peak</span>
        <span className="font-mono text-accent">{formatPrice(peak)}</span>
        {market.peaked_at && market.peaked_at > 0 && (
          <span className="text-[8px] text-zinc-600">{formatTimestamp(market.peaked_at)}</span>
        )}
      </div>
      <div className="flex-1 flex items-center">
        <div className="h-px flex-1 bg-gradient-to-r from-accent/30 to-zinc-700" />
        <svg className="h-2.5 w-2.5 text-zinc-600 shrink-0" viewBox="0 0 8 8">
          <path d="M2 0L6 4L2 8" fill="currentColor" />
        </svg>
      </div>
      <div className="flex flex-col items-center">
        <span className="text-zinc-500">Now</span>
        <span className="font-mono text-zinc-200">{formatPrice(now)}</span>
        <span className="text-[8px] text-zinc-600">live</span>
      </div>
    </div>
  );
}

export const MoverCard = memo(function MoverCard({
  mover,
  onClick,
}: {
  mover: MoverEntry;
  onClick: () => void;
}) {
  const fi = mover.feed_item;
  const sourceType = getFeedSourceType(fi);
  const body = getFeedBody(fi) || '';
  const title = getFeedTitle(fi);
  const sourceLabel = getFeedSourceLabel(fi);
  const s = SOURCE_STYLES[sourceType] ?? SOURCE_STYLES.news;
  const topMarket = fi.related_markets?.[0];

  const priceChange = topMarket?.highest_price_change ?? 0;
  const isPositive = priceChange >= 0;
  const movedSide = topMarket?.moved_side ?? 'YES';
  const impact = impactStyles[topMarket?.impact_level ?? ''] ?? impactStyles.low;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full text-left rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden transition-all hover:border-white/[0.14] hover:bg-white/[0.05] active:scale-[0.998]"
    >
      {/* Top bar: rank + market identity + sparkline */}
      <div className="flex items-start gap-3 px-4 pt-3.5 pb-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-[12px] font-bold text-zinc-200">
          #{mover.rank}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              {topMarket && (
                <p className="text-[12px] font-semibold text-zinc-100 leading-snug line-clamp-2">
                  {topMarket.question || topMarket.event_title}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1">
                {topMarket?.impact_level && (
                  <span className={`rounded px-1.5 py-[1px] text-[9px] font-bold uppercase border ${impact.bg} ${impact.text} ${impact.border}`}>
                    {topMarket.impact_level}
                  </span>
                )}
                <span className={`font-mono text-[12px] font-bold ${isPositive ? 'text-accent' : 'text-red-400'}`}>
                  {formatPctChange(priceChange)}
                </span>
                {movedSide && (
                  <span className="text-[9px] text-zinc-500 uppercase">{movedSide}</span>
                )}
              </div>
            </div>

            {/* Sparkline */}
            {topMarket && topMarket.detected_yes_price > 0 && topMarket.highest_yes_price > 0 && (
              <Sparkline
                detected={topMarket.detected_yes_price}
                peak={topMarket.highest_yes_price}
                now={topMarket.yes_probability}
                positive={isPositive}
                width={110}
                height={38}
              />
            )}
          </div>
        </div>
      </div>

      {/* Price timeline */}
      {topMarket && topMarket.detected_yes_price > 0 && (
        <div className="px-4 pb-2.5">
          <PriceTimeline market={topMarket} />
        </div>
      )}

      {/* Market metrics bar */}
      {topMarket && (
        <div className="flex items-center gap-3 px-4 py-2 border-t border-white/[0.04] text-[10px]">
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">YES</span>
            <span className="font-mono text-accent font-medium">
              {formatPrice(topMarket.yes_probability)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-zinc-500">NO</span>
            <span className="font-mono text-red-400/70 font-medium">
              {formatPrice(topMarket.no_probability)}
            </span>
          </div>
          <span className="text-zinc-600">|</span>
          <span className="text-zinc-400">{formatVolume(topMarket.volume)} vol</span>
          <span className="text-zinc-400">{formatVolume(topMarket.liquidity)} liq</span>
          <span className="text-zinc-500 ml-auto font-mono">
            Spread {(topMarket.yes_spread * 100).toFixed(1)}\u00A2
          </span>
        </div>
      )}

      {/* News/causation layer */}
      <div className="flex items-start gap-2.5 px-4 py-2.5 border-t border-white/[0.04] bg-white/[0.01]">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className={`flex items-center gap-1 text-[9px] font-semibold uppercase ${s.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
              {sourceType}
            </span>
            <span className="text-[9px] text-zinc-500 truncate">{sourceLabel}</span>
            {fi.countries && fi.countries.length > 0 && (
              <span className="text-[10px] shrink-0">
                {fi.countries.slice(0, 3).map(getCountryFlag).join('')}
              </span>
            )}
            <span className="ml-auto text-[9px] text-zinc-600 tabular-nums shrink-0">
              {formatTimeAgo(fi.timestamp)}
            </span>
          </div>

          {/* Causation label if available */}
          {topMarket?.causation_label && (
            <p className="text-[10px] font-medium text-amber-400/80 mb-0.5">
              {topMarket.causation_label}
            </p>
          )}

          {/* News headline / body */}
          {title && title !== body && (
            <p className="text-[11px] font-medium text-zinc-200 leading-snug line-clamp-1 mb-0.5">
              {title}
            </p>
          )}
          <p className="text-[10px] text-zinc-400 leading-snug line-clamp-2">
            {body}
          </p>

          {/* Causation reason */}
          {topMarket?.causation_reason && (
            <p className="mt-1 text-[9px] text-zinc-500 italic line-clamp-1">
              {topMarket.causation_reason}
            </p>
          )}
        </div>

        {topMarket?.image && (
          <img
            src={topMarket.image}
            alt=""
            className="h-12 w-12 rounded-lg object-cover shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
          />
        )}
      </div>
    </button>
  );
});
