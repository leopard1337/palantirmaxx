/**
 * Fetches data from Quantis APIs. Requires the app to be running at apiBase.
 * All endpoints return JSON – agents consume this data; Quantis does not execute trades.
 */
import { config } from '../config.js';

const BASE = config.apiBase;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`${url} ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

async function fetchSafe<T>(url: string, fallback: T): Promise<T> {
  try {
    return await fetchJson<T>(url);
  } catch {
    return fallback;
  }
}

function url(path: string, params?: Record<string, string>): string {
  const u = new URL(path, BASE);
  if (params) Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v));
  return u.toString();
}

// ─── Intel (no bearer) ─────────────────────────────────────────────────────

export interface CryptoQuote {
  id: string;
  symbol: string;
  price?: number;
  priceUsd?: number;
  change24h?: number;
}

export interface StablecoinMarket {
  id: string;
  symbol: string;
  name: string;
  price: number;
  pegStatus: string;
  change24h?: number;
}

export interface TrendItem {
  title: string;
  traffic?: string;
  articles: Array<{ title: string; url: string; source: string }>;
}

export interface ISSData {
  lat: number;
  lng: number;
  timestamp: number;
  people?: number;
  astros?: Array<{ name: string; craft: string }>;
}

export interface PolymarketEvent {
  id: string;
  title: string;
  slug: string;
  markets?: Array<{
    id: string;
    title: string;
    question: string;
    yes_probability: number;
    volume?: number;
    event_id: string;
    event_title: string;
  }>;
  volume?: number;
}

export interface FeedItem {
  id: string;
  timestamp: number;
  tweet?: { body: string; user?: { handle: string } };
  news?: { title: string; body: string; source: string };
  telegram?: { text: string; channel: string };
  related_markets?: Array<{
    id?: string;
    slug?: string;
    event_id?: string;
    title: string;
    question: string;
    yes_probability: number;
    event_title: string;
    volume?: number;
  }>;
}

export interface FeedResponse {
  items: FeedItem[];
  total: number;
  total_pages: number;
}

export interface EventMarket {
  id: string;
  title: string;
  question: string;
  yes_probability: number;
  volume?: number;
  event_id: string;
  event_title: string;
}

export interface GlintEvent {
  id: string;
  title: string;
  slug: string;
  markets?: EventMarket[];
  volume?: number;
}

// ─── Fetchers ──────────────────────────────────────────────────────────────

export async function fetchCrypto(ids: string[] = ['bitcoin', 'ethereum', 'solana']): Promise<CryptoQuote[]> {
  const data = await fetchSafe<Record<string, { usd?: number; usd_24h_change?: number }>>(
    url('/api/intel/coingecko', { type: 'crypto', ids: ids.join(',') }),
    {}
  );
  if (typeof data !== 'object' || data === null) return [];
  return Object.entries(data).map(([id, v]) => ({
    id,
    symbol: id.toUpperCase().slice(0, 3),
    price: v?.usd,
    priceUsd: v?.usd,
    change24h: v?.usd_24h_change,
  }));
}

export async function fetchStablecoins(): Promise<StablecoinMarket[]> {
  const data = await fetchSafe<Array<{ id: string; symbol: string; name: string; current_price?: number; price_change_percentage_24h?: number }>>(
    url('/api/intel/coingecko', { type: 'stablecoins' }),
    []
  );
  if (!Array.isArray(data)) return [];
  return data.map((c) => ({
    id: c.id,
    symbol: c.symbol?.toUpperCase() ?? '',
    name: c.name ?? '',
    price: c.current_price ?? 0,
    pegStatus: Math.abs((c.current_price ?? 1) - 1) < 0.01 ? 'ON PEG' : 'OFF PEG',
    change24h: c.price_change_percentage_24h,
  }));
}

export async function fetchTrends(geo = 'US'): Promise<TrendItem[]> {
  const data = await fetchSafe<TrendItem[] | { error?: string }>(url('/api/intel/trends', { geo }), []);
  return Array.isArray(data) ? data : [];
}

export async function fetchISS(includeAstros = true): Promise<ISSData | null> {
  const data = await fetchSafe<ISSData | null>(
    url('/api/intel/iss', { include: includeAstros ? 'astros' : 'position' }),
    null as ISSData | null
  );
  return data && typeof data === 'object' && 'lat' in data ? (data as ISSData) : null;
}

export async function fetchPolymarket(limit = 50, category = 'all'): Promise<PolymarketEvent[]> {
  const data = await fetchSafe<PolymarketEvent[] | { error?: string }>(
    url('/api/intel/polymarket', { limit: String(limit), category }),
    []
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchFlights(limit = 50): Promise<unknown[]> {
  const data = await fetchSafe<unknown[] | { error?: string }>(
    url('/api/intel/opensky', { limit: String(limit) }),
    []
  );
  return Array.isArray(data) ? data : [];
}

export async function fetchGDACS(): Promise<{ features?: unknown[] }> {
  return fetchSafe<{ features?: unknown[] }>(url('/api/intel/gdacs'), { features: [] });
}

export async function fetchWeather(): Promise<{ features?: unknown[] }> {
  return fetchSafe<{ features?: unknown[] }>(url('/api/intel/weather'), { features: [] });
}

export async function fetchUSGS(): Promise<{ features?: unknown[] }> {
  return fetchSafe<{ features?: unknown[] }>(url('/api/intel/usgs'), { features: [] });
}

export async function fetchTreasury(limit = 60): Promise<{ data?: unknown[] }> {
  const data = await fetchSafe<{ data?: unknown[] } | { error?: string }>(
    url('/api/intel/treasury', { limit: String(limit) }),
    { data: [] }
  );
  return typeof data === 'object' && data !== null && 'data' in data ? (data as { data?: unknown[] }) : { data: [] };
}

export async function fetchBLS(): Promise<{ Results?: { series?: unknown[] } }> {
  return fetchSafe<{ Results?: { series?: unknown[] } }>(url('/api/intel/bls'), { Results: { series: [] } });
}

export async function fetchOilPrice(): Promise<unknown> {
  return fetchSafe<unknown>(url('/api/intel/oilprice'), {});
}

export async function fetchFRED(seriesId = 'UNRATE', limit = 120): Promise<{ data?: Array<{ date: string; value: number }> }> {
  const data = await fetchSafe<{ data?: Array<{ date: string; value: number }> } | { error?: string }>(
    url('/api/intel/fred', { series_id: seriesId, limit: String(limit) }),
    { data: [] }
  );
  return typeof data === 'object' && data !== null && 'data' in data ? (data as { data?: Array<{ date: string; value: number }> }) : { data: [] };
}

// ─── Quantis API (bearer required – app proxies with token) ───────────────────

export async function fetchFeed(page = 1, count = 20): Promise<FeedResponse | null> {
  try {
    const data = await fetchJson<FeedResponse>(
      url('/api/quantis/api/feed/v2', { page: String(page), count: String(count) })
    );
    return data;
  } catch {
    return null;
  }
}

export async function fetchGlintEvents(category = 'all'): Promise<GlintEvent[]> {
  try {
    const data = await fetchJson<GlintEvent[]>(
      url(`/api/quantis/api/events/category/${category}`, { source: 'all', sort: 'volume_desc' })
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ─── Full data dump for agents ───────────────────────────────────────────────

export interface AgentData {
  intel: {
    crypto: CryptoQuote[];
    stablecoins: StablecoinMarket[];
    trends: TrendItem[];
    iss: ISSData | null;
    fred?: { data: Array<{ date: string; value: number }> };
    treasury?: { data: unknown[] };
    bls?: { Results?: { series?: unknown[] } };
    oil?: unknown;
    gdacs?: { features?: unknown[] };
    weather?: { features?: unknown[] };
    usgs?: { features?: unknown[] };
    flights?: unknown[];
  };
  markets: {
    polymarket: PolymarketEvent[];
    glint: GlintEvent[];
  };
  feed: FeedItem[];
  fetchedAt: string;
}

export async function fetchAll(): Promise<AgentData> {
  const [
    crypto,
    stablecoins,
    trends,
    iss,
    polymarket,
    glint,
    feed,
    flights,
    gdacs,
    weather,
    usgs,
    treasury,
    bls,
    oil,
    fred,
  ] = await Promise.all([
    fetchCrypto(),
    fetchStablecoins(),
    fetchTrends(),
    fetchISS(),
    fetchPolymarket(50),
    fetchGlintEvents('all'),
    fetchFeed(1, 50).then((r) => r?.items ?? []),
    fetchFlights(30),
    fetchGDACS(),
    fetchWeather(),
    fetchUSGS(),
    fetchTreasury(60),
    fetchBLS(),
    fetchOilPrice(),
    fetchFRED('UNRATE', 24),
  ]);

  return {
    intel: {
      crypto,
      stablecoins,
      trends,
      iss,
      fred: { data: fred.data ?? [] },
      treasury: { data: treasury.data ?? [] },
      bls,
      oil,
      gdacs,
      weather,
      usgs,
      flights,
    },
    markets: {
      polymarket,
      glint,
    },
    feed,
    fetchedAt: new Date().toISOString(),
  };
}

/** Legacy – for backward compat */
export async function fetchIntel(): Promise<AgentData> {
  return fetchAll();
}
