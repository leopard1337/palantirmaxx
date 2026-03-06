import { NextRequest, NextResponse } from 'next/server';
import type { FlightData } from '@/lib/api/types';

const OPENSKY_URL = 'https://opensky-network.org/api/states/all';

function openskyStateToFlightData(
  icao24: string,
  arr: unknown[],
  ts: number
): FlightData | null {
  const lon = arr[5] as number | null;
  const lat = arr[6] as number | null;
  if (lon == null || lat == null || typeof lon !== 'number' || typeof lat !== 'number') return null;
  const onGround = arr[8] === true;
  const baroAlt = (arr[7] as number | null) ?? 0;
  const velocity = (arr[9] as number | null) ?? 0;
  const callsign = (arr[1] as string)?.trim() || icao24;
  const origin = (arr[2] as string) ?? '';

  const feet = baroAlt > 0 ? Math.round(baroAlt * 3.28084) : 0;
  const knots = Math.round(velocity * 1.94384);

  return {
    id: icao24,
    aircraft: '',
    type: '',
    category: origin || 'Other',
    origin,
    callsign,
    registration: '',
    hex: icao24,
    position: { lat, lon },
    location: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
    altitude: { feet, km: baroAlt / 1000 },
    speed: { knots, kmh: Math.round(velocity * 3.6) },
    squawk: (arr[14] as string) || null,
    timestamp: (arr[4] as number) ?? ts,
  };
}

export async function GET(request: NextRequest) {
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '50', 10) || 50, 200);

  try {
    const res = await fetch(OPENSKY_URL, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 15 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `OpenSky ${res.status}` },
        { status: res.status }
      );
    }
    const data = (await res.json()) as { time?: number; states?: unknown[][] };
    const states = data?.states ?? [];
    const ts = data?.time ?? Math.floor(Date.now() / 1000);

    const flights: FlightData[] = [];
    for (const arr of states) {
      if (!Array.isArray(arr) || arr.length < 10) continue;
      const icao24 = String(arr[0] ?? '');
      if (!icao24) continue;
      const onGround = arr[8] === true;
      if (onGround) continue;
      const flight = openskyStateToFlightData(icao24, arr, ts);
      if (flight) flights.push(flight);
    }

    flights.sort((a, b) => (b.altitude.feet ?? 0) - (a.altitude.feet ?? 0));
    return NextResponse.json(flights.slice(0, limit));
  } catch (err) {
    console.error('[opensky]', err);
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
