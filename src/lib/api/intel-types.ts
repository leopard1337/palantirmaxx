/** Intelligence / WorldMonitor & external API response types */

export interface CryptoQuote {
  id?: string;
  symbol?: string;
  name?: string;
  price?: number;
  priceUsd?: number;
  change24h?: number;
  change7d?: number;
  marketCap?: number;
  volume24h?: number;
}

export interface StablecoinMarket {
  id: string;
  symbol: string;
  name: string;
  price: number;
  deviation?: number;
  pegStatus?: string;
  marketCap?: number;
  volume24h?: number;
  change24h?: number;
  change7d?: number;
  image?: string;
}

export interface StablecoinSummary {
  timestamp?: string;
  totalMarketCap?: number;
  totalVolume24h?: number;
  coinCount?: number;
  depeggedCount?: number;
  healthStatus?: string;
}

export interface FREDDataPoint {
  date: string;
  value: number;
}

export interface EnergyPrice {
  commodity?: string;
  price?: number;
  unit?: string;
  date?: string;
  change?: number;
}

export interface Earthquake {
  id?: string;
  place?: string;
  magnitude?: number;
  depthKm?: number;
  location?: { latitude?: number; longitude?: number };
  occurredAt?: string;
  sourceUrl?: string;
}

export interface GDACSFeature {
  type: 'Feature';
  geometry?: { type: string; coordinates: number[] };
  properties?: {
    eventid?: string | number;
    episodeid?: string | number;
    eventname?: string;
    name?: string;
    description?: string;
    fromdate?: string;
    todate?: string;
    alertlevel?: string;
    alertscore?: number;
    eventtype?: string;
    country?: string;
    severitydata?: { severity?: number; severitytext?: string };
  };
}

export interface WeatherAlert {
  id?: string;
  properties?: {
    areaDesc?: string;
    headline?: string;
    description?: string;
    severity?: string;
    event?: string;
    effective?: string;
    expires?: string;
    status?: string;
  };
}
