import { NextRequest, NextResponse } from 'next/server';
import { heliusRest, JUPITER_PROGRAM, RAYDIUM_PROGRAM, SOL_DECIMALS, WHALE_THRESHOLD_USD } from '@/lib/helius';
import type { HeliusTransaction, SolanaActivityItem } from '@/lib/api/helius-types';

const SOL_PRICE_ESTIMATE = 220;

function estimateUsd(tx: HeliusTransaction): number | null {
  for (const t of tx.tokenTransfers ?? []) {
    if (t.mint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v') return t.tokenAmount / 1e6;
    if (t.mint === 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB') return t.tokenAmount / 1e6;
  }
  const solMoved = (tx.nativeTransfers ?? []).reduce((s, t) => s + Math.abs(t.amount), 0) / 10 ** SOL_DECIMALS;
  if (solMoved > 0) return solMoved * SOL_PRICE_ESTIMATE;
  return null;
}

function toActivityItem(tx: HeliusTransaction, type: 'whale' | 'swap'): SolanaActivityItem {
  const from = tx.nativeTransfers?.[0]?.fromUserAccount ?? tx.feePayer;
  const to = tx.nativeTransfers?.[0]?.toUserAccount ?? '';
  const solAmount = (tx.nativeTransfers ?? []).reduce((s, t) => s + Math.abs(t.amount), 0) / 10 ** SOL_DECIMALS;
  return {
    id: tx.signature,
    signature: tx.signature,
    type,
    description: tx.description || `${tx.type} via ${tx.source}`,
    source: tx.source,
    timestamp: tx.timestamp,
    amountSol: solAmount || null,
    amountUsd: estimateUsd(tx),
    from,
    to,
    tokenTransfers: tx.tokenTransfers ?? [],
    raw: tx,
  };
}

async function fetchProgramActivity(program: string, limit: number): Promise<HeliusTransaction[]> {
  try {
    const res = await heliusRest(`/v0/addresses/${program}/transactions?limit=${limit}`);
    if (!res.ok) return [];
    return (await res.json()) as HeliusTransaction[];
  } catch {
    return [];
  }
}

async function fetchWalletActivity(address: string, limit: number): Promise<HeliusTransaction[]> {
  try {
    const res = await heliusRest(`/v0/addresses/${address}/transactions?limit=${limit}`);
    if (!res.ok) return [];
    return (await res.json()) as HeliusTransaction[];
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '30'), 100);
  const filter = request.nextUrl.searchParams.get('filter') ?? 'all';
  const wallets = request.nextUrl.searchParams.get('wallets');

  try {
    const fetches: Promise<HeliusTransaction[]>[] = [
      fetchProgramActivity(JUPITER_PROGRAM, 30),
      fetchProgramActivity(RAYDIUM_PROGRAM, 20),
    ];

    if (wallets) {
      const addrs = wallets.split(',').filter(Boolean).slice(0, 10);
      for (const addr of addrs) {
        fetches.push(fetchWalletActivity(addr.trim(), 10));
      }
    }

    const results = await Promise.all(fetches);
    const allTxs = results.flat();

    const seen = new Set<string>();
    const deduped = allTxs.filter((tx) => {
      if (seen.has(tx.signature)) return false;
      seen.add(tx.signature);
      return true;
    });
    deduped.sort((a, b) => b.timestamp - a.timestamp);

    const items: SolanaActivityItem[] = deduped.map((tx) => {
      const usd = estimateUsd(tx);
      const isWhale = usd != null && usd >= WHALE_THRESHOLD_USD;
      return toActivityItem(tx, isWhale ? 'whale' : 'swap');
    });

    const filtered = filter === 'whale'
      ? items.filter((i) => i.type === 'whale')
      : filter === 'swap'
        ? items.filter((i) => i.type === 'swap')
        : items;

    return NextResponse.json({ items: filtered.slice(0, limit), total: filtered.length });
  } catch (err) {
    console.error('[helius/activity]', err);
    return NextResponse.json({ items: [], total: 0, error: String(err) }, { status: 500 });
  }
}
