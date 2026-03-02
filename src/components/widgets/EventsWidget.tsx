'use client';

import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import { fetchEvents } from '@/lib/api/events';
import type { EventData } from '@/lib/api/types';
import { formatVolume, formatProbability } from '@/lib/utils';

const CompactEvent = memo(function CompactEvent({
  event,
  onClick,
}: {
  event: EventData;
  onClick: () => void;
}) {
  const top = event.markets?.[0];
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 border-b border-white/[0.06] hover:bg-white/[0.06] transition-colors"
    >
      <div className="flex items-start gap-2">
        {event.image && (
          <img
            src={event.image}
            alt=""
            className="h-7 w-7 rounded object-cover shrink-0 mt-0.5"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-zinc-200 leading-snug line-clamp-2">
            {event.title}
          </p>
          <div className="mt-0.5 flex items-center gap-2 text-[10px]">
            {top && (
              <span className="text-accent font-mono">
                {formatProbability(top.yes_probability)}
              </span>
            )}
            {event.volume > 0 && (
              <span className="text-zinc-400">
                {formatVolume(event.volume)}
              </span>
            )}
            <span className="text-zinc-500">
              {event.markets?.length ?? 0} mkt
              {(event.markets?.length ?? 0) !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
});

export function EventsWidget({
  onSelectEvent,
}: {
  onSelectEvent?: (event: EventData) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['events', 'widget', 'all'],
    queryFn: () => fetchEvents('all'),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-px p-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse rounded bg-white/[0.02]"
            style={{ animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
    );
  }

  const events = data ?? [];
  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-zinc-500">
        No events
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="flex flex-col">
        {events.map((ev) => (
          <CompactEvent
            key={ev.id}
            event={ev}
            onClick={() => onSelectEvent?.(ev)}
          />
        ))}
      </div>
    </div>
  );
}
