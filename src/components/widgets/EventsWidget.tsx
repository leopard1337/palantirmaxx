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
      className="w-full text-left px-3 py-1.5 border-b border-white/[0.06] hover:bg-white/[0.06] transition-colors"
    >
      <div className="flex items-center gap-1.5">
        {top && (
          <span className="text-[10px] text-accent font-mono font-medium shrink-0">
            {formatProbability(top.yes_probability)}
          </span>
        )}
        {event.volume > 0 && (
          <span className="text-[10px] text-zinc-500">{formatVolume(event.volume)}</span>
        )}
        <span className="text-[10px] text-zinc-600 ml-auto shrink-0">
          {event.markets?.length ?? 0} mkt{(event.markets?.length ?? 0) !== 1 ? 's' : ''}
        </span>
      </div>
      <p className="text-[11px] font-medium text-zinc-200 leading-snug line-clamp-1 mt-0.5">
        {event.title}
      </p>
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
      <div className="flex flex-col p-2 gap-px">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[44px] animate-pulse rounded bg-white/[0.03]" style={{ animationDelay: `${i * 30}ms` }} />
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
          <CompactEvent key={ev.id} event={ev} onClick={() => onSelectEvent?.(ev)} />
        ))}
      </div>
    </div>
  );
}
