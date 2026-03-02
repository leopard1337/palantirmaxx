'use client';

import { memo } from 'react';
import type { FeedItem } from '@/lib/api/types';
import {
  getFeedSourceType,
  getFeedBody,
  getFeedTitle,
  getFeedSourceLabel,
  formatTimeAgo,
  getCountryFlag,
} from '@/lib/utils';
import { Card, CardHeader, CardBody, CardFooter } from './ui/Card';
import { SOURCE_STYLES } from '@/lib/constants';

const impactColor: Record<string, string> = {
  critical: 'text-red-500',
  high: 'text-red-400',
  medium: 'text-amber-400',
  low: 'text-zinc-500',
};

export const FeedCard = memo(function FeedCard({
  item,
  onClick,
}: {
  item: FeedItem;
  onClick: () => void;
}) {
  const sourceType = getFeedSourceType(item);
  const title = getFeedTitle(item);
  const body = getFeedBody(item) || '';
  const sourceLabel = getFeedSourceLabel(item);
  const s = SOURCE_STYLES[sourceType] ?? SOURCE_STYLES.news;
  const topMarket = item.related_markets?.[0];
  const marketCount = item.related_markets?.length ?? 0;
  const showTitle = title && title !== body;
  const cats = item.categories?.slice(0, 3);
  const topics = item.topics?.slice(0, 2);

  return (
    <Card onClick={onClick} className="w-full">
      <CardHeader>
        <div className="flex items-center gap-1.5 min-w-0">
          {item.tweet?.user.pfp && (
            <img
              src={item.tweet.user.pfp}
              alt=""
              className="h-4 w-4 rounded-full ring-1 ring-white/[0.08] shrink-0"
            />
          )}
          <span
            className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide shrink-0 ${s.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
            {sourceType}
          </span>
          <span className="text-[10px] text-zinc-400 truncate min-w-0">
            {sourceLabel}
          </span>
          {item.countries && item.countries.length > 0 && (
            <span className="text-[11px] shrink-0">
              {item.countries.slice(0, 2).map(getCountryFlag).join('')}
            </span>
          )}
          <span className="text-[10px] text-zinc-500 tabular-nums shrink-0 ml-auto">
            {formatTimeAgo(item.timestamp)}
          </span>
        </div>
      </CardHeader>

      <CardBody>
        {showTitle && (
          <p className="text-[12px] font-medium leading-snug text-zinc-100 line-clamp-2 mb-0.5">
            {title}
          </p>
        )}
        <p className="text-[12px] leading-[1.55] text-zinc-200 line-clamp-3">
          {body}
        </p>
        {(cats?.length || topics?.length) && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {cats?.map((c) => (
              <span
                key={c}
                className="rounded bg-white/[0.06] px-1.5 py-[1px] text-[9px] text-zinc-400"
              >
                {c}
              </span>
            ))}
            {topics?.map((t) => (
              <span
                key={t}
                className="rounded bg-accent/10 px-1.5 py-[1px] text-[9px] text-accent/70"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </CardBody>

      {(marketCount > 0 || topMarket?.impact_level) && (
        <CardFooter>
          <div className="flex items-center gap-2.5 text-[10px]">
            {topMarket?.impact_level && (
              <span
                className={`font-bold uppercase ${impactColor[topMarket.impact_level] ?? 'text-zinc-500'}`}
              >
                {topMarket.impact_level}
              </span>
            )}
            {topMarket && (
              <span className="font-mono text-accent font-medium">
                {Math.round(topMarket.yes_probability * 100)}%
              </span>
            )}
            {marketCount > 0 && (
              <span className="text-zinc-500">
                {marketCount} mkt{marketCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </CardFooter>
      )}
    </Card>
  );
});
