'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FlightData, CountryFeedData, FeedItem } from '@/lib/api/types';
import { CAT_COLORS } from '@/lib/constants';
import { formatTimeAgo, getFeedBody, getFeedTimestamp } from '@/lib/utils';
import { getCountryCentroid, buildCentroidMap } from '@/lib/country-centroids';

const Globe = dynamic(() => import('react-globe.gl'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-background">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-accent" />
    </div>
  ),
});

interface FlightPoint {
  id: string;
  lat: number;
  lng: number;
  alt: number;
  radius: number;
  color: string;
  _type: 'flight';
  _src: FlightData;
}

interface MentionPoint {
  id: string;
  lat: number;
  lng: number;
  alt: number;
  radius: number;
  color: string;
  _type: 'mention';
  _src: { country: string; count: number; tweet: string; ts: string; recent: FeedItem[] };
}

const INIT_POV = { lat: 30, lng: 45, altitude: 2.2 };

function TooltipRow({
  label,
  value,
  mono,
  truncate,
}: {
  label: string;
  value: string;
  mono?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-zinc-500 shrink-0">{label}</span>
      <span
        className={`text-zinc-300 ${mono ? 'font-mono' : ''} ${truncate ? 'truncate max-w-[180px] text-right' : ''}`}
      >
        {value}
      </span>
    </div>
  );
}

