import { NextRequest, NextResponse } from 'next/server';

/** FRED API - economic series. Requires FRED_API_KEY in .env.local (free at research.stlouisfed.org) */
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

const SERIES_ID_REGEX = /^[A-Za-z0-9_-]{1,32}$/;
const LIMIT_MIN = 1;
const LIMIT_MAX = 500;

function sanitizeSeriesId(raw: string | null): string {
  const id = (raw ?? 'UNRATE').trim();
  return SERIES_ID_REGEX.test(id) ? id : 'UNRATE';
}

function parseLimit(raw: string | null): number {
  const n = parseInt(raw ?? '120', 10);
  if (Number.isNaN(n) || n < LIMIT_MIN) return 120;
  return Math.min(n, LIMIT_MAX);
}

export async function GET(request: NextRequest) {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'FRED_API_KEY not configured', data: [] }, { status: 503 });
  }
  const seriesId = sanitizeSeriesId(request.nextUrl.searchParams.get('series_id'));
  const limit = parseLimit(request.nextUrl.searchParams.get('limit'));
  try {
    const url = `${FRED_BASE}?series_id=${encodeURIComponent(seriesId)}&api_key=${encodeURIComponent(key)}&file_type=json&limit=${limit}&sort_order=desc`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });
    if (!res.ok) throw new Error(`FRED ${res.status}`);
    const data = (await res.json()) as {
      observations?: Array<{ date?: string; value?: string }>;
    };
    const obs = data?.observations ?? [];
    const points = obs
      .filter((o) => o.value != null && o.value !== '.')
      .map((o) => ({ date: o.date ?? '', value: parseFloat(String(o.value)) }));
    points.reverse(); // chronological for sparklines
    return NextResponse.json({ data: points });
  } catch (err) {
    return NextResponse.json({ error: String(err), data: [] }, { status: 502 });
  }
}
