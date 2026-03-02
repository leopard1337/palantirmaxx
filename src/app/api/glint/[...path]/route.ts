import { NextRequest, NextResponse } from 'next/server';

/** Proxies Glint API - all requests appear to come from our domain */
const GLINT_BASE = 'https://api.glint.trade';

export async function GET(request: NextRequest) {
  const token = process.env.NEXT_PUBLIC_GLINT_BEARER ?? process.env.GLINT_BEARER;
  if (!token) {
    return NextResponse.json({ error: 'Glint token not configured' }, { status: 503 });
  }
  const path = request.nextUrl.pathname.replace(/^\/api\/glint/, '') || '/';
  const url = new URL(path + request.nextUrl.search, GLINT_BASE);
  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
      next: { revalidate: 10 },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}

export async function POST(request: NextRequest) {
  const token = process.env.NEXT_PUBLIC_GLINT_BEARER ?? process.env.GLINT_BEARER;
  if (!token) {
    return NextResponse.json({ error: 'Glint token not configured' }, { status: 503 });
  }
  const path = request.nextUrl.pathname.replace(/^\/api\/glint/, '') || '/';
  const url = new URL(path + request.nextUrl.search, GLINT_BASE);
  try {
    const body = await request.text();
    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body || undefined,
      next: { revalidate: 10 },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
