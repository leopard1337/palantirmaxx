import { apiRequest } from './client';
import type { FeedItem, FeedResponse } from './types';
import { fetchWorldMonitorTelegram } from './worldmonitor';

function dedupeByContent(items: FeedItem[]): FeedItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const link = item.telegram?.link ?? item.news?.url ?? item.tweet?.link ?? '';
    const text =
      item.telegram?.text ??
      item.news?.body ??
      item.news?.description ??
      item.tweet?.body ??
      '';
    const key = `${link}|${text.slice(0, 150)}|${item.timestamp}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchFeed(params: {
  page: number;
  count: number;
  type?: 'osint' | 'news' | 'tweet' | 'telegram';
}): Promise<{ items: FeedItem[]; total: number; totalPages: number }> {
  const isTelegram = params.type === 'telegram';

  const [glintRes, worldMonitorItems] = await Promise.allSettled([
    (async () => {
      const search: Record<string, string> = {
        page: String(params.page),
        count: String(params.count),
      };
      if (params.type) search.type = params.type;
      return apiRequest<FeedResponse>('/api/feed/v2', search);
    })(),
    isTelegram
      ? fetchWorldMonitorTelegram(params.count)
      : Promise.resolve([] as FeedItem[]),
  ]);

  const glintData =
    glintRes.status === 'fulfilled' ? glintRes.value : null;
  const glintItems = glintData?.items ?? [];
  const wmItems =
    worldMonitorItems.status === 'fulfilled' ? worldMonitorItems.value : [];

  if (!isTelegram) {
    return {
      items: glintItems,
      total: glintData?.total ?? glintItems.length,
      totalPages: glintData?.total_pages ?? 0,
    };
  }

  const merged = [...glintItems, ...wmItems];
  const deduped = dedupeByContent(merged);
  const sorted = deduped.sort((a, b) => b.timestamp - a.timestamp);
  const offset = (params.page - 1) * params.count;
  const paged = sorted.slice(offset, offset + params.count);

  return {
    items: paged,
    total: sorted.length,
    totalPages: Math.ceil(sorted.length / params.count) || 1,
  };
}
