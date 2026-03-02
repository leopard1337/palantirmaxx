import { NextResponse } from 'next/server';

/** USGS Earthquake API - free, no key */
const USGS_URL =
  'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson';

export async function GET() {
  try {
    const res = await fetch(USGS_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 300 },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
