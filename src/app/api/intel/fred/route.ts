import { NextRequest, NextResponse } from 'next/server';

/** FRED API - economic series. Requires FRED_API_KEY in .env.local (free at research.stlouisfed.org) */
const FRED_BASE = 'https://api.stlouisfed.org/fred/series/observations';

export async function GET(request: NextRequest) {
  const key = process.env.FRED_API_KEY;
  if (!key) {
    return NextResponse.json({ error: 'FRED_API_KEY not configured', data: [] }, { status: 503 });
  }
  const seriesId = request.nextUrl.searchParams.get('series_id') ?? 'UNRATE';
  const limit = request.nextUrl.searchParams.get('limit') ?? '120';
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
