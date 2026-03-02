import { apiRequest } from './client';
import type { FlightData, WhaleTradeData, CountryFeedData } from './types';

export async function fetchFlights(limit = 50): Promise<FlightData[]> {
  return apiRequest<FlightData[]>('/api/flights', { limit: String(limit) });
}

export async function fetchWhaleTrades(limit = 100): Promise<WhaleTradeData[]> {
  return apiRequest<WhaleTradeData[]>('/api/trades/whale', {
    limit: String(limit),
  });
}

export async function fetchCountryFeed(): Promise<CountryFeedData[]> {
  return apiRequest<CountryFeedData[]>('/api/feed/countries/v2');
}
