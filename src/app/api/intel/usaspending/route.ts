import { NextRequest, NextResponse } from 'next/server';

/** Proxy for USA Spending API - no external URLs exposed to client */
const BASE = 'https://api.usaspending.gov/api/v2/search/spending_by_award/';
const MAX_BODY = 100 * 1024; // 100KB

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    if (body.length > MAX_BODY) {
      return NextResponse.json({ results: [], total: 0, error: 'Request body too large' }, { status: 413 });
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(body || '{}');
    } catch {
      return NextResponse.json({ results: [], total: 0, error: 'Invalid JSON' }, { status: 400 });
    }
    if (parsed != null && typeof parsed !== 'object') {
      return NextResponse.json({ results: [], total: 0, error: 'Body must be JSON object' }, { status: 400 });
    }
    const res = await fetch(BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(parsed ?? {}),
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`USA Spending ${res.status}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ results: [], total: 0, error: String(err) }, { status: 502 });
  }
}
