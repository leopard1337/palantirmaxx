import { NextResponse } from 'next/server';

export interface ISSNowResponse {
  message: string;
  timestamp: number;
  iss_position: { latitude: string; longitude: string };
}

export interface ISSAstrosResponse {
  message: string;
  number: number;
  people: Array<{ name: string; craft: string }>;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const include = searchParams.get('include') ?? 'position';

  try {
    const [positionRes, astrosRes] = await Promise.all([
      fetch('http://api.open-notify.org/iss-now.json', {
        next: { revalidate: 5 },
      }),
      include === 'astros'
        ? fetch('http://api.open-notify.org/astros.json', {
            next: { revalidate: 60 },
          })
        : null,
    ]);

    if (!positionRes.ok) {
      return NextResponse.json(
        { error: `ISS position ${positionRes.status}` },
        { status: positionRes.status },
      );
    }

    const position = (await positionRes.json()) as ISSNowResponse;
    const lat = parseFloat(position.iss_position?.latitude ?? '0');
    const lng = parseFloat(position.iss_position?.longitude ?? '0');

    const result: {
      lat: number;
      lng: number;
      timestamp: number;
      people?: number;
      astros?: Array<{ name: string; craft: string }>;
    } = {
      lat: Number.isFinite(lat) ? lat : 0,
      lng: Number.isFinite(lng) ? lng : 0,
      timestamp: position.timestamp ?? Math.floor(Date.now() / 1000),
    };

    if (astrosRes?.ok) {
      const astros = (await astrosRes.json()) as ISSAstrosResponse;
      result.people = astros.number ?? 0;
      result.astros = astros.people ?? [];
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[iss]', err);
    return NextResponse.json({ error: String(err) }, { status: 502 });
  }
}
