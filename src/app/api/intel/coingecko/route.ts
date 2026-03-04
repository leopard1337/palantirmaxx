import { NextRequest, NextResponse } from 'next/server';

const CG_BASE = 'https://api.coingecko.com/api/v3';
const ID_REGEX = /^[a-z0-9_-]+$/i;

function sanitizeIds(raw: string | null): string {
  const defaultIds = 'bitcoin,ethereum,solana';
  const str = (raw ?? defaultIds).trim();
  if (!str) return defaultIds;
  const valid = str
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && ID_REGEX.test(s))
    .slice(0, 20);
  return valid.length > 0 ? valid.join(',') : defaultIds;
}

export async function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get('type');
  const ids = sanitizeIds(request.nextUrl.searchParams.get('ids'));

  try {
    let url: string;
    if (type === 'stablecoins') {
      url = `${CG_BASE}/coins/markets?vs_currency=usd&ids=tether,usd-coin,dai,first-digital-usd,ethena-usde&order=market_cap_desc`;
    } else {
      url = `${CG_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`;
    }

    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
