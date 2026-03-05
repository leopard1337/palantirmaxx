import { NextRequest, NextResponse } from 'next/server';

const BLS_V1 = 'https://api.bls.gov/publicAPI/v1/timeseries/data';
const BLS_V2 = 'https://api.bls.gov/publicAPI/v2/timeseries/data/';

/** BLS API - LNS14000000=Unemployment, CUSR0000SA0=CPI. Optional BLS_REGISTRATION_KEY for v2. */
export async function GET(request: NextRequest) {
  const seriesParam = request.nextUrl.searchParams.get('series') ?? 'LNS14000000,CUSR0000SA0';
  const ids = seriesParam.split(',').filter(Boolean);
  if (ids.length === 0) return NextResponse.json({ error: 'No series' }, { status: 400 });

  const regKey = process.env.BLS_REGISTRATION_KEY ?? process.env.FRED_API_KEY;

  // Try v2 POST (higher limits) when registration key is set
  if (regKey && ids.length <= 25) {
    const year = new Date().getFullYear();
    const body = JSON.stringify({
      seriesid: ids,
      startyear: String(year - 5),
      endyear: String(year + 1),
      registrationkey: regKey,
    });
    try {
      const res = await fetch(BLS_V2, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Quantis-Intel/1.0 (https://github.com)',
        },
        body,
        next: { revalidate: 3600 },
      });
      const data = (await res.json()) as {
        status?: string;
        Results?: { series?: Array<{ seriesID?: string; data?: Array<{ year?: string; period?: string; value?: string }> }> };
      };
      if (data?.status === 'REQUEST_SUCCEEDED' && data?.Results?.series?.length) {
        return NextResponse.json(
          { Results: { series: data.Results.series } },
          { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
        );
      }
    } catch {
      /* fall through to v1 */
    }
  }

  // Fallback: v1 GET (no key, ~25 req/day per IP)
  try {
    const headers = { 'User-Agent': 'Quantis-Intel/1.0 (https://github.com)' };
    const results = await Promise.all(
      ids.map((id) => fetch(`${BLS_V1}/${id}`, { headers }).then((r) => r.json())),
    );
    const series = results.flatMap((r) =>
      r?.status === 'REQUEST_SUCCEEDED' && r?.Results?.series ? r.Results.series : [],
    );
    return NextResponse.json(
      { Results: { series } },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
