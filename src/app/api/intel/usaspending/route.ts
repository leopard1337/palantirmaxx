import { NextRequest, NextResponse } from 'next/server';

/** Proxy for USA Spending API - no external URLs exposed to client */
const BASE = 'https://api.usaspending.gov/api/v2/search/spending_by_award/';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const res = await fetch(BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body || '{}',
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`USA Spending ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ results: [], total: 0, error: String(err) }, { status: 502 });
  }
}
