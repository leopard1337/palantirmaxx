/**
 * Intelligence data sources - WorldMonitor, Weather.gov, USA Spending, GDACS.
 * All endpoints documented as no API key required (some may vary by env).
 */

import type {
  CryptoQuote,
  StablecoinMarket,
  StablecoinSummary,
  FREDDataPoint,
  EnergyPrice,
  Earthquake,
  GDACSFeature,
  WeatherAlert,
  TrendItem,
} from './intel-types';
import { getApiUrl } from './base-url';

async function wmGet<T>(path: string, params?: Record<string, string>): Promise<T> {
  const res = await fetch(getApiUrl(`/api/intel/wm${path}`, params), {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`WM ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

// ─── Crypto & Stablecoins ───────────────────────────────────────────────────

async function fetchCryptoFromCoinGecko(ids: string[]): Promise<CryptoQuote[]> {
  const idsStr = ids.length ? ids.join(',') : 'bitcoin,ethereum,solana';
  const res = await fetch(
    getApiUrl('/api/intel/coingecko', { type: 'crypto', ids: idsStr }),
    { cache: 'no-store' },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as Record<string, { usd?: number; usd_24h_change?: number }>;
  return Object.entries(data).map(([id, v]) => ({
    id,
    symbol: id.toUpperCase().slice(0, 3),
    price: v.usd,
    priceUsd: v.usd,
    change24h: v.usd_24h_change,
  }));
}

async function fetchStablecoinsFromCoinGecko(): Promise<StablecoinMarket[]> {
  const res = await fetch(
    getApiUrl('/api/intel/coingecko', { type: 'stablecoins' }),
    { cache: 'no-store' },
  );
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{
    id: string;
    symbol: string;
    name: string;
    current_price: number;
    price_change_percentage_24h?: number;
  }>;
  return data.map((c) => ({
    id: c.id,
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    price: c.current_price,
    pegStatus: Math.abs((c.current_price ?? 1) - 1) < 0.01 ? 'ON PEG' : 'OFF PEG',
    change24h: c.price_change_percentage_24h,
  }));
}

export async function fetchCryptoQuotes(ids: string[]): Promise<CryptoQuote[]> {
  const fromCG = await fetchCryptoFromCoinGecko(ids);
  if (fromCG.length > 0) return fromCG;
  try {
    const idsStr = ids.length ? ids.join(',') : 'bitcoin,ethereum,solana';
    const data = await wmGet<Record<string, CryptoQuote> | CryptoQuote[] | { error?: string }>(
      '/market/v1/list-crypto-quotes',
      { ids: idsStr },
    );
    if (data && typeof data === 'object' && 'error' in data) return [];
    if (Array.isArray(data) && data.length > 0) return data;
    return Object.values(data as Record<string, CryptoQuote>).filter(Boolean);
  } catch {
    return [];
  }
}

export async function fetchStablecoinMarkets(coins?: string): Promise<{
  summary: StablecoinSummary | null;
  stablecoins: StablecoinMarket[];
}> {
  const fromCG = await fetchStablecoinsFromCoinGecko();
  if (fromCG.length > 0) return { summary: null, stablecoins: fromCG };
  try {
    const data = await wmGet<{
      timestamp?: string;
      summary?: StablecoinSummary;
      stablecoins?: StablecoinMarket[];
    }>('/market/v1/list-stablecoin-markets', coins ? { coins } : {});
    const list = data?.stablecoins ?? [];
    if (list.length > 0) return { summary: data?.summary ?? null, stablecoins: list };
  } catch {
    /* ignore */
  }
  return { summary: null, stablecoins: [] };
}

// ─── FRED Economic Series ────────────────────────────────────────────────────

const FRED_SERIES: Record<string, { label: string; unit?: string }> = {
  UNRATE: { label: 'Unemployment', unit: '%' },
  T10Y2Y: { label: '10Y-2Y Spread', unit: 'pp' },
  VIXCLS: { label: 'VIX', unit: '' },
  DGS10: { label: '10Y Treasury', unit: '%' },
  FEDFUNDS: { label: 'Fed Funds', unit: '%' },
  CPIAUCSL: { label: 'CPI', unit: '' },
};

export const FRED_SERIES_IDS = Object.keys(FRED_SERIES);

export function getFredSeriesLabel(id: string): string {
  return FRED_SERIES[id]?.label ?? id;
}

export function getFredSeriesUnit(id: string): string {
  return FRED_SERIES[id]?.unit ?? '';
}

const BLS_SERIES: Record<string, string> = { UNRATE: 'LNS14000000', CPIAUCSL: 'CUSR0000SA0' };
const BLS_ID_TO_SERIES: Record<string, string> = { LNS14000000: 'UNRATE', CUSR0000SA0: 'CPIAUCSL' };

function parseBlsData(
  arr: Array<{ year?: string; period?: string; value?: string }>,
): FREDDataPoint[] {
  return arr
    .filter((d) => d.value !== '-' && d.value != null)
    .map((d) => {
      const mm = (d.period ?? 'M01').replace(/^M/, '').padStart(2, '0');
      return { date: `${d.year}-${mm}`, value: parseFloat(String(d.value)) };
    })
    .reverse();
}

async function fetchFromBLS(seriesId: string): Promise<FREDDataPoint[]> {
  const blsId = BLS_SERIES[seriesId];
  if (!blsId) return [];
  try {
    const res = await fetch(getApiUrl('/api/intel/bls', { series: blsId }), { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as { Results?: { series?: Array<{ seriesID?: string; data?: Array<{ year?: string; period?: string; value?: string }> }> } };
    const seriesArr = data?.Results?.series ?? [];
    const match = seriesArr.find((s) => s.seriesID === blsId) ?? seriesArr[0];
    const arr = match?.data ?? [];
    return parseBlsData(arr);
  } catch {
    return [];
  }
}

async function fetchFromTreasury(): Promise<{ notes: FREDDataPoint[]; bills: FREDDataPoint[] }> {
  try {
    const res = await fetch(getApiUrl('/api/intel/treasury', { limit: '60' }), { cache: 'no-store' });
    if (!res.ok) return { notes: [], bills: [] };
    const data = (await res.json()) as {
      data?: Array<{ record_date?: string; security_desc?: string; avg_interest_rate_amt?: string }>;
    };
    const list = data?.data ?? [];
    const notes = list.filter((r) => r.security_desc === 'Treasury Notes');
    const bills = list.filter((r) => r.security_desc === 'Treasury Bills');
    const toPoints = (arr: typeof list) =>
      arr.map((r) => ({ date: r.record_date ?? '', value: parseFloat(r.avg_interest_rate_amt ?? '0') }));
    return { notes: toPoints(notes), bills: toPoints(bills) };
  } catch {
    return { notes: [], bills: [] };
  }
}

async function fetchFromFRED(seriesId: string, limit: number): Promise<FREDDataPoint[]> {
  try {
    const res = await fetch(getApiUrl('/api/intel/fred', { series_id: seriesId, limit: String(limit) }), {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: FREDDataPoint[]; error?: string };
    return json?.data ?? [];
  } catch {
    return [];
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Batched fetch: 3 API calls total instead of 6, with polite delays. */
export async function fetchAllFredSeries(limit = 120): Promise<
  Array<{ seriesId: string; label: string; data: FREDDataPoint[] }>
> {
  const ids = ['UNRATE', 'VIXCLS', 'DGS10', 'FEDFUNDS', 'CPIAUCSL', 'T10Y2Y'] as const;
  const out: Array<{ seriesId: string; label: string; data: FREDDataPoint[] }> = ids.map((id) => ({
    seriesId: id,
    label: getFredSeriesLabel(id),
    data: [],
  }));
  const byId = Object.fromEntries(out.map((o) => [o.seriesId, o]));

  // 1. BLS: both UNRATE + CPIAUCSL in one request
  try {
    const res = await fetch(getApiUrl('/api/intel/bls', { series: 'LNS14000000,CUSR0000SA0' }), {
      cache: 'no-store',
    });
    if (res.ok) {
      const data = (await res.json()) as { Results?: { series?: Array<{ seriesID?: string; data?: Array<{ year?: string; period?: string; value?: string }> }> } };
      for (const s of data?.Results?.series ?? []) {
        const seriesId = BLS_ID_TO_SERIES[s.seriesID ?? ''];
        if (seriesId && byId[seriesId]) byId[seriesId].data = parseBlsData(s.data ?? []);
      }
    }
  } catch {
    /* ignore */
  }
  await sleep(200);

  // 2. Treasury: DGS10, FEDFUNDS, T10Y2Y from one request
  try {
    const { notes, bills } = await fetchFromTreasury();
    if (notes.length > 0 && byId.DGS10) byId.DGS10.data = notes;
    if (bills.length > 0 && byId.FEDFUNDS) byId.FEDFUNDS.data = bills;
    if (notes.length > 0 && bills.length > 0 && byId.T10Y2Y) {
      const billByDate = new Map(bills.map((p) => [p.date, p.value]));
      const points = notes
        .filter((p) => billByDate.has(p.date))
        .map((p) => ({ date: p.date, value: p.value - (billByDate.get(p.date) ?? 0) }));
      points.sort((a, b) => a.date.localeCompare(b.date));
      byId.T10Y2Y.data = points;
    }
  } catch {
    /* ignore */
  }
  await sleep(200);

  // 3. Yahoo: VIX
  try {
    const res = await fetch(getApiUrl('/api/intel/yahoo', { symbol: '^VIX', range: '1y', interval: '1d' }), {
      cache: 'no-store',
    });
    if (res.ok) {
      const json = (await res.json()) as { data?: FREDDataPoint[] };
      if (byId.VIXCLS && json?.data?.length) byId.VIXCLS.data = json.data;
    }
  } catch {
    /* ignore */
  }

  return out;
}

export async function fetchFredSeries(
  seriesId: string,
  limit = 120,
): Promise<{ seriesId: string; label: string; data: FREDDataPoint[] }> {
  // BLS first for Unemployment & CPI
  if (BLS_SERIES[seriesId]) {
    const points = await fetchFromBLS(seriesId);
    if (points.length > 0) return { seriesId, label: getFredSeriesLabel(seriesId), data: points };
  }
  // Treasury for DGS10, FEDFUNDS, T10Y2Y (free, no key)
  if (['DGS10', 'FEDFUNDS', 'T10Y2Y'].includes(seriesId)) {
    const { notes, bills } = await fetchFromTreasury();
    if (seriesId === 'DGS10' && notes.length > 0) {
      return { seriesId, label: getFredSeriesLabel(seriesId), data: notes };
    }
    if (seriesId === 'FEDFUNDS' && bills.length > 0) {
      return { seriesId, label: getFredSeriesLabel(seriesId), data: bills };
    }
    if (seriesId === 'T10Y2Y' && notes.length > 0 && bills.length > 0) {
      const billByDate = new Map(bills.map((p) => [p.date, p.value]));
      const points: FREDDataPoint[] = notes
        .filter((p) => billByDate.has(p.date))
        .map((p) => ({ date: p.date, value: p.value - (billByDate.get(p.date) ?? 0) }));
      points.sort((a, b) => a.date.localeCompare(b.date));
      if (points.length > 0) return { seriesId, label: getFredSeriesLabel(seriesId), data: points };
    }
  }
  if (seriesId === 'VIXCLS') {
    try {
      const res = await fetch(getApiUrl('/api/intel/yahoo', { symbol: '^VIX', range: '1y', interval: '1d' }), {
        cache: 'no-store',
      });
      if (res.ok) {
        const json = (await res.json()) as { data?: FREDDataPoint[] };
        const points = json?.data ?? [];
        if (points.length > 0) return { seriesId, label: getFredSeriesLabel(seriesId), data: points };
      }
    } catch {
      /* ignore */
    }
  }
  // FRED API (when key valid) - fallback only if free sources fail
  const fredPoints = await fetchFromFRED(seriesId, limit);
  if (fredPoints.length > 0) {
    return { seriesId, label: getFredSeriesLabel(seriesId), data: fredPoints };
  }
  try {
    const data = await wmGet<{
      observations?: Array<{ date?: string; value?: number }>;
      data?: Array<{ date?: string; value?: number }>;
    }>('/economic/v1/get-fred-series', { series_id: seriesId, limit: String(limit) });
    const arr = data?.observations ?? data?.data ?? [];
    const points: FREDDataPoint[] = arr.map((o) => ({
      date: o?.date ?? '',
      value: typeof o?.value === 'number' ? o.value : 0,
    }));
    if (points.length > 0) return { seriesId, label: getFredSeriesLabel(seriesId), data: points };
  } catch {
    /* ignore */
  }
  return { seriesId, label: getFredSeriesLabel(seriesId), data: [] };
}

// ─── Energy ──────────────────────────────────────────────────────────────────

async function fetchEnergyFromOilPrice(): Promise<EnergyPrice[]> {
  try {
    const res = await fetch(getApiUrl('/api/intel/oilprice'), { cache: 'no-store' });
    if (!res.ok) return [];
    const json = (await res.json()) as { data?: { prices?: Array<{ code?: string; name?: string; price?: number; change_24h?: number }> } };
    const prices = json?.data?.prices ?? [];
    return prices
      .filter((p) => ['BRENT_CRUDE_USD', 'WTI_USD', 'NATURAL_GAS_USD', 'GASOLINE_USD', 'HEATING_OIL_USD', 'GOLD_USD'].includes(p.code ?? ''))
      .map((p) => ({ commodity: p.name, price: p.price, change: p.change_24h }));
  } catch {
    return [];
  }
}

export async function fetchEnergyPrices(commodities?: string): Promise<EnergyPrice[]> {
  const fromOilPrice = await fetchEnergyFromOilPrice();
  if (fromOilPrice.length > 0) return fromOilPrice;
  try {
    const data = await wmGet<EnergyPrice[] | { data?: EnergyPrice[] }>(
      '/economic/v1/get-energy-prices',
      commodities ? { commodities } : {},
    );
    if (Array.isArray(data)) return data;
    return (data as { data?: EnergyPrice[] })?.data ?? [];
  } catch {
    return [];
  }
}

// ─── Bootstrap (Earthquakes, etc.) ───────────────────────────────────────────

async function fetchEarthquakesFromUSGS(): Promise<Earthquake[]> {
  try {
    const res = await fetch(getApiUrl('/api/intel/usgs'), { cache: 'no-store' });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      features?: Array<{
        id?: string;
        properties?: { mag?: number; place?: string; time?: number; url?: string };
        geometry?: { coordinates?: [number, number, number] };
      }>;
    };
    const features = data?.features ?? [];
    return features.map((f) => ({
      id: f.id,
      place: f.properties?.place,
      magnitude: f.properties?.mag,
      depthKm: f.geometry?.coordinates?.[2],
      location: f.geometry?.coordinates
        ? { latitude: f.geometry.coordinates[1], longitude: f.geometry.coordinates[0] }
        : undefined,
      occurredAt: f.properties?.time
        ? new Date(f.properties.time).toISOString()
        : undefined,
      sourceUrl: f.properties?.url,
    }));
  } catch {
    return [];
  }
}

export async function fetchBootstrapEarthquakes(): Promise<Earthquake[]> {
  const fromUSGS = await fetchEarthquakesFromUSGS();
  if (fromUSGS.length > 0) return fromUSGS;
  try {
    const data = await wmGet<{ data?: { earthquakes?: { earthquakes?: Earthquake[] } | Earthquake[] } }>(
      '/bootstrap',
    );
    const nested = data?.data?.earthquakes;
    const list = Array.isArray(nested) ? nested : (nested as { earthquakes?: Earthquake[] })?.earthquakes ?? [];
    if (list.length > 0) return list;
  } catch {
    /* ignore */
  }
  return [];
}

// ─── External: Weather, GDACS, USA Spending ──────────────────────────────────

export async function fetchWeatherAlerts(): Promise<WeatherAlert[]> {
  try {
    const res = await fetch(getApiUrl('/api/intel/weather'));
    if (!res.ok) throw new Error(`Weather ${res.status}`);
    const data = (await res.json()) as { features?: WeatherAlert[] };
    return data?.features ?? [];
  } catch {
    return [];
  }
}

export async function fetchGDACSEvents(): Promise<GDACSFeature[]> {
  try {
    const res = await fetch(getApiUrl('/api/intel/gdacs'));
    if (!res.ok) throw new Error(`GDACS ${res.status}`);
    const data = (await res.json()) as { features?: GDACSFeature[] };
    const features = data?.features ?? [];
    // Dedupe by eventid+episodeid (API returns Centroid, Affected, Global per event)
    const byEvent = new Map<string, GDACSFeature>();
    for (const f of features) {
      const pid = `${f.properties?.eventid ?? ''}-${f.properties?.episodeid ?? ''}`;
      if (!pid || pid === '-') continue;
      const existing = byEvent.get(pid);
      // Prefer Point_Centroid over polygon/affected/global
      const cls = (f as { properties?: { Class?: string } }).properties?.Class ?? '';
      const isCentroid = cls.includes('Centroid');
      if (!existing || (isCentroid && !(existing as { properties?: { Class?: string } }).properties?.Class?.includes('Centroid'))) {
        byEvent.set(pid, f);
      }
    }
    return Array.from(byEvent.values());
  } catch {
    return [];
  }
}

export interface ISSData {
  lat: number;
  lng: number;
  timestamp: number;
  people?: number;
  astros?: Array<{ name: string; craft: string }>;
}

export async function fetchISS(includeAstros = true): Promise<ISSData | null> {
  try {
    const params = includeAstros ? { include: 'astros' } : undefined;
    const url = getApiUrl('/api/intel/iss', params);
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`ISS ${res.status}`);
    return (await res.json()) as ISSData;
  } catch {
    return null;
  }
}

export async function fetchTrends(geo = 'US'): Promise<TrendItem[]> {
  try {
    const res = await fetch(getApiUrl('/api/intel/trends', { geo }), { cache: 'no-store' });
    if (!res.ok) throw new Error(`Trends ${res.status}`);
    const data = (await res.json()) as TrendItem[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function fetchUSASpending(params?: {
  award_amounts?: string;
  limit?: number;
}): Promise<{ results?: unknown[]; total?: number }> {
  try {
    const body = JSON.stringify({
      award_amounts: params?.award_amounts ?? undefined,
      limit: params?.limit ?? 10,
    });
    const res = await fetch(getApiUrl('/api/intel/usaspending'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`USA Spending ${res.status}`);
    const data = (await res.json()) as { results?: unknown[]; total?: number };
    return data;
  } catch {
    return { results: [], total: 0 };
  }
}
