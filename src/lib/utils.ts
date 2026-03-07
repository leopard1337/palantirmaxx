import type { FeedItem } from './api/types';
import type { TopicOption } from './constants';

export function getFeedSourceType(item: FeedItem): 'tweet' | 'telegram' | 'news' {
  if (item.tweet) return 'tweet';
  if (item.telegram) return 'telegram';
  return 'news';
}

export function getFeedBody(item: FeedItem): string {
  if (item.tweet) return item.tweet.body ?? '';
  if (item.telegram) return item.telegram.text ?? '';
  if (item.news) {
    return (
      item.news.body ||
      item.news.description ||
      item.news.headline ||
      item.news.title ||
      ''
    );
  }
  return '';
}

export function getFeedTitle(item: FeedItem): string {
  if (item.news) return item.news.headline || item.news.title || '';
  if (item.tweet) return '';
  if (item.telegram) return '';
  return '';
}

export function getFeedSourceLabel(item: FeedItem): string {
  if (item.tweet) return `@${item.tweet.user?.handle ?? 'unknown'}`;
  if (item.telegram) return item.telegram.channel;
  if (item.news) return item.news.source;
  return 'OSINT';
}

export function getFeedLink(item: FeedItem): string | null {
  if (item.tweet) return item.tweet.link;
  if (item.telegram) return item.telegram.link;
  if (item.news) return item.news.url;
  return null;
}

export function formatVolume(vol: number): string {
  if (vol >= 1_000_000) return `$${(vol / 1_000_000).toFixed(1)}M`;
  if (vol >= 1_000) return `$${(vol / 1_000).toFixed(0)}K`;
  return `$${vol.toFixed(0)}`;
}

/** Format USD for display */
export function formatUsd(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  if (value >= 1_000_000) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1_000) return `$${(value / 1e3).toFixed(1)}K`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toExponential(2)}`;
}

/** Format token amount (K, M, B) */
export function formatTokenAmount(amount: number, decimals = 6): string {
  const raw = amount / 10 ** decimals;
  if (raw >= 1e9) return `${(raw / 1e9).toFixed(2)}B`;
  if (raw >= 1e6) return `${(raw / 1e6).toFixed(2)}M`;
  if (raw >= 1e3) return `${(raw / 1e3).toFixed(1)}K`;
  return raw.toLocaleString(undefined, { maximumFractionDigits: 4 });
}

/** Format SOL amount */
export function formatSol(lamports: number): string {
  const sol = lamports / 1e9;
  if (sol >= 1_000) return `${(sol / 1e3).toFixed(1)}K SOL`;
  if (sol >= 1) return `${sol.toFixed(2)} SOL`;
  return `${sol.toFixed(4)} SOL`;
}

/** Normalize API timestamp to ms. APIs often use Unix seconds (10 digits). */
function toTimestampMs(value: unknown): number {
  if (value == null) return Date.now();
  const n = typeof value === 'string' ? parseFloat(value) : Number(value);
  if (!Number.isFinite(n) || n <= 0) return Date.now();
  if (n < 1e12) return n * 1000;
  return n;
}

/** Best timestamp for a feed item in ms — prefers source-specific fields. */
export function getFeedTimestamp(item: FeedItem | null | undefined): number {
  if (!item || typeof item !== 'object') return Date.now();
  const raw =
    item.tweet?.created_at ??
    item.news?.published_at ?? item.news?.timestamp ??
    item.telegram?.timestamp ??
    item.timestamp;
  return toTimestampMs(raw);
}

export function formatTimeAgo(timestamp: number | string | unknown): string {
  const timestampMs = toTimestampMs(timestamp);
  const diffMs = Date.now() - timestampMs;
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

export function formatProbability(p: number): string {
  return `${Math.round(p * 100)}%`;
}

const countryFlags: Record<string, string> = {
  US: '\u{1F1FA}\u{1F1F8}', IL: '\u{1F1EE}\u{1F1F1}', IR: '\u{1F1EE}\u{1F1F7}',
  RU: '\u{1F1F7}\u{1F1FA}', UA: '\u{1F1FA}\u{1F1E6}', CN: '\u{1F1E8}\u{1F1F3}',
  LB: '\u{1F1F1}\u{1F1E7}', SY: '\u{1F1F8}\u{1F1FE}', IQ: '\u{1F1EE}\u{1F1F6}',
  KP: '\u{1F1F0}\u{1F1F5}', KR: '\u{1F1F0}\u{1F1F7}', JP: '\u{1F1EF}\u{1F1F5}',
  GB: '\u{1F1EC}\u{1F1E7}', DE: '\u{1F1E9}\u{1F1EA}', FR: '\u{1F1EB}\u{1F1F7}',
  YE: '\u{1F1FE}\u{1F1EA}', SA: '\u{1F1F8}\u{1F1E6}', PK: '\u{1F1F5}\u{1F1F0}',
  IN: '\u{1F1EE}\u{1F1F3}', TW: '\u{1F1F9}\u{1F1FC}',
};

export function getCountryFlag(code: string): string {
  return countryFlags[code.toUpperCase()] ?? code;
}

export function getItemSeverity(item: FeedItem): string | null {
  return item.related_markets?.[0]?.impact_level ?? null;
}

export function itemMatchesTopic(item: FeedItem, topic: TopicOption): boolean {
  const itemTopics = item.topics;
  if (!itemTopics || itemTopics.length === 0) return false;
  return itemTopics.some((t) => {
    const lower = t.toLowerCase();
    return topic.keywords.some(
      (kw) => lower.includes(kw) || kw.includes(lower),
    );
  });
}
