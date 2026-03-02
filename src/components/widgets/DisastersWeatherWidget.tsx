'use client';

import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import { fetchBootstrapEarthquakes, fetchWeatherAlerts, fetchGDACSEvents } from '@/lib/api/intel';
import type { Earthquake, WeatherAlert } from '@/lib/api/intel-types';
import type { GDACSFeature } from '@/lib/api/intel-types';

const CompactEarthquake = memo(function CompactEarthquake({ e }: { e: Earthquake }) {
  const mag = e.magnitude ?? 0;
  const severe = mag >= 6;
  return (
    <a
      href={e.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06] hover:bg-white/[0.06] transition-colors"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-zinc-200 truncate">{e.place ?? 'Unknown'}</p>
        <p className="text-[9px] text-zinc-500">{e.occurredAt ?? ''}</p>
      </div>
      <span className={`shrink-0 text-[11px] font-bold font-mono ${severe ? 'text-red-400' : 'text-amber-400'}`}>
        M{mag.toFixed(1)}
      </span>
    </a>
  );
});

const CompactWeather = memo(function CompactWeather({ a }: { a: WeatherAlert }) {
  const p = a.properties ?? {};
  const severity = (p.severity ?? '').toLowerCase();
  const isExtreme = severity.includes('extreme') || severity.includes('severe');
  return (
    <div className="px-3 py-1.5 border-b border-white/[0.06]">
      <p className="text-[10px] font-bold text-zinc-400">{p.areaDesc ?? 'Alert'}</p>
      <p className="text-[11px] text-zinc-200 line-clamp-1">{p.headline ?? p.event ?? p.description ?? ''}</p>
      {isExtreme && <span className="inline-block mt-1 text-[9px] font-bold text-red-400 uppercase">Severe</span>}
    </div>
  );
});

const CompactGDACS = memo(function CompactGDACS({ f }: { f: GDACSFeature }) {
  const p = f.properties ?? {};
  const name = p.name ?? p.description ?? p.eventname ?? p.eventtype ?? 'Event';
  const severity = p.severitydata?.severitytext;
  const country = p.country;
  return (
    <a
      href={p.eventtype && p.eventid ? `https://www.gdacs.org/report.aspx?eventid=${p.eventid}&episodeid=${p.episodeid}&eventtype=${p.eventtype}` : undefined}
      target="_blank"
      rel="noopener noreferrer"
      className="block px-3 py-1.5 border-b border-white/[0.06] hover:bg-white/[0.06] transition-colors"
    >
      <p className="text-[11px] text-zinc-200 truncate">{name}</p>
      <p className="text-[9px] text-zinc-500">
        {[p.alertlevel, country, severity].filter(Boolean).join(' • ')}
      </p>
    </a>
  );
});

export function DisastersWeatherWidget() {
  const { data: earthquakes } = useQuery({
    queryKey: ['intel', 'earthquakes'],
    queryFn: fetchBootstrapEarthquakes,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
  const { data: weather } = useQuery({
    queryKey: ['intel', 'weather'],
    queryFn: fetchWeatherAlerts,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });
  const { data: gdacs } = useQuery({
    queryKey: ['intel', 'gdacs'],
    queryFn: fetchGDACSEvents,
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const eqList = earthquakes ?? [];
  const weatherList = weather ?? [];
  const gdacsList = gdacs ?? [];

  const loading = !earthquakes && !weather && !gdacs;
  const empty = eqList.length === 0 && weatherList.length === 0 && gdacsList.length === 0;

  if (loading) {
    return (
      <div className="flex flex-col p-2 gap-px">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[44px] animate-pulse rounded bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="flex items-center justify-center h-full p-3 text-[11px] text-zinc-500">
        GDACS, earthquakes, weather
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      {eqList.length > 0 && (
        <div className="border-b border-white/[0.08]">
          <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">Earthquakes</p>
          {eqList.slice(0, 4).map((e, i) => (
            <CompactEarthquake key={e.id ?? i} e={e} />
          ))}
        </div>
      )}
      {weatherList.length > 0 && (
        <div className="border-b border-white/[0.08]">
          <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">Weather Alerts</p>
          {weatherList.slice(0, 3).map((a, i) => (
            <CompactWeather key={a.id ?? i} a={a} />
          ))}
        </div>
      )}
      {gdacsList.length > 0 && (
        <div>
          <p className="px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">GDACS</p>
          {gdacsList.slice(0, 4).map((f, i) => (
            <CompactGDACS key={`gdacs-${i}`} f={f} />
          ))}
        </div>
      )}
    </div>
  );
}
