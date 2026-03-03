'use client';

import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchFlights, fetchCountryFeed } from '@/lib/api/flights';
import { fetchFeed } from '@/lib/api/feed';
import type { CountryFeedData, FeedItem, FlightData } from '@/lib/api/types';
import { getFeedBody } from '@/lib/utils';
import { detectCountriesFromText } from '@/lib/detect-country';
import { GlintGlobe } from '@/components/GlintGlobe';
import { GlobeSidePanel } from '@/components/GlobeSidePanel';
import { CameraFeedGrid } from '@/components/CameraFeed';

/** Derive country mentions from feed items (fallback when countryFeed API is empty) */
function aggregateCountriesFromFeed(items: FeedItem[]): CountryFeedData[] {
  const byCountry = new Map<string, { count: number; recent: FeedItem[] }>();
  for (const item of items) {
    const body = getFeedBody(item) || '';
    const fromFields = item.countries ?? (item.country ? [item.country] : []);
    const fromText = detectCountriesFromText(body);
    const countries = [...new Set([...fromFields, ...fromText])].map((c) => (c ?? '').trim()).filter(Boolean);
    for (const c of countries) {
      const prev = byCountry.get(c);
      if (!prev) byCountry.set(c, { count: 1, recent: [item] });
      else {
        prev.count += 1;
        prev.recent = [item, ...prev.recent.slice(0, 4)];
      }
    }
  }
  return Array.from(byCountry.entries()).map(([country, { count, recent }]) => ({
    country,
    count,
    recent,
  }));
}

export default function GlobePage() {
  const [geoJson, setGeoJson] = useState<Record<string, unknown> | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<FlightData | null>(null);
  const [camerasOpen, setCamerasOpen] = useState(false);

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

  const { data: countryFeedRaw = [] } = useQuery({
    queryKey: ['countryFeed'],
    queryFn: fetchCountryFeed,
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  const { data: feedData } = useQuery({
    queryKey: ['feed', 'globe'],
    queryFn: () => fetchFeed({ page: 1, count: 100 }),
    refetchInterval: 30_000,
    staleTime: 30_000,
  });

  const countryFeed = useMemo(() => {
    const fromApi = Array.isArray(countryFeedRaw) ? countryFeedRaw : [];
    const hasData = fromApi.some((c: any) => (c.count ?? 0) > 0);
    if (hasData) return fromApi;
    const fromFeed = aggregateCountriesFromFeed(feedData?.items ?? []);
    return fromFeed.length > 0 ? fromFeed : fromApi;
  }, [countryFeedRaw, feedData?.items]);

  const handleSelectFlight = useCallback((flight: FlightData) => {
    setSelectedFlight(flight);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className={`flex flex-1 min-h-0 transition-[flex] duration-300 ${camerasOpen ? 'flex-[0.98]' : 'flex-1'}`}>
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
        <GlobeSidePanel
          flights={flights}
          selectedFlight={selectedFlight}
          onSelectFlight={handleSelectFlight}
        />
      </div>

      {/* Bottom camera feed panel - fills remaining space to reduce empty area */}
      <div className={`flex flex-col border-t border-white/[0.06] bg-background ${camerasOpen ? 'flex-1 min-h-0' : 'shrink-0'}`}>
        <button
          type="button"
          onClick={() => setCamerasOpen(!camerasOpen)}
          className="flex shrink-0 items-center justify-center gap-2 px-4 py-2 text-[11px] font-semibold text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] transition-all duration-150 active:scale-[0.99]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          {camerasOpen ? 'Hide' : 'Show'} Cameras
        </button>
        {camerasOpen && (
          <div className="flex-1 min-h-0 overflow-hidden animate-fade-in flex flex-col">
            <CameraFeedGrid streamId="all" fill />
          </div>
        )}
      </div>
    </div>
  );
}
