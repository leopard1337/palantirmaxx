import { apiRequest } from './client';
import { getApiUrl } from './base-url';
import type { FlightData, WhaleTradeData, CountryFeedData } from './types';

/** Try Glint first, fallback to OpenSky (free) when Glint fails or returns empty */
export async function fetchFlights(limit = 50): Promise<FlightData[]> {
  try {
    const data = await apiRequest<FlightData[]>('/api/flights', { limit: String(limit) });
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {
    /* fallthrough to OpenSky */
  }
  const url = getApiUrl('/api/intel/opensky', { limit: String(limit) });
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Flights ${res.status}`);
  const openSky = (await res.json()) as FlightData[];
  return Array.isArray(openSky) ? openSky : [];
}

export async function fetchWhaleTrades(limit = 100): Promise<WhaleTradeData[]> {
  return apiRequest<WhaleTradeData[]>('/api/trades/whale', {
    limit: String(limit),
  });
}

export async function fetchCountryFeed(): Promise<CountryFeedData[]> {
  return apiRequest<CountryFeedData[]>('/api/feed/countries/v2');
}
