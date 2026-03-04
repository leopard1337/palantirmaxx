import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const originalFetch = globalThis.fetch;

describe('API route integrations', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  describe('fred', () => {
    const baseUrl = 'http://localhost/api/intel/fred';
    let originalFredKey: string | undefined;

    beforeEach(() => {
      originalFredKey = process.env.FRED_API_KEY;
      process.env.FRED_API_KEY = 'test-key';
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              observations: [
                { date: '2024-01-01', value: '5.0' },
                { date: '2024-01-02', value: '5.1' },
              ],
            }),
        })
      );
    });

    it('sanitizes series_id to alphanumeric', async () => {
      const { GET } = await import('../intel/fred/route');
      const req = new NextRequest(`${baseUrl}?series_id=UNRATE;DROP`);
      await GET(req);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('series_id=UNRATE'),
        expect.any(Object)
      );
    });

    it('clamps limit to max 500', async () => {
      const { GET } = await import('../intel/fred/route');
      const req = new NextRequest(`${baseUrl}?limit=999`);
      await GET(req);
      expect(fetch).toHaveBeenCalledWith(
        expect.stringMatching(/limit=500/),
        expect.any(Object)
      );
    });

    afterEach(() => {
      if (originalFredKey !== undefined) {
        process.env.FRED_API_KEY = originalFredKey;
      } else {
        delete process.env.FRED_API_KEY;
      }
    });
  });

  describe('coingecko', () => {
    const baseUrl = 'http://localhost/api/intel/coingecko';

    beforeEach(() => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          json: () => Promise.resolve({ bitcoin: { usd: 50000 } }),
        })
      );
    });

    it('sanitizes ids - rejects invalid chars and uses defaults when empty', async () => {
      const { GET } = await import('../intel/coingecko/route');
      const req = new NextRequest(`${baseUrl}?ids=bitcoin<script>,ethereum`);
      await GET(req);
      const callUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] ?? '';
      expect(callUrl).toMatch(/ids=/);
      expect(callUrl).not.toContain('<');
      expect(callUrl).not.toContain('>');
    });
  });
});
