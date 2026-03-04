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

  const glintData = await apiRequest<FeedResponse>('/api/feed/v2', search);
  const glintItems = glintData?.items ?? [];

  return {
    items: glintItems,
    total: glintData?.total ?? glintItems.length,
    totalPages: glintData?.total_pages ?? 0,
  };
}