export const GlintGlobe = memo(function GlintGlobe({
  flights,
  countryFeed,
  geoJson,
  selectedFlight,
  onFlightClick,
  onMentionClick,
}: {
  flights: FlightData[];
  countryFeed: CountryFeedData[];
  geoJson: Record<string, unknown> | null;
  selectedFlight: FlightData | null;
  onFlightClick: (flight: FlightData) => void;
  onMentionClick?: (data: { country: string; count: number; recent: FeedItem[] }) => void;
}) {
  const globeRef = useRef<any>(null);
  const [hovered, setHovered] = useState<FlightData | null>(null);
  const [hoveredMention, setHoveredMention] = useState<MentionPoint['_src'] | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [dims, setDims] = useState({ w: 800, h: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setDims({ w: e.contentRect.width, h: e.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    const t = setTimeout(() => g.pointOfView(INIT_POV, 0), 200);
    return () => clearTimeout(t);
  }, []);

  const activity = useMemo(() => {
    const m = new Map<string, number>();
    const feed = Array.isArray(countryFeed) ? countryFeed : [];
    for (const c of feed) {
      const country = (c as any).country ?? (c as any).country_code ?? (c as any).name ?? '';
      const count = typeof (c as any).count === 'number' ? (c as any).count : 0;
      if (country) m.set(country, count);
    }
    return m;
  }, [countryFeed]);

  const polygons = useMemo(() => {
    const feats = (geoJson as any)?.features;
    if (!feats) return [];
    return feats.filter((f: any) => f.properties?.ISO_A2 !== 'AQ');
  }, [geoJson]);

  const centroidMap = useMemo(() => {
    const feats = (geoJson as any)?.features;
    return feats ? buildCentroidMap(feats) : null;
  }, [geoJson]);

  useEffect(() => {
    if (!selectedFlight || !globeRef.current) return;
    const lat = selectedFlight.position?.lat;
    const lng = selectedFlight.position?.lon;
    if (lat == null || lng == null) return;
    globeRef.current.pointOfView(
      { lat, lng, altitude: 1.5 },
      800,
    );
  }, [selectedFlight]);

  const flightPoints: FlightPoint[] = useMemo(
    () =>
      flights
        .filter((f) => f?.position?.lat != null && f?.position?.lon != null && f?.id)
        .map((f) => {
          const feet = f.altitude?.feet ?? 0;
          const norm = Math.max(0.25, Math.min(1, feet / 35000));
          return {
            id: `flight-${f.id}`,
            lat: f.position.lat,
            lng: f.position.lon,
          alt: norm * 0.018,
          radius: norm * 0.3 + 0.15,
          color: CAT_COLORS[f.category] ?? CAT_COLORS.Other,
          _type: 'flight' as const,
          _src: f,
        };
      }),
    [flights],
  );

  const mentionPoints: MentionPoint[] = useMemo(() => {
    const out: MentionPoint[] = [];
    const feed = Array.isArray(countryFeed) ? countryFeed : [];
    for (const c of feed) {
      const country = (c as any).country ?? (c as any).country_code ?? (c as any).name ?? '';
      const count = typeof (c as any).count === 'number' ? (c as any).count : 0;
      const recent = (c as any).recent ?? (c as any).items ?? (c as any).feed ?? [];
      if (count <= 0 || !country) continue;
      const centroid = getCountryCentroid(country, centroidMap);
      if (!centroid) continue;
      const top = Array.isArray(recent) ? recent[0] : null;
      const body = top ? getFeedBody(top) || '' : '';
      const tweet = body ? body.slice(0, 120) + (body.length > 120 ? '…' : '') : '—';
      const ts = top ? formatTimeAgo(getFeedTimestamp(top)) : '—';
      out.push({
        id: `mention-${String(country).replace(/\W/g, '_')}`,
        lat: centroid[0],
        lng: centroid[1],
        alt: 0.02,
        radius: Math.min(0.5, 0.2 + Math.log10(count + 1) * 0.08),
        color: count > 50 ? '#ff4d4d' : count > 10 ? '#ff7a4d' : '#ffa94d',
        _type: 'mention',
        _src: { country, count, tweet, ts, recent: Array.isArray(recent) ? recent : [] },
      });
    }
    return out;
  }, [countryFeed, centroidMap]);

  const points: (FlightPoint | MentionPoint)[] = useMemo(
    () => [...flightPoints, ...mentionPoints],
    [flightPoints, mentionPoints],
  );

  const capColor = useCallback(
    (feat: any) => {
      const n = activity.get(feat.properties?.ADMIN) ?? activity.get(feat.properties?.ISO_A2) ?? 0;
      if (n > 100) return 'rgba(255,70,40,0.35)';
      if (n > 50) return 'rgba(255,100,50,0.25)';
      if (n > 10) return 'rgba(255,140,80,0.15)';
      if (n > 0) return 'rgba(255,160,100,0.08)';
      return 'rgba(30,30,45,0.4)';
    },
    [activity],
  );

  const sideColor = useCallback(() => 'rgba(20,20,30,0.5)', []);
  const strokeColor = useCallback(() => 'rgba(80,80,100,0.15)', []);
  const polyGeo = useCallback((d: any) => d.geometry, []);
  const noop = useCallback(() => {}, []);

  const onHover = useCallback((pt: any) => {
    if (!pt) {
      setHovered(null);
      setHoveredMention(null);
      return;
    }
    if (pt._type === 'mention') {
      setHovered(null);
      setHoveredMention(pt._src);
      return;
    }
    setHoveredMention(null);
    setHovered(pt._type === 'flight' ? pt._src : null);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setTooltipPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const onClick = useCallback(
    (pt: any) => {
      if (!pt) return;
      if (pt._type === 'flight') {
        onFlightClick(pt._src);
        return;
      }
      if (pt._type === 'mention' && onMentionClick && pt._src?.recent?.length) {
        onMentionClick({
          country: pt._src.country,
          count: pt._src.count,
          recent: pt._src.recent,
        });
      }
    },
    [onFlightClick, onMentionClick],
  );

  return (
    <div ref={containerRef} className="relative h-full w-full bg-background">
      <Globe
        ref={globeRef}
        width={dims.w}
        height={dims.h}
        animateIn={false}
        backgroundColor="rgba(0,0,0,0)"
        showGlobe={true}
        globeImageUrl="https://unpkg.com/three-globe/example/img/earth-night.jpg"
        showAtmosphere={true}
        atmosphereColor="#1a1a3e"
        atmosphereAltitude={0.15}
        polygonsData={polygons}
        polygonGeoJsonGeometry={polyGeo}
        polygonCapColor={capColor}
        polygonSideColor={sideColor}
        polygonStrokeColor={strokeColor}
        polygonAltitude={0.005}
        onPolygonHover={noop}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointAltitude="alt"
        pointRadius="radius"
        pointColor="color"
        pointsMerge={false}
        onPointHover={onHover}
        onPointClick={onClick}
      />

      {hoveredMention && (
        <div
          className="fixed z-[9999] max-w-[360px] rounded-xl border border-zinc-700/40 bg-[rgba(10,10,10,0.92)] p-3 shadow-2xl animate-fade-in pointer-events-none"
          style={{ left: tooltipPos.x + 12, top: tooltipPos.y + 12 }}
        >
          <div className="text-[13px] leading-[1.3] text-zinc-100">
            <div className="font-bold">{hoveredMention.country}</div>
            <div className="mt-1 text-zinc-300 line-clamp-3">{hoveredMention.tweet}</div>
            <div className="mt-1.5 text-[12px] text-zinc-500 opacity-75">
              {hoveredMention.count} mentions · {hoveredMention.ts}
            </div>
          </div>
        </div>
      )}

      {hovered && (hovered.callsign != null || hovered.hex != null) && (
        <div className="absolute bottom-4 left-4 z-30 w-72 rounded-xl border border-zinc-700/40 bg-zinc-900/95 backdrop-blur-md p-3.5 shadow-2xl animate-fade-in pointer-events-none">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-zinc-100 tracking-tight">
              {hovered.callsign || hovered.hex}
            </span>
            <span
              className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
              style={{
                color: CAT_COLORS[hovered.category] ?? '#868e96',
                backgroundColor: `${CAT_COLORS[hovered.category] ?? '#868e96'}18`,
              }}
            >
              {hovered.category}
            </span>
          </div>
          <div className="text-[10px] space-y-1">
            <TooltipRow
              label="Aircraft"
              value={`${hovered.aircraft ?? '—'} (${hovered.registration ?? '—'})`}
            />
            <TooltipRow label="Origin" value={hovered.origin ?? '—'} />
            <TooltipRow label="Location" value={hovered.location ?? '—'} truncate />
            <TooltipRow
              label="Altitude"
              value={`${(hovered.altitude?.feet ?? 0).toLocaleString()} ft`}
              mono
            />
            <TooltipRow
              label="Speed"
              value={`${(hovered.speed?.knots ?? 0).toFixed(0)} kts`}
              mono
            />
            <TooltipRow
              label="Last seen"
              value={formatTimeAgo(hovered.timestamp ?? 0)}
            />
          </div>
        </div>
      )}
    </div>
  );
});
