const HELIUS_API_KEY = process.env.HELIUS_API_KEY ?? '';

export const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;
export const HELIUS_REST_URL = `https://api-mainnet.helius-rpc.com`;
export const HELIUS_WALLET_URL = `https://api.helius.xyz`;
export const HELIUS_WSS_URL = `wss://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

export function heliusRpc(body: Record<string, unknown>) {
  return fetch(HELIUS_RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export function heliusRest(path: string, init?: RequestInit) {
  const sep = path.includes('?') ? '&' : '?';
  return fetch(`${HELIUS_REST_URL}${path}${sep}api-key=${HELIUS_API_KEY}`, init);
}

export function heliusWallet(path: string) {
  const sep = path.includes('?') ? '&' : '?';
  return fetch(`${HELIUS_WALLET_URL}${path}${sep}api-key=${HELIUS_API_KEY}`);
}

export const JUPITER_PROGRAM = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';
export const RAYDIUM_PROGRAM = '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8';
export const QUANTIS_TOKEN_MINT =
  process.env.QUANTIS_TOKEN_MINT || '3pMnJYtaLD1WP5mVjVAw7ExxWywMtvmh1uhHqribpump';

export const SOL_DECIMALS = 9;
export const WHALE_THRESHOLD_USD = 5_000;
