import { NextRequest, NextResponse } from 'next/server';

/** Proxy for WorldMonitor telegram feed - no external URLs exposed to client */
const WM_URL = 'https://api.worldmonitor.app/api/telegram-feed';

export async function GET(request: NextRequest) {
  const limit = request.nextUrl.searchParams.get('limit') ?? '50';
  try {
    const res = await fetch(`${WM_URL}?limit=${limit}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 30 },
    });
    if (!res.ok) throw new Error(`WorldMonitor ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json([], { status: 502 });
  }
}
