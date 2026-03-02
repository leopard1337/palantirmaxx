'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { fetchFlights, fetchCountryFeed } from '@/lib/api/flights';
import type { FlightData } from '@/lib/api/types';
import { GlintGlobe } from '@/components/GlintGlobe';
import { FlightsPanel } from '@/components/FlightsPanel';

export default function GlobePage() {
  const [geoJson, setGeoJson] = useState<Record<string, unknown> | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);

  useEffect(() => {
    fetch('/data/countries.geojson')
      .then((r) => r.json())
      .then(setGeoJson)
      .catch((err) => console.error('GeoJSON load failed:', err));
  }, []);

  const { data: flights = [] } = useQuery({
    queryKey: ['flights'],
    queryFn: () => fetchFlights(50),
    refetchInterval: 8_000,
    staleTime: 8_000,
  });

  const { data: countryFeed = [] } = useQuery({
    queryKey: ['countryFeed'],
    queryFn: fetchCountryFeed,
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const handleSelectFlight = useCallback((flight: FlightData) => {
    setSelectedFlight(flight);
  }, []);

  return (
    <div className="flex h-full">
      <div className="flex-1 relative min-h-0">
        {!geoJson && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-accent" />
              <span className="text-[10px] text-zinc-600">
                Loading globe data...
              </span>
            </div>
          </div>
        )}
        <GlintGlobe
          flights={flights}
          countryFeed={countryFeed}
          geoJson={geoJson}
          selectedFlight={selectedFlight}
          onFlightClick={handleSelectFlight}
        />
      </div>
      <FlightsPanel
        flights={flights}
        selectedFlight={selectedFlight}
        onSelectFlight={handleSelectFlight}
      />
    </div>
  );
}
