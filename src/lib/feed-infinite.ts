/**
 * Shared utilities for feed infinite queries.
 * Ensures consistent, defensive handling of pagination and page data.
 */

import type { FeedItem } from '@/lib/api/types';

export interface FeedPage {
  items?: FeedItem[] | null;
  total?: number;
  totalPages?: number;
}

/**
 * Safe getNextPageParam for useInfiniteQuery with feed data.
 * Handles undefined/malformed lastPage and allPages gracefully.
 */
export function getFeedNextPageParam(
  lastPage: unknown,
  allPages: unknown,
  pageSize: number,
): number | undefined {
  try {
    const items = (lastPage as FeedPage | null)?.items ?? [];
    const itemCount = Array.isArray(items) ? items.length : 0;
    const pages = Array.isArray(allPages) ? allPages : [];
    const pageCount = pages.length;
    return itemCount >= pageSize ? pageCount + 1 : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Flatten and dedupe items from infinite query pages.
 * Safe against undefined pages or malformed page.items.
 */
export function flattenFeedPages(
  pages: unknown,
): FeedItem[] {
  const pageList = Array.isArray(pages) ? pages : [];
  const seen = new Set<string>();
  const result: FeedItem[] = [];

  for (const p of pageList) {
    const items = (p as FeedPage | null)?.items ?? [];
    const list = Array.isArray(items) ? items : [];
    for (const item of list) {
      if (item != null && typeof item === 'object' && typeof (item as FeedItem).id === 'string') {
        const id = (item as FeedItem).id;
        if (!seen.has(id)) {
          seen.add(id);
          result.push(item as FeedItem);
        }
      }
    }
  }
  return result;
}

/**
 * Get total count from first page, safely.
 */
export function getFeedTotalCount(pages: unknown): number {
  const pageList = Array.isArray(pages) ? pages : [];
  const first = pageList[0] as FeedPage | null | undefined;
  return typeof first?.total === 'number' ? first.total : 0;
}
