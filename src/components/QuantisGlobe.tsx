'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { FlightData, CountryFeedData, FeedItem } from '@/lib/api/types';
import type { ISSData } from '@/lib/api/intel';
import { CAT_COLORS } from '@/lib/constants';
import { formatTimeAgo, getFeedBody, getFeedTimestamp } from '@/lib/utils';
import { getCountryCentroid, buildCentroidMap } from '@/lib/country-centroids';

const PLANE_SIZE = 8;
const PLANE_GLOW_SIZE = 12;

/* Soft glow texture for plane halo */
let sharedPlaneTexture: THREE.CanvasTexture | null = null;
let sharedGlowTexture: THREE.CanvasTexture | null = null;

function getPlaneTexture(): THREE.CanvasTexture {
  if (sharedPlaneTexture) return sharedPlaneTexture;
  const canvas = document.createElement('canvas');
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const s = size / 36;
  const cx = 18 * s;
  const cy = 18 * s;
  ctx.clearRect(0, 0, size, size);
  /* Top-down plane: fuselage (arrow) + wings */
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.beginPath();
  /* Nose */
  ctx.moveTo(cx + 14 * s, cy);
  /* Right wing */
  ctx.lineTo(cx + 6 * s, cy - 10 * s);
  ctx.lineTo(cx + 2 * s, cy - 6 * s);
  /* Tail */
  ctx.lineTo(cx - 12 * s, cy);
  /* Left side */
  ctx.lineTo(cx + 2 * s, cy + 6 * s);
  ctx.lineTo(cx + 6 * s, cy + 10 * s);
  ctx.closePath();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 3;
  ctx.fill();
  ctx.shadowBlur = 0;
  sharedPlaneTexture = new THREE.CanvasTexture(canvas);
  sharedPlaneTexture.needsUpdate = true;
  return sharedPlaneTexture;
}

function getGlowTexture(): THREE.CanvasTexture {
  if (sharedGlowTexture) return sharedGlowTexture;
  const canvas = document.createElement('canvas');
  const size = 64;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, 'rgba(255,255,255,0.25)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.08)');
  gradient.addColorStop(0.7, 'rgba(255,255,255,0.02)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  sharedGlowTexture = new THREE.CanvasTexture(canvas);
  sharedGlowTexture.needsUpdate = true;
  return sharedGlowTexture;
}

const ISS_SIZE = 36;
const ISS_GLOW_SIZE = 52;
const ISS_COLOR = '#00f0ff';

let sharedISSTexture: THREE.CanvasTexture | null = null;
let sharedISSGlowTexture: THREE.CanvasTexture | null = null;

