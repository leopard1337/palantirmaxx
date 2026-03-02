import { NextRequest, NextResponse } from 'next/server';

/** Treasury Fiscal Data - avg interest rates. Treasury Notes≈10Y, Bills≈short. No key. */
const BASE = 'https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/avg_interest_rates';

export async function GET(request: NextRequest) {
  const limit = request.nextUrl.searchParams.get('limit') ?? '60';
  try {
    const url = `${BASE}?sort=-record_date&page_size=${Math.min(Number(limit) || 60, 500)}`;
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
