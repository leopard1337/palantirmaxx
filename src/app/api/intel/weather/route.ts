import { NextResponse } from 'next/server';

/** Proxy for Weather.gov - no external URLs exposed to client */
const WEATHER_URL = 'https://api.weather.gov/alerts/active';

export async function GET() {
  try {
    const res = await fetch(WEATHER_URL, {
      headers: { Accept: 'application/json', 'User-Agent': 'Palantir-Intel/1.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`Weather ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    return NextResponse.json({ features: [], error: String(err) }, { status: 502 });
  }
}
