'use client';

import { useQuery } from '@tanstack/react-query';
import { memo, useMemo } from 'react';
import { fetchFlights } from '@/lib/api/flights';
import type { FlightData } from '@/lib/api/types';
import { CAT_COLORS } from '@/lib/constants';

const CompactFlight = memo(function CompactFlight({
  flight,
}: {
  flight: FlightData;
}) {
  const color = CAT_COLORS[flight.category] ?? CAT_COLORS.Other;
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/[0.06] hover:bg-white/[0.06] transition-colors">
      <span
        className="h-1.5 w-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[11px] text-zinc-200 truncate">
            {flight.callsign || flight.hex}
          </span>
          <span className="text-[10px] text-zinc-500 truncate">
            {flight.aircraft}
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="text-zinc-400 truncate">{flight.location}</span>
          <span className="ml-auto text-zinc-500 font-mono shrink-0">
            {flight.altitude.feet.toLocaleString()} ft
          </span>
        </div>
      </div>
    </div>
  );
});

export function FlightGlobeWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['flights', 'widget'],
    queryFn: () => fetchFlights(30),
    refetchInterval: 8_000,
    staleTime: 8_000,
  });

  const flights = useMemo(
    () => [...(data ?? [])].sort((a, b) => b.timestamp - a.timestamp),
    [data],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-px p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-[52px] animate-pulse rounded bg-white/[0.03]"
            style={{ animationDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-[11px] text-zinc-500">
        No flights
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="flex flex-col">
        {flights.map((f) => (
          <CompactFlight key={f.id} flight={f} />
        ))}
      </div>
    </div>
  );
}
