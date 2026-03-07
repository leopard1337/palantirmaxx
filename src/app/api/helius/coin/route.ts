import { NextRequest, NextResponse } from 'next/server';
import { heliusRpc, heliusRest } from '@/lib/helius';
import type { HeliusAsset, HeliusTokenAccount, HeliusTransaction } from '@/lib/api/helius-types';

const LP_PROGRAMS = [
  '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1', // Raydium AMM
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8', // Raydium v4
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',  // Orca Whirlpool
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK', // Raydium CPMM
  'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',  // Meteora DLMM
];

/** Exclude LP holder addresses (e.g. $QUANT liquidity pool) */
const EXCLUDED_LP_HOLDERS = [
  (owner: string) => owner.startsWith('22qMkL') && owner.endsWith('mJLeai'),
];

export async function GET(request: NextRequest) {
  const mint = request.nextUrl.searchParams.get('mint');
  const section = request.nextUrl.searchParams.get('section');

  if (!mint) {
    return NextResponse.json({ error: 'mint required' }, { status: 400 });
  }

  if (section === 'holders') {
    try {
      const res = await heliusRpc({
        jsonrpc: '2.0',
        id: 'holders',
        method: 'getTokenAccounts',
        params: { mint, page: 1, limit: 100 },
      });
      if (!res.ok) return NextResponse.json({ holders: [], total: 0 });
      const data = (await res.json()) as { result?: { token_accounts?: HeliusTokenAccount[]; total?: number } };
      const accounts = data.result?.token_accounts ?? [];
      const holders = accounts
        .filter((a) => a.amount > 0)
        .filter((a) => !LP_PROGRAMS.includes(a.owner))
        .filter((a) => !EXCLUDED_LP_HOLDERS.some((fn) => fn(a.owner)))
        .sort((a, b) => b.amount - a.amount)
        .map((a) => ({ owner: a.owner, amount: a.amount }));
      return NextResponse.json({ holders, total: data.result?.total ?? holders.length });
    } catch {
      return NextResponse.json({ holders: [], total: 0 });
    }
  }

  if (section === 'activity') {
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '20'), 50);
    try {
      const res = await heliusRest(`/v0/addresses/${mint}/transactions?limit=${limit}`);
      if (!res.ok) return NextResponse.json({ transactions: [] });
      const txs = (await res.json()) as HeliusTransaction[];
      return NextResponse.json({ transactions: txs });
    } catch {
      return NextResponse.json({ transactions: [] });
    }
  }

  try {
    const res = await heliusRpc({
      jsonrpc: '2.0',
      id: 'asset',
      method: 'getAsset',
      params: { id: mint, options: { showFungible: true } },
    });
    if (!res.ok) return NextResponse.json({ asset: null });
    const data = (await res.json()) as { result?: HeliusAsset };
    return NextResponse.json({ asset: data.result ?? null });
  } catch (err) {
    console.error('[helius/coin]', err);
    return NextResponse.json({ asset: null, error: String(err) }, { status: 500 });
  }
}
