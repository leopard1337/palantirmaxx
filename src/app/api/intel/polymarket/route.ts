import { NextRequest, NextResponse } from 'next/server';
import type { EventData, EventMarket } from '@/lib/api/types';

const GAMMA_BASE = 'https://gamma-api.polymarket.com';

/** Map Quantis category to Polymarket tag slug */
const CATEGORY_TO_TAG: Record<string, string> = {
  politics: 'politics',
  crypto: 'crypto',
  finance: 'economics',
  geopolitics: 'geopolitics',
  tech: 'tech',
  culture: 'pop-culture',
  economy: 'economics',
  climate: 'climate',
  earnings: 'business',
};

function parseOutcomePrices(raw: string | undefined): [number, number] {
  if (!raw) return [0.5, 0.5];
  try {
    const arr = JSON.parse(raw) as string[];
    const yes = parseFloat(arr[0] ?? '0.5');
    const no = parseFloat(arr[1] ?? '0.5');
    if (Number.isNaN(yes) || Number.isNaN(no)) return [0.5, 0.5];
    return [yes, no];
  } catch {
    return [0.5, 0.5];
  }
}

function gammaMarketToEventMarket(
  m: Record<string, unknown>,
  eventId: string,
  eventSlug: string
): EventMarket {
  const op = parseOutcomePrices(m.outcomePrices as string);
  const vol = m.volumeNum ?? m.volume;
  const volNum = typeof vol === 'number' ? vol : parseFloat(String(vol ?? 0)) || 0;
  const endDate = (m.endDateIso ?? m.endDate ?? '') as string;
  const marketSlug = String(m.slug ?? '');
  return {
    id: String(m.id ?? ''),
    slug: marketSlug || eventSlug,
    condition_id: String(m.conditionId ?? ''),
    event_id: eventId,
    title: String(m.groupItemTitle ?? m.question ?? ''),
    question: String(m.question ?? ''),
    description: String(m.description ?? ''),
    image: String(m.image ?? m.icon ?? ''),
    yes_probability: op[0],
    yes_best_bid: (m.bestBid as number) ?? op[0],
    yes_best_ask: (m.bestAsk as number) ?? op[0],
    yes_spread: (m.spread as number) ?? 0,
    no_probability: op[1],
    no_best_bid: (m.bestAsk as number) ?? op[1],
    no_best_ask: (m.bestBid as number) ?? op[1],
    no_spread: (m.spread as number) ?? 0,
    volume: volNum,
    liquidity: (m.liquidityNum as number) ?? (m.liquidity as number) ?? 0,
    neg_risk: !!(m.negRisk ?? m.neg_risk),
    end_date: endDate,
    categories: [],
    source: 'polymarket',
  };
}

function gammaEventToEventData(e: Record<string, unknown>): EventData {
  const eventId = String(e.id ?? '');
  const slug = String(e.slug ?? e.ticker ?? eventId);
  const markets = (e.markets as Record<string, unknown>[]) ?? [];
  const mappedMarkets = markets
    .filter((m) => m && (m.active !== false || (m.closed === true && (m.volumeNum ?? m.volume))))
    .map((m) => gammaMarketToEventMarket(m, eventId, slug))
    .filter((m) => m.volume > 0 || m.yes_probability > 0 || m.no_probability > 0);

  return {
    id: eventId,
    title: String(e.title ?? ''),
    description: String(e.description ?? ''),
    image: String(e.image ?? e.icon ?? ''),
    volume: (e.volume as number) ?? (e.volumeNum as number) ?? 0,
    liquidity: (e.liquidity as number) ?? (e.liquidityClob as number) ?? 0,
    markets: mappedMarkets,
    slug,
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 100);
  const closed = searchParams.get('closed') === 'true';
  const order = searchParams.get('order') ?? 'volume24hr';
  const ascending = searchParams.get('ascending') === 'true';
  const category = (searchParams.get('category') ?? 'all').toLowerCase();
  const tag = CATEGORY_TO_TAG[category] ?? '';

  const params = new URLSearchParams();
  params.set('closed', String(closed));
  params.set('limit', String(Math.max(limit, tag ? 100 : limit)));
  params.set('order', order);
  params.set('ascending', String(ascending));
  if (tag) params.set('tag', tag);

  const url = `${GAMMA_BASE}/events?${params.toString()}`;

  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Polymarket Gamma ${res.status}` },
        { status: res.status }
      );
    }
    const raw = (await res.json()) as Record<string, unknown>[];
    if (!Array.isArray(raw)) {
      return NextResponse.json([]);
    }

    let filtered = raw;
    if (category !== 'all' && !tag) {
      const catLower = category.toLowerCase();
      filtered = raw.filter((e) => {
        const evCat = (e.category as string) ?? '';
        const tags = (e.tags as Array<{ slug?: string }>) ?? [];
        const tagSlugs = tags.map((t) => t?.slug?.toLowerCase()).filter(Boolean);
        return (
          evCat.toLowerCase().includes(catLower) ||
          tagSlugs.some((s) => s?.includes(catLower))
        );
      });
    }

    const events = filtered
      .map(gammaEventToEventData)
      .filter((e) => e.markets.length > 0)
      .slice(0, limit);

    return NextResponse.json(events);
  } catch (err) {
    console.error('[polymarket]', err);
    return NextResponse.json(
      { error: String(err) },
      { status: 502 }
    );
  }
}
