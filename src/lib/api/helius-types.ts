export interface HeliusTokenTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  fromTokenAccount?: string;
  toTokenAccount?: string;
  tokenAmount: number;
  mint: string;
}

export interface HeliusNativeTransfer {
  fromUserAccount: string;
  toUserAccount: string;
  amount: number;
}

export interface HeliusTokenBalanceChange {
  userAccount: string;
  tokenAccount: string;
  mint: string;
  rawTokenAmount: { tokenAmount: string; decimals: number };
}

export interface HeliusAccountData {
  account: string;
  nativeBalanceChange: number;
  tokenBalanceChanges: HeliusTokenBalanceChange[];
}

export interface HeliusTransaction {
  signature: string;
  type: string;
  source: string;
  description: string;
  fee: number;
  feePayer: string;
  slot: number;
  timestamp: number;
  nativeTransfers: HeliusNativeTransfer[];
  tokenTransfers: HeliusTokenTransfer[];
  accountData: HeliusAccountData[];
  events: Record<string, unknown>;
}

export interface HeliusAsset {
  id: string;
  interface: string;
  content: {
    metadata: { name: string; symbol: string; description?: string };
    links?: { image?: string; external_url?: string };
    files?: Array<{ uri: string; mime: string }>;
  };
  ownership: { owner: string };
  token_info?: {
    balance: number;
    decimals: number;
    supply?: number;
    price_info?: { price_per_token: number; total_price?: number; currency?: string };
  };
  compression?: { compressed: boolean };
  creators?: Array<{ address: string; verified: boolean; share: number }>;
}

export interface HeliusTokenAccount {
  address: string;
  mint: string;
  owner: string;
  amount: number;
  delegated_amount: number;
  frozen: boolean;
}

export interface WalletIdentity {
  name: string;
  category: string;
  type?: string;
  address?: string;
}

export interface WalletFunding {
  funder: string;
  funderName?: string;
  funderType?: string;
  amount: number;
  timestamp: number;
  signature: string;
}

export interface WalletBalance {
  mint: string;
  symbol: string;
  name?: string;
  balance: number;
  decimals: number;
  usdValue: number | null;
  pricePerToken: number | null;
  logoUri?: string;
}

export interface WalletBalancesResponse {
  balances: WalletBalance[];
  totalUsdValue: number;
  nativeBalance?: number;
}

export interface WalletProfile {
  address: string;
  identity: WalletIdentity | null;
  funding: WalletFunding | null;
  balances: WalletBalancesResponse;
}

export interface SolanaActivityItem {
  id: string;
  signature: string;
  type: 'whale' | 'swap';
  description: string;
  source: string;
  timestamp: number;
  amountSol: number | null;
  amountUsd: number | null;
  from: string;
  to: string;
  tokenTransfers: HeliusTokenTransfer[];
  raw: HeliusTransaction;
}

export interface TokenPageData {
  asset: HeliusAsset | null;
  holders: { total: number; top: Array<{ owner: string; amount: number }> };
  recentActivity: HeliusTransaction[];
}
