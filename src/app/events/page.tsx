'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import { getPreference, setPreference } from '@/lib/preferences';
import {
  fetchEvents,
  CATEGORIES,
  type EventCategory,
} from '@/lib/api/events';
import type { EventData } from '@/lib/api/types';
import { EventCard } from '@/components/EventCard';
import { EventDetailDrawer } from '@/components/EventDetailDrawer';
import { EventListSkeleton } from '@/components/LoadingSkeleton';
import { QueryErrorBanner } from '@/components/QueryErrorBanner';

function EventsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const category: EventCategory =
    categoryParam &&
    (CATEGORIES as readonly string[]).includes(categoryParam)
      ? (categoryParam as EventCategory)
      : 'all';

  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['events', category],
    queryFn: () => fetchEvents(category),
  });

  const updateCategory = useCallback(
    (newCat: EventCategory) => {
      setPreference('eventsCategory', newCat);
      const params = new URLSearchParams(searchParams.toString());
      if (newCat === 'all') params.delete('category');
      else params.set('category', newCat);
      const qs = params.toString();
      router.push(qs ? `/events?${qs}` : '/events');
    },
    [router, searchParams],
  );

  const events = data ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/[0.06] px-5 py-3.5 shrink-0">
        <h1 className="mb-2.5 text-[15px] font-semibold text-zinc-100">
          Events
        </h1>
        <div className="flex flex-wrap gap-1 overflow-x-auto pb-0.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => updateCategory(c)}
              className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-colors ${
                category === c
                  ? 'bg-white/[0.1] text-zinc-100'
                  : 'bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200'
              }`}
            >
              {c === 'all'
                ? 'All'
                : c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {error && (
          <QueryErrorBanner
            message={`Error loading events: ${String(error)}`}
            onRetry={() => refetch()}
          />
        )}

        {isLoading && <EventListSkeleton />}

        {!isLoading && !error && events.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] py-16 text-center">
            <p className="text-zinc-300 text-[12px]">No events found</p>
            <p className="mt-1 text-[10px] text-zinc-500">
              Try a different category.
            </p>
          </div>
        )}

        {!isLoading && !error && events.length > 0 && (
          <div className="flex flex-col gap-1.5 stagger-list">
            {events.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onClick={() => setSelectedEvent(event)}
              />
            ))}
          </div>
        )}
      </div>

      <EventDetailDrawer
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-4 text-[11px] text-zinc-500">
          Loading events...
        </div>
      }
    >
      <EventsContent />
    </Suspense>
  );
}
