import type { FeedItem } from './api/types';

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
  if (item.tweet) return `@${item.tweet.user.handle}`;
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

export function formatTimeAgo(timestampMs: number): string {
  const diffMs = Date.now() - timestampMs;
  const diffSec = Math.floor(diffMs / 1000);
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
