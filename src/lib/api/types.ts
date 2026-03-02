export interface TweetUser {
  uid: string;
  handle: string;
  display_name: string;
  pfp: string;
}

export interface TweetData {
  feed_item_id: string;
  post_id: string;
  post_type: string;
  created_at: number;
  user: TweetUser;
  tags?: string[];
  body: string;
  link: string;
}

export interface TelegramData {
  feed_item_id: string;
  text: string;
  channel: string;
  timestamp: number;
  link: string;
}

export interface NewsData {
  feed_item_id: string;
  title: string;
  body: string;
  headline?: string;
  description?: string;
  source: string;
  url: string;
  published_at?: number;
  timestamp?: number;
  image?: string;
}

export interface RelatedMarket {
  id: string;
  slug: string;
  condition_id: string;
  title: string;
  question: string;
  description: string;
  image: string;
  yes_probability: number;
  yes_best_bid: number;
  yes_best_ask: number;
  yes_spread: number;
  no_probability: number;
  no_best_bid: number;
  no_best_ask: number;
  no_spread: number;
  volume: number;
  liquidity: number;
  neg_risk: boolean;
  end_date: string;
  categories: string[];
  source: string;
  relevance_score: number;
  impact_level: string;
  impact_reason: string;
  event_id: string;
  event_title: string;
  event_slug: string;
  detected_yes_price: number;
  detected_no_price: number;
  detected_at: number;
  highest_price_change: number;
  highest_yes_price: number;
  highest_no_price: number;
  first_moved_at?: number;
  moved_side?: string;
  peaked_at?: number;
  causation_label?: string;
  causation_reason?: string;
}

export interface FeedItem {
  id: string;
  timestamp: number;
  tweet: TweetData | null;
  news: NewsData | null;
  reddit: unknown | null;
  telegram: TelegramData | null;
  osint: boolean;
  country?: string;
  countries?: string[];
  related_markets: RelatedMarket[];
  edges: unknown | null;
  topics?: string[];
  categories?: string[];
}

export type FeedSourceType = 'tweet' | 'news' | 'telegram' | 'osint';

export interface FeedResponse {
  count: number;
  items: FeedItem[];
  page: number;
  total: number;
  total_pages: number;
}

export interface EventMarket {
  id: string;
  slug: string;
  condition_id: string;
  event_id: string;
  title: string;
  question: string;
  description: string;
  image: string;
  yes_probability: number;
  yes_best_bid: number;
  yes_best_ask: number;
  yes_spread: number;
  no_probability: number;
  no_best_bid: number;
  no_best_ask: number;
  no_spread: number;
  volume: number;
  liquidity: number;
  neg_risk: boolean;
  end_date: string;
  categories: string[];
  source: string;
}

export interface EventData {
  id: string;
  title: string;
  description: string;
  image: string;
  volume: number;
  liquidity: number;
  markets: EventMarket[];
}

export interface MoverEntry {
  rank: number;
  feed_item: FeedItem;
}

export interface HealthResponse {
  status: string;
  server_time?: number;
}

export interface FlightData {
  id: string;
  aircraft: string;
  type: string;
  category: string;
  origin: string;
  callsign: string;
  registration: string;
  hex: string;
  position: { lat: number; lon: number };
  location: string;
  altitude: { feet: number; km: number };
  speed: { knots: number; kmh: number };
  squawk: string | null;
  timestamp: number;
}

export interface WhaleTradeMarket {
  id: string;
  slug: string;
  title: string;
  question: string;
  image: string;
  yes_probability: number;
  no_probability: number;
  volume: number;
  categories: string[] | null;
}

export interface WhaleTradeData {
  wallet: string;
  trade_id: string;
  timestamp: number;
  venue: string;
  side: string;
  outcome: string;
  price: number;
  shares: number;
  amount: number;
  market: WhaleTradeMarket;
  transaction_hash: string;
  wallet_age: number;
  all_time_pnl: number;
  win_rate: number;
  is_whale: boolean;
}

export interface CountryFeedData {
  country: string;
  count: number;
  recent: FeedItem[];
}
