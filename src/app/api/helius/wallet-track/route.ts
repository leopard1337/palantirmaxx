import { NextRequest, NextResponse } from 'next/server';
import { heliusRest, heliusRpc, SOL_DECIMALS } from '@/lib/helius';
import type { HeliusTransaction, HeliusAsset } from '@/lib/api/helius-types';

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get('address');
  if (!address) {
    return NextResponse.json({ error: 'address required' }, { status: 400 });
  }

  try {
    const [txRes, balRes] = await Promise.all([
      heliusRest(`/v0/addresses/${address}/transactions?limit=20`),
      heliusRpc({
        jsonrpc: '2.0',
        id: 'balance',
        method: 'getAssetsByOwner',
        params: { ownerAddress: address, page: 1, limit: 50, displayOptions: { showFungible: true, showNativeBalance: true } },
      }),
    ]);

    const txs: HeliusTransaction[] = txRes.ok ? await txRes.json() : [];

    let solBalance = 0;
    let tokens: Array<{ mint: string; symbol: string; name: string; balance: number; decimals: number; usdValue: number | null; logoUri?: string }> = [];
    let totalUsdValue = 0;

    if (balRes.ok) {
      const data = (await balRes.json()) as { result?: { items?: HeliusAsset[]; nativeBalance?: { lamports?: number } } };
      const lamports = data.result?.nativeBalance?.lamports ?? 0;
      solBalance = lamports / 10 ** SOL_DECIMALS;
      const solUsd = solBalance * 150;
      totalUsdValue += solUsd;

      const assets = data.result?.items ?? [];
      tokens = assets
        .filter((a) => a.interface === 'FungibleToken' || a.interface === 'FungibleAsset')
        .map((a) => {
          const bal = (a.token_info?.balance ?? 0) / 10 ** (a.token_info?.decimals ?? 0);
          const usd = a.token_info?.price_info?.total_price ?? (a.token_info?.price_info?.price_per_token ? a.token_info.price_info.price_per_token * bal : null);
          if (usd) totalUsdValue += usd;
          return {
            mint: a.id,
            symbol: a.content?.metadata?.symbol ?? '???',
            name: a.content?.metadata?.name ?? 'Unknown',
            balance: bal,
            decimals: a.token_info?.decimals ?? 0,
            usdValue: usd,
            logoUri: a.content?.links?.image ?? a.content?.files?.[0]?.uri,
          };
        })
        .filter((t) => t.balance > 0)
        .sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));
    }

    return NextResponse.json({
      address,
      solBalance,
      totalUsdValue,
      tokens: tokens.slice(0, 20),
      recentTxs: txs.slice(0, 15),
    });
  } catch (err) {
    console.error('[helius/wallet-track]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
