import { NextRequest, NextResponse } from 'next/server';

/** Proxies Glint API - all requests appear to come from our domain */
const GLINT_BASE = 'https://api.glint.trade';

function sanitizePath(raw: string): string {
  let path = raw.replace(/^\/api\/glint/, '') || '/';
  try {
    path = decodeURIComponent(path);
  } catch {
    path = path.replace(/%2e/gi, '').replace(/%2f/gi, '');
  }
  path = path
    .replace(/\.\./g, '')
    .replace(/\u200b/g, '')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '') || '/';
  return path.startsWith('/') ? path : `/${path}`;
}

export async function GET(request: NextRequest) {
  const token = process.env.GLINT_BEARER ?? process.env.NEXT_PUBLIC_GLINT_BEARER;
  if (!token) {
    return NextResponse.json({ error: 'Glint token not configured' }, { status: 503 });
  }
  const path = sanitizePath(request.nextUrl.pathname);
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
  const token = process.env.GLINT_BEARER ?? process.env.NEXT_PUBLIC_GLINT_BEARER;
  if (!token) {
    return NextResponse.json({ error: 'Glint token not configured' }, { status: 503 });
  }
  const path = sanitizePath(request.nextUrl.pathname);
  const url = new URL(path + request.nextUrl.search, GLINT_BASE);
  const MAX_BODY = 100 * 1024; // 100KB
  try {
    const body = await request.text();
    if (body.length > MAX_BODY) {
      return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
    }
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
