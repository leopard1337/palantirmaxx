import { getApiUrl } from './base-url';
import type {
  SolanaActivityItem,
  WalletProfile,
  HeliusTransaction,
  HeliusAsset,
  TokenPageData,
} from './helius-types';

export async function fetchSolanaActivity(
  filter: 'all' | 'whale' | 'swap' = 'all',
  limit = 30,
  wallets?: string[],
): Promise<{ items: SolanaActivityItem[]; total: number }> {
  const params: Record<string, string> = { filter, limit: String(limit) };
  if (wallets && wallets.length > 0) params.wallets = wallets.join(',');
  const url = getApiUrl('/api/helius/activity', params);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return { items: [], total: 0 };
  return res.json();
}

export async function fetchWalletProfile(address: string): Promise<WalletProfile | null> {
  const url = getApiUrl(`/api/helius/wallet/${address}`);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function fetchWalletTransactions(
  address: string,
  limit = 20,
  type?: string,
): Promise<HeliusTransaction[]> {
  const params: Record<string, string> = { section: 'transactions', limit: String(limit) };
  if (type) params.type = type;
  const url = getApiUrl(`/api/helius/wallet/${address}`, params);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.transactions ?? [];
}

export async function fetchTokenInfo(mint?: string): Promise<HeliusAsset | null> {
  const params: Record<string, string> = {};
  if (mint) params.mint = mint;
  const url = getApiUrl('/api/helius/token', params);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.asset ?? null;
}

export async function fetchTokenHolders(
  mint?: string,
): Promise<{ holders: Array<{ owner: string; amount: number }>; total: number }> {
  const params: Record<string, string> = { section: 'holders' };
  if (mint) params.mint = mint;
  const url = getApiUrl('/api/helius/token', params);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return { holders: [], total: 0 };
  return res.json();
}

export async function fetchTokenActivity(
  mint?: string,
  limit = 20,
): Promise<HeliusTransaction[]> {
  const params: Record<string, string> = { section: 'activity', limit: String(limit) };
  if (mint) params.mint = mint;
  const url = getApiUrl('/api/helius/token', params);
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.transactions ?? [];
}

export interface TrackedWalletData {
  address: string;
  solBalance: number;
  totalUsdValue: number;
  tokens: Array<{
    mint: string;
    symbol: string;
    name: string;
    balance: number;
    decimals: number;
    usdValue: number | null;
    logoUri?: string;
  }>;
  recentTxs: HeliusTransaction[];
}

export async function fetchTrackedWallet(address: string): Promise<TrackedWalletData | null> {
  const url = getApiUrl('/api/helius/wallet-track', { address });
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export interface CoinData {
  asset: HeliusAsset | null;
  holders?: { holders: Array<{ owner: string; amount: number }>; total: number };
  activity?: HeliusTransaction[];
}

export async function fetchCoinInfo(mint: string): Promise<HeliusAsset | null> {
  const url = getApiUrl('/api/helius/coin', { mint });
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return null;
  const data = await res.json();
  return data.asset ?? null;
}

export async function fetchCoinHolders(
  mint: string,
): Promise<{ holders: Array<{ owner: string; amount: number }>; total: number }> {
  const url = getApiUrl('/api/helius/coin', { mint, section: 'holders' });
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return { holders: [], total: 0 };
  return res.json();
}

export async function fetchCoinActivity(mint: string, limit = 20): Promise<HeliusTransaction[]> {
  const url = getApiUrl('/api/helius/coin', { mint, section: 'activity', limit: String(limit) });
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return data.transactions ?? [];
}
