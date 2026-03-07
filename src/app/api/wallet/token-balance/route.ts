import { NextRequest, NextResponse } from 'next/server';
import { HELIUS_RPC_URL, QUANTIS_TOKEN_MINT } from '@/lib/helius';
const REQUIRED_BALANCE = 100_000;

/** Whitelisted addresses that bypass token gate */
const WHITELIST = new Set([
  'EWX8BgVxzwg3SCXpXsKfATK8SnFAxHqgdZWFGUXfnonB',
  'vW2NfvUWeh5xDpbfECyjd6f1KCxD1pcTFCBMMJsWWP3',
]);

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get('wallet');
  if (!wallet || typeof wallet !== 'string') {
    return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
  }

  if (WHITELIST.has(wallet)) {
    return NextResponse.json({ balance: 0, hasAccess: true });
  }

  try {
    const res = await fetch(HELIUS_RPC_URL, {
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
