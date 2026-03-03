/**
 * Resolve country identifier → [lat, lng] centroid.
 * Uses GeoJSON features when available; falls back to static lookup.
 */

export type GeoJsonFeature = {
  type: string;
  properties?: { ADMIN?: string; ISO_A2?: string; ISO_A3?: string; NAME?: string };
  geometry?: {
    type: string;
    coordinates: number[][][] | number[][][][];
  };
};

/** Rough centroid from polygon ring (first ring of first polygon for MultiPolygon) */
function centroidFromCoords(coords: unknown): [number, number] | null {
  if (!Array.isArray(coords) || coords.length === 0) return null;
  // GeoJSON: Polygon = [[[lng,lat],...]], MultiPolygon = [[[[lng,lat],...],...]]
  let ring: [number, number][] = [];
  try {
    const first = coords[0];
    if (!Array.isArray(first) || first.length === 0) return null;
    const f0 = first[0];
    // Polygon: first = [[lng,lat],[lng,lat],...], f0 = [lng,lat]
    // MultiPolygon: first = [ring1, ring2,...], ring1 = [[lng,lat],...], f0 = [[lng,lat],...]
    if (Array.isArray(f0) && f0.length >= 2) {
      if (typeof f0[0] === 'number') {
        ring = first as [number, number][]; // Polygon
      } else if (Array.isArray(f0[0])) {
        ring = (first as [number, number][][])[0] ?? []; // MultiPolygon
      }
    }
  } catch {
    return null;
  }
  if (!Array.isArray(ring) || ring.length === 0) return null;
  let sumLat = 0, sumLng = 0;
  let count = 0;
  for (const pt of ring) {
    if (Array.isArray(pt) && pt.length >= 2 && typeof pt[0] === 'number' && typeof pt[1] === 'number') {
      sumLng += pt[0];
      sumLat += pt[1];
      count++;
    }
  }
  if (count === 0) return null;
  return [sumLat / count, sumLng / count];
}

/** Build centroid map from GeoJSON FeatureCollection */
export function buildCentroidMap(features: GeoJsonFeature[]): Map<string, [number, number]> {
  const map = new Map<string, [number, number]>();
  const feats = Array.isArray(features) ? features : [];
  for (const f of feats) {
    const geom = f.geometry;
    if (!geom?.coordinates) continue;
    const c = centroidFromCoords(geom.coordinates);
    if (!c) continue;
    const props = f.properties ?? {};
    const admin = props.ADMIN?.trim();
    const iso2 = props.ISO_A2?.trim();
    const iso3 = props.ISO_A3?.trim();
    const name = props.NAME?.trim();
    if (admin) map.set(admin, c);
    if (iso2 && !map.has(iso2)) map.set(iso2, c);
    if (iso3 && !map.has(iso3)) map.set(iso3, c);
    if (name && name !== admin && !map.has(name)) map.set(name, c);
  }
  return map;
}

/** Static fallback for common names/aliases the API might return */
const STATIC_CENTROIDS: Record<string, [number, number]> = {
  Iran: [32.4279, 53.688],
  IR: [32.4279, 53.688],
  Israel: [31.0461, 34.8516],
  IL: [31.0461, 34.8516],
  USA: [37.0902, -95.7129],
  US: [37.0902, -95.7129],
  'United States': [37.0902, -95.7129],
  America: [37.0902, -95.7129],
  Russia: [61.524, 105.3188],
  RU: [61.524, 105.3188],
  China: [35.8617, 104.1954],
  CN: [35.8617, 104.1954],
  Ukraine: [48.3794, 31.1656],
  UA: [48.3794, 31.1656],
  UK: [55.3781, -3.436],
  GB: [55.3781, -3.436],
  'United Kingdom': [55.3781, -3.436],
  France: [46.2276, 2.2137],
  FR: [46.2276, 2.2137],
  Germany: [51.1657, 10.4515],
  DE: [51.1657, 10.4515],
  Turkey: [38.9637, 35.2433],
  TR: [38.9637, 35.2433],
  India: [20.5937, 78.9629],
  IN: [20.5937, 78.9629],
  Japan: [36.2048, 138.2529],
  JP: [36.2048, 138.2529],
};

export function getCountryCentroid(
  country: string,
  geoMap?: Map<string, [number, number]> | null,
): [number, number] | null {
  const key = country?.trim();
  if (!key) return null;
  // Try GeoJSON-derived map first
  if (geoMap) {
    const fromGeo = geoMap.get(key) ?? geoMap.get(key.toUpperCase());
    if (fromGeo) return fromGeo;
  }
  return STATIC_CENTROIDS[key] ?? STATIC_CENTROIDS[key.toUpperCase()] ?? null;
}
