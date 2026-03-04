import { NextRequest, NextResponse } from 'next/server';

const WM_BASE = 'https://api.worldmonitor.app/api';
const ALLOWED_PREFIXES = [
  '/market/',
  '/economic/',
  '/intelligence/',
  '/bootstrap',
];
const ALLOWED_QUERY_KEYS = new Set([
  'limit', 'page', 'offset', 'series_id', 'country', 'country_code',
  'start', 'end', 'format', 'sort', 'order', 'ids', 'coins',
]);

function filterParams(params: URLSearchParams): URLSearchParams {
  const filtered = new URLSearchParams();
  params.forEach((v, k) => {
    const key = k.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (key && ALLOWED_QUERY_KEYS.has(key) && v.length < 200) {
      filtered.set(k, v);
    }
  });
  return filtered;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  const subPath = path.join('/');
  const fullPath = `/${subPath}`;
  const allowed = ALLOWED_PREFIXES.some((p) =>
    p.endsWith('/') ? fullPath.startsWith(p) : fullPath === p,
  );
  if (!allowed) {
    return NextResponse.json({ error: 'Path not allowed' }, { status: 403 });
  }

  const url = new URL(fullPath, WM_BASE);
  filterParams(request.nextUrl.searchParams).forEach((v, k) =>
    url.searchParams.set(k, v),
  );

  try {
    const res = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 502 },
    );
  }
}
