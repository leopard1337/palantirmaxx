import { NextResponse } from 'next/server';

/** Proxy for GDACS - no external URLs exposed to client */
const GDACS_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP';

export async function GET() {
  try {
    const res = await fetch(GDACS_URL, {
      headers: { Accept: 'application/json', 'User-Agent': 'Palantir-Intel/1.0' },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`GDACS ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    return NextResponse.json({ features: [], error: String(err) }, { status: 502 });
  }
}
