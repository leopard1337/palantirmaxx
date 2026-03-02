import type { FeedItem } from './types';

function getApiUrl(path: string, params?: Record<string, string>): string {
  const base =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const url = new URL(path, base);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

/** Raw item from WorldMonitor API - flexible for unknown schema */
interface WorldMonitorRawItem {
  id?: string;
  message_id?: number;
  text?: string;
  content?: string;
  message?: string;
  body?: string;
  channel?: string;
  channel_name?: string;
  source?: string;
  date?: number;
  timestamp?: number;
  created_at?: number;
  link?: string;
  url?: string;
  [key: string]: unknown;
}

function normalizeToFeedItem(raw: WorldMonitorRawItem, index: number): FeedItem {
  const text = raw.text ?? raw.content ?? raw.message ?? raw.body ?? '';
  const channel = raw.channel ?? raw.channel_name ?? raw.source ?? 'Unknown';
  const ts =
    raw.timestamp ?? raw.date ?? raw.created_at ?? Date.now() - index * 1000;
  const link = raw.link ?? raw.url ?? '';
  const id =
    raw.id ??
    `wm-${raw.message_id ?? ts}-${(text.slice(0, 50) + link).replace(/\W/g, '')}`;

  return {
    id: String(id),
    timestamp: typeof ts === 'number' ? ts : Date.now(),
    tweet: null,
    news: null,
    reddit: null,
    telegram: {
      feed_item_id: String(id),
      text,
      channel,
      timestamp: typeof ts === 'number' ? ts : Date.now(),
      link: link || `https://t.me/${channel}`,
    },
    osint: false,
    related_markets: [],
    edges: null,
  };
}

function getDedupKey(item: FeedItem): string {
  const t = item.telegram;
  if (!t) return item.id;
  return `${t.link || ''}|${t.text?.slice(0, 200) || ''}|${t.timestamp}`;
}

export async function fetchWorldMonitorTelegram(limit = 50): Promise<FeedItem[]> {
  const url = getApiUrl('/api/proxy/worldmonitor-telegram', { limit: String(limit) });

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 30 },
  });

  if (!res.ok) {
    throw new Error(`WorldMonitor API error ${res.status}: ${await res.text()}`);
  }

  const data = await res.json();

  const rawItems: WorldMonitorRawItem[] = Array.isArray(data)
    ? data
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data?.posts)
        ? data.posts
        : Array.isArray(data?.feeds)
          ? data.feeds
          : [];

  const items = rawItems.map((raw, i) => normalizeToFeedItem(raw, i));

  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getDedupKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
