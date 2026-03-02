import { describe, it, expect } from 'vitest';
import type { EventData, FeedItem, HealthResponse, MoverEntry } from '../types';

describe('API type contracts', () => {
  it('FeedItem has required fields', () => {
    const valid: FeedItem = {
      id: 'test-id',
      timestamp: Date.now(),
      tweet: null,
      news: null,
      reddit: null,
      telegram: null,
      osint: false,
      related_markets: [],
      edges: null,
    };
    expect(valid.id).toBeDefined();
    expect(typeof valid.timestamp).toBe('number');
  });

  it('EventData has required id and title', () => {
    const valid: EventData = {
      id: 'ev-1',
      title: 'Test Event',
      description: '',
      image: '',
      volume: 0,
      liquidity: 0,
      markets: [],
    };
    expect(valid.id).toBeDefined();
    expect(valid.title).toBeDefined();
  });

  it('MoverEntry has rank and feed_item', () => {
    const valid: MoverEntry = {
      rank: 1,
      feed_item: {
        id: 'fi-1',
        timestamp: Date.now(),
        tweet: null,
        news: null,
        reddit: null,
        telegram: null,
        osint: false,
        related_markets: [],
        edges: null,
      },
    };
    expect(valid.rank).toBe(1);
    expect(valid.feed_item.id).toBeDefined();
  });

  it('HealthResponse has status', () => {
    const valid: HealthResponse = {
      status: 'ok',
      server_time: 12345,
    };
    expect(valid.status).toBeDefined();
  });
});
