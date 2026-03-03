'use client';

import type { FlightData } from '@/lib/api/types';
import { FlightsPanel } from './FlightsPanel';

export function GlobeSidePanel({
  flights,
  selectedFlight,
  onSelectFlight,
}: {
  flights: FlightData[];
  selectedFlight: FlightData | null;
  onSelectFlight: (flight: FlightData) => void;
}) {
  return (
    <div className="flex h-full w-64 sm:w-72 shrink-0 flex-col border-l border-white/[0.06] bg-background">
      <FlightsPanel
        flights={flights}
        selectedFlight={selectedFlight}
        onSelectFlight={onSelectFlight}
        embedded
      />
    </div>
  );
}
