import { apiRequest } from './client';
import type { FeedItem, FeedResponse } from './types';

export async function fetchFeed(params: {
  page: number;
  count: number;
  type?: 'osint' | 'news' | 'tweet' | 'telegram';
}): Promise<{ items: FeedItem[]; total: number; totalPages: number }> {
  const search: Record<string, string> = {
    page: String(params.page),
    count: String(params.count),
  };
  if (params.type) search.type = params.type;

  const data = await apiRequest<FeedResponse>('/api/feed/v2', search);
  const items = data?.items ?? [];

  return {
    items,
    total: data?.total ?? items.length,
    totalPages: data?.total_pages ?? 0,
  };
}
