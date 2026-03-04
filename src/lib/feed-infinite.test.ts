import { describe, it, expect } from 'vitest';
import {
  getFeedNextPageParam,
  flattenFeedPages,
  getFeedTotalCount,
} from './feed-infinite';
import type { FeedItem } from '@/lib/api/types';

const mockItem = (id: string): FeedItem =>
  ({
    id,
    timestamp: Date.now(),
    tweet: null,
    news: null,
    reddit: null,
    telegram: null,
    osint: false,
    related_markets: [],
    edges: null,
  }) as FeedItem;

describe('getFeedNextPageParam', () => {
  it('returns next page when items length >= pageSize', () => {
    const lastPage = { items: [mockItem('1'), mockItem('2')], total: 10 };
    const allPages = [lastPage];
    expect(getFeedNextPageParam(lastPage, allPages, 2)).toBe(2);
  });

  it('returns undefined when items length < pageSize', () => {
    const lastPage = { items: [mockItem('1')], total: 10 };
    const allPages = [lastPage];
    expect(getFeedNextPageParam(lastPage, allPages, 2)).toBeUndefined();
  });

  it('returns undefined when lastPage is null/undefined', () => {
    expect(getFeedNextPageParam(null, [], 20)).toBeUndefined();
    expect(getFeedNextPageParam(undefined, [], 20)).toBeUndefined();
  });

  it('handles malformed lastPage with missing items', () => {
    expect(getFeedNextPageParam({}, [], 20)).toBeUndefined();
    expect(getFeedNextPageParam({ items: null }, [], 20)).toBeUndefined();
  });

  it('handles non-array items', () => {
    const lastPage = { items: 'not-array', total: 5 };
    expect(getFeedNextPageParam(lastPage, [lastPage], 5)).toBeUndefined();
  });
});

describe('flattenFeedPages', () => {
  it('flattens and dedupes items by id', () => {
    const pages = [
      { items: [mockItem('a'), mockItem('b')] },
      { items: [mockItem('b'), mockItem('c')] },
    ];
    const result = flattenFeedPages(pages);
    expect(result).toHaveLength(3);
    expect(result.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });

  it('returns empty array for empty pages', () => {
    expect(flattenFeedPages([])).toEqual([]);
    expect(flattenFeedPages([{ items: [] }])).toEqual([]);
  });

  it('handles undefined pages', () => {
    expect(flattenFeedPages(undefined)).toEqual([]);
  });

  it('skips malformed items without id', () => {
    const pages = [
      { items: [{ foo: 'bar' }, mockItem('valid')] },
    ];
    const result = flattenFeedPages(pages);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('valid');
  });

  it('ignores non-array pages', () => {
    expect(flattenFeedPages(null)).toEqual([]);
  });
});

describe('getFeedTotalCount', () => {
  it('returns total from first page', () => {
    const pages = [{ total: 42, items: [] }];
    expect(getFeedTotalCount(pages)).toBe(42);
  });

  it('returns 0 when first page has no total', () => {
    expect(getFeedTotalCount([{}])).toBe(0);
    expect(getFeedTotalCount([{ items: [] }])).toBe(0);
  });

  it('returns 0 for empty pages', () => {
    expect(getFeedTotalCount([])).toBe(0);
  });

  it('returns 0 for undefined pages', () => {
    expect(getFeedTotalCount(undefined)).toBe(0);
  });

  it('handles non-numeric total', () => {
    expect(getFeedTotalCount([{ total: 'invalid' }])).toBe(0);
  });
});
