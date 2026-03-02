import { NextResponse } from 'next/server';

/** OilPrice API demo - no key, 20 req/hr. WTI, Brent, Natural Gas, etc. */
const URL = 'https://api.oilpriceapi.com/v1/demo/prices';

export async function GET() {
  try {
    const res = await fetch(URL, {
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
