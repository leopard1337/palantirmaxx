'use client';

import { memo } from 'react';
import Image from 'next/image';
import type { EventData } from '@/lib/api/types';
import { formatVolume, formatProbability } from '@/lib/utils';
import { Card, CardHeader, CardBody, CardFooter } from './ui/Card';

export const EventCard = memo(function EventCard({
  event,
  onClick,
}: {
  event: EventData;
  onClick: () => void;
}) {
  const topMarket = event.markets?.[0];
  const marketCount = event.markets?.length ?? 0;

  return (
    <Card onClick={onClick} className="w-full">
      <CardHeader>
        <div className="flex items-start gap-2.5 min-w-0">
          {event.image && (
            <Image
              src={event.image}
              alt=""
              width={36}
              height={36}
              className="h-9 w-9 rounded-lg object-cover shrink-0 ring-1 ring-white/[0.08]"
              unoptimized={event.image.startsWith('data:')}
            />
          )}
          <h3 className="text-[12px] font-medium text-zinc-100 leading-snug line-clamp-2 flex-1 min-w-0">
            {event.title}
          </h3>
        </div>
      </CardHeader>

      <CardBody>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
          {event.volume > 0 && (
            <span className="text-zinc-300">
              {formatVolume(event.volume)}{' '}
              <span className="text-zinc-500">vol</span>
            </span>
          )}
          {event.liquidity > 0 && (
            <span className="text-zinc-300">
              {formatVolume(event.liquidity)}{' '}
              <span className="text-zinc-500">liq</span>
            </span>
          )}
          {marketCount > 0 && (
            <span className="text-zinc-400">
              {marketCount} mkt{marketCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </CardBody>

      {topMarket && (
        <CardFooter>
          <div className="flex items-center gap-2.5 text-[10px]">
            <span className="font-mono font-semibold text-accent">
              {formatProbability(topMarket.yes_probability)}
            </span>
            <span className="font-mono text-red-400/70">
              {formatProbability(topMarket.no_probability)}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden ml-1">
              <div
                className="h-full bg-accent/30 rounded-full"
                style={{
                  width: `${Math.round(topMarket.yes_probability * 100)}%`,
                }}
              />
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
});
