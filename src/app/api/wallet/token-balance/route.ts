import { NextRequest, NextResponse } from 'next/server';

const HELIUS_RPC = 'https://mainnet.helius-rpc.com/?api-key=3d53f1e2-28b8-4261-85b1-ba0d45765b19';

/** Token mint address - update when provided */
const QUANTIS_TOKEN_MINT = process.env.QUANTIS_TOKEN_MINT || 'PLACEHOLDER_MINT_ADDRESS';
const REQUIRED_BALANCE = 100_000;

/** Whitelisted addresses that bypass token gate */
const WHITELIST = new Set([
  'EWX8BgVxzwg3SCXpXsKfATK8SnFAxHqgdZWFGUXfnonB',
]);

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');
  if (!wallet || typeof wallet !== 'string') {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  if (WHITELIST.has(wallet)) {
    return NextResponse.json({ balance: 0, hasAccess: true });
  }

  if (QUANTIS_TOKEN_MINT === 'PLACEHOLDER_MINT_ADDRESS') {
    return NextResponse.json({ balance: 0, hasAccess: false });
  }

  try {
    const res = await fetch(HELIUS_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'balance-check',
        method: 'getTokenAccountsByOwner',
        params: [
          wallet,
          { mint: QUANTIS_TOKEN_MINT },
          { encoding: 'jsonParsed' },
        ],
      }),
    });

    const data = await res.json();
    if (data.error) {
      return NextResponse.json({ balance: 0, hasAccess: false });
    }

    const accounts = data.result?.value ?? [];
    let total = 0;
    for (const acc of accounts) {
      const parsed = acc?.account?.data?.parsed?.info;
      if (parsed?.tokenAmount) {
        const ui = parsed.tokenAmount.uiAmount ?? 0;
        total += typeof ui === 'number' ? ui : parseFloat(ui) || 0;
      }
    }

    const hasAccess = total >= REQUIRED_BALANCE;
    return NextResponse.json({ balance: total, hasAccess });
  } catch (err) {
    return NextResponse.json({ balance: 0, hasAccess: false });
  }
}
