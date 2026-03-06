/** Minimal types for CLI data layer - mirrors app API responses */

export interface CryptoQuote {
  id: string;
  symbol: string;
  price?: number;
  priceUsd?: number;
  change24h?: number;
}

export interface TrendItem {
  title: string;
  traffic?: string;
  publishedAt?: string;
  articles: Array< { title: string; url: string; source: string }>;
}

export interface ISSData {
  lat: number;
  lng: number;
  people?: number;
  astros?: Array<{ name: string; craft: string }>;
}

export interface RelatedMarket {
  id: string;
  slug: string;
  title: string;
  question: string;
  yes_probability: number;
  no_probability: number;
  volume: number;
  event_id: string;
  event_title: string;
}

export interface FeedItem {
  id: string;
  timestamp: number;
  body?: string;
  related_markets?: RelatedMarket[];
}

export interface EventMarket {
  id: string;
  slug: string;
  title: string;
  question: string;
  yes_probability: number;
  no_probability: number;
  volume: number;
  event_id: string;
}

export interface AgentSignal {
  type: 'buy' | 'sell' | 'hold' | 'watch';
  confidence: number;
  reason: string;
  market?: { id: string; question: string; slug?: string };
  metadata?: Record<string, unknown>;
}
