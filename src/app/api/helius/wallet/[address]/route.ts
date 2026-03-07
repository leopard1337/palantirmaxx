import { NextRequest, NextResponse } from 'next/server';
import { heliusRpc, heliusRest, heliusWallet } from '@/lib/helius';
import type {
  WalletProfile,
  WalletIdentity,
  WalletFunding,
  WalletBalancesResponse,
  HeliusAsset,
  HeliusTransaction,
} from '@/lib/api/helius-types';

async function getIdentity(address: string): Promise<WalletIdentity | null> {
  try {
    const res = await heliusWallet(`/v1/wallet/${address}/identity`);
    if (!res.ok) return null;
    return (await res.json()) as WalletIdentity;
  } catch {
    return null;
  }
}

async function getFunding(address: string): Promise<WalletFunding | null> {
  try {
    const res = await heliusWallet(`/v1/wallet/${address}/funded-by`);
    if (!res.ok) return null;
    return (await res.json()) as WalletFunding;
  } catch {
    return null;
  }
}

async function getBalances(address: string): Promise<WalletBalancesResponse> {
  try {
    const res = await heliusRpc({
      jsonrpc: '2.0',
      id: 'assets',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: address,
        page: 1,
        limit: 100,
        displayOptions: { showFungible: true, showNativeBalance: true },
      },
    });
    if (!res.ok) return { balances: [], totalUsdValue: 0 };
    const data = (await res.json()) as { result?: { items?: HeliusAsset[]; nativeBalance?: { lamports: number } } };
    const items = data.result?.items ?? [];
    let totalUsd = 0;
    const balances = items
      .filter((a) => a.token_info && a.token_info.balance > 0)
      .map((a) => {
        const usd = a.token_info?.price_info?.total_price ?? null;
        if (usd) totalUsd += usd;
        return {
          mint: a.id,
          symbol: a.content?.metadata?.symbol ?? '???',
          name: a.content?.metadata?.name,
          balance: (a.token_info?.balance ?? 0) / 10 ** (a.token_info?.decimals ?? 0),
          decimals: a.token_info?.decimals ?? 0,
          usdValue: usd,
          pricePerToken: a.token_info?.price_info?.price_per_token ?? null,
          logoUri: a.content?.links?.image ?? a.content?.files?.[0]?.uri,
        };
      })
      .sort((a, b) => (b.usdValue ?? 0) - (a.usdValue ?? 0));

    const nativeLamports = data.result?.nativeBalance?.lamports ?? 0;
    const nativeSol = nativeLamports / 1e9;

    return { balances, totalUsdValue: totalUsd, nativeBalance: nativeSol };
  } catch {
    return { balances: [], totalUsdValue: 0 };
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> },
) {
  const { address } = await params;
  if (!address) {
    return NextResponse.json({ error: 'Address required' }, { status: 400 });
  }

  const section = request.nextUrl.searchParams.get('section');

  if (section === 'transactions') {
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '20'), 100);
    const type = request.nextUrl.searchParams.get('type') ?? '';
    let url = `/v0/addresses/${address}/transactions?limit=${limit}`;
    if (type) url += `&type=${type}`;
    try {
      const res = await heliusRest(url);
      if (!res.ok) return NextResponse.json({ transactions: [] });
      const txs = (await res.json()) as HeliusTransaction[];
      return NextResponse.json({ transactions: txs });
    } catch {
      return NextResponse.json({ transactions: [] });
    }
  }

  try {
    const [identity, funding, balances] = await Promise.all([
      getIdentity(address),
      getFunding(address),
      getBalances(address),
    ]);

    const profile: WalletProfile = { address, identity, funding, balances };
    return NextResponse.json(profile);
  } catch (err) {
    console.error('[helius/wallet]', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