function getISSTexture(): THREE.CanvasTexture {
  if (sharedISSTexture) return sharedISSTexture;
  const canvas = document.createElement('canvas');
  const size = 96;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;
  ctx.clearRect(0, 0, size, size);
  /* Space station: central module + solar wings - crisp, high contrast */
  ctx.fillStyle = 'rgba(255,255,255,1)';
  ctx.beginPath();
  ctx.ellipse(cx, cy, 14, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(cx - 3, cy - 22, 6, 44);
  ctx.fillRect(cx - 26, cy - 5, 52, 10);
  sharedISSTexture = new THREE.CanvasTexture(canvas);
  sharedISSTexture.needsUpdate = true;
  return sharedISSTexture;
}

function getISSGlowTexture(): THREE.CanvasTexture {
  if (sharedISSGlowTexture) return sharedISSGlowTexture;
  const canvas = document.createElement('canvas');
  const size = 128;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const g = ctx.createRadialGradient(cx, cx, 0, cx, cx, size / 2);
  g.addColorStop(0, 'rgba(0,240,255,0.5)');
  g.addColorStop(0.3, 'rgba(0,240,255,0.2)');
  g.addColorStop(0.6, 'rgba(0,200,255,0.06)');
  g.addColorStop(1, 'rgba(0,240,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  sharedISSGlowTexture = new THREE.CanvasTexture(canvas);
  sharedISSGlowTexture.needsUpdate = true;
  return sharedISSGlowTexture;
}

function createPlaneSprite(d: FlightPoint): THREE.Object3D {
  const group = new THREE.Group();
  const color = d.color;

  /* Subtle glow */
  const glowMat = new THREE.SpriteMaterial({
    map: getGlowTexture(),
    color: color,
    transparent: true,
    opacity: 0.5,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(PLANE_GLOW_SIZE, PLANE_GLOW_SIZE, 1);
  group.add(glow);

  /* Plane icon - uniform size, category color */
  const planeMat = new THREE.SpriteMaterial({
    map: getPlaneTexture(),
    color: color,
    transparent: true,
    depthTest: true,
  });
  const plane = new THREE.Sprite(planeMat);
  plane.scale.set(PLANE_SIZE, PLANE_SIZE, 1);
  group.add(plane);

  return group;
}

function createISSSprite(_d: ISSPoint): THREE.Object3D {
  const group = new THREE.Group();
  const color = ISS_COLOR;

  /* Strong cyan glow - highly visible */
  const glowMat = new THREE.SpriteMaterial({
    map: getISSGlowTexture(),
    color: color,
    transparent: true,
    opacity: 0.9,
    depthTest: false,
  });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(ISS_GLOW_SIZE, ISS_GLOW_SIZE, 1);
  group.add(glow);

  const issMat = new THREE.SpriteMaterial({
    map: getISSTexture(),
    color: color,
    transparent: true,
    depthTest: true,
  });
  const iss = new THREE.Sprite(issMat);
  iss.scale.set(ISS_SIZE, ISS_SIZE, 1);
  group.add(iss);

  return group;
}

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

interface ISSPoint {
  id: string;
  lat: number;
  lng: number;
  alt: number;
  radius: number;
  color: string;
  _type: 'iss';
  _src: ISSData;
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

export const QuantisGlobe = memo(function QuantisGlobe({
  flights,
  iss,
  countryFeed,
  geoJson,
  selectedFlight,
  onFlightClick,
  onMentionClick,
}: {
  flights: FlightData[];
  iss: ISSData | null;
  countryFeed: CountryFeedData[];
  geoJson: Record<string, unknown> | null;
  selectedFlight: FlightData | null;
  onFlightClick: (flight: FlightData) => void;
  onMentionClick?: (data: { country: string; count: number; recent: FeedItem[] }) => void;
}) {
  const globeRef = useRef<any>(null);
  const [hovered, setHovered] = useState<FlightData | null>(null);
  const [hoveredISS, setHoveredISS] = useState<ISSData | null>(null);
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

  const issPoint: ISSPoint | null = useMemo(() => {
    if (!iss || !Number.isFinite(iss.lat) || !Number.isFinite(iss.lng)) return null;
    return {
      id: 'iss',
      lat: iss.lat,
      lng: iss.lng,
      alt: 0.1, // ~400km orbit in radius units, above planes
      radius: 0.3,
      color: ISS_COLOR,
      _type: 'iss',
      _src: iss,
    };
  }, [iss]);

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
            alt: norm * 0.02 + 0.07, // 0.07–0.09 above surface, no clip
            radius: 0.15,
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

  const points = mentionPoints;

  const objectsData = useMemo(
    () => [...flightPoints, ...(issPoint ? [issPoint] : [])],
    [flightPoints, issPoint],
  );

  const objectThreeObject = useCallback((d: FlightPoint | ISSPoint) => {
    if (d._type === 'iss') return createISSSprite(d);
    return createPlaneSprite(d);
  }, []);

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

  const onPointHover = useCallback((pt: any) => {
    if (!pt) {
      setHoveredMention(null);
      return;
    }
    setHoveredMention(pt._src);
  }, []);

  const onObjectHover = useCallback((obj: any) => {
    setHovered(obj?._src ?? null);
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setTooltipPos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  const onPointClick = useCallback(
    (pt: any) => {
      if (!pt || !onMentionClick || !pt._src?.recent?.length) return;
      onMentionClick({ country: pt._src.country, count: pt._src.count, recent: pt._src.recent });
    },
    [onMentionClick],
  );

  const onObjectClick = useCallback(
    (obj: any, _ev: MouseEvent) => {
      if (!obj) return;
      if (obj._type === 'iss') {
        if (globeRef.current && obj.lat != null && obj.lng != null) {
          globeRef.current.pointOfView({ lat: obj.lat, lng: obj.lng, altitude: 1.5 }, 600);
        }
      } else if (obj._src) {
        onFlightClick(obj._src);
      }
    },
    [onFlightClick],
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
        onPointHover={onPointHover}
        onPointClick={onPointClick}
        objectsData={objectsData}
        objectLat="lat"
        objectLng="lng"
        objectAltitude="alt"
        objectThreeObject={objectThreeObject}
        objectFacesSurface={false}
        onObjectHover={onObjectHover}
        onObjectClick={onObjectClick}
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

      {hoveredISS && (
        <div className="absolute bottom-4 left-4 z-30 w-72 rounded-xl border border-zinc-700/40 bg-zinc-900/95 backdrop-blur-md p-3.5 shadow-2xl animate-fade-in pointer-events-none">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] font-bold text-zinc-100 tracking-tight">ISS</span>
            <span className="rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#00f0ff] bg-[#00f0ff]/15">
              Live
            </span>
          </div>
          <div className="text-[10px] space-y-1">
            <TooltipRow label="Position" value={`${hoveredISS.lat.toFixed(2)}°, ${hoveredISS.lng.toFixed(2)}°`} mono />
            {hoveredISS.people != null && hoveredISS.people > 0 && (
              <TooltipRow label="People in space" value={String(hoveredISS.people)} />
            )}
            {hoveredISS.astros && hoveredISS.astros.length > 0 && (
              <div className="mt-1.5 pt-1.5 border-t border-white/[0.06]">
                <span className="text-zinc-500 text-[9px]">Crew: </span>
                <span className="text-zinc-300 text-[9px]">
                  {hoveredISS.astros.map((a) => `${a.name} (${a.craft})`).join(', ')}
                </span>
              </div>
            )}
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
