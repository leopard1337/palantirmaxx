import { NextRequest, NextResponse } from 'next/server';

/** Yahoo Finance chart API (unofficial). No key. Used for VIX, etc. */
const YAHOO_CHART = 'https://query1.finance.yahoo.com/v8/finance/chart';
const SYMBOL_REGEX = /^[A-Za-z0-9^.-]{1,20}$/;
const RANGE_VALUES = new Set(['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max']);
const INTERVAL_VALUES = new Set(['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo']);

function sanitizeSymbol(raw: string | null): string {
  const s = (raw ?? '^VIX').trim();
  return SYMBOL_REGEX.test(s) ? s : '^VIX';
}

function sanitizeRange(raw: string | null): string {
  const r = (raw ?? '1y').toLowerCase();
  return RANGE_VALUES.has(r) ? r : '1y';
}

function sanitizeInterval(raw: string | null): string {
  const i = (raw ?? '1d').toLowerCase();
  return INTERVAL_VALUES.has(i) ? i : '1d';
}

export async function GET(request: NextRequest) {
  const symbol = sanitizeSymbol(request.nextUrl.searchParams.get('symbol'));
  const range = sanitizeRange(request.nextUrl.searchParams.get('range'));
  const interval = sanitizeInterval(request.nextUrl.searchParams.get('interval'));
  try {
    const url = `${YAHOO_CHART}/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Quantis-Intel/1.0 (https://github.com)' },
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
