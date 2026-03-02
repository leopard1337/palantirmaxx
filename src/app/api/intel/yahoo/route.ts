import { NextRequest, NextResponse } from 'next/server';

/** Yahoo Finance chart API (unofficial). No key. Used for VIX, etc. */
const YAHOO_CHART = 'https://query1.finance.yahoo.com/v8/finance/chart';

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol') ?? '^VIX';
  const range = request.nextUrl.searchParams.get('range') ?? '1y';
  const interval = request.nextUrl.searchParams.get('interval') ?? '1d';
  try {
    const url = `${YAHOO_CHART}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Palantir-Intel/1.0 (https://github.com)' },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Yahoo ${res.status}`);
    const data = (await res.json()) as {
      chart?: {
        result?: Array<{
          timestamp?: number[];
          indicators?: {
            quote?: Array<{ close?: (number | null)[] }>;
          };
        }>;
      };
    };
    const result = data?.chart?.result?.[0];
    const timestamps = result?.timestamp ?? [];
    const closes = result?.indicators?.quote?.[0]?.close ?? [];
    const points = timestamps
      .map((ts, i) => {
        const v = closes[i];
        if (v == null || typeof v !== 'number') return null;
        const d = new Date(ts * 1000);
        const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        return { date, value: v };
      })
      .filter((p): p is { date: string; value: number } => p != null);
    return NextResponse.json(
      { data: points },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err), data: [] }, { status: 502 });
  }
}
