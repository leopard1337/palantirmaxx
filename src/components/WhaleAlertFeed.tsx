'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

const WHALE_ALERT_WS = 'wss://leviathan.whale-alert.io/ws';

export interface WhaleAlertItem {
  id: string;
  channelId: string;
  timestamp: number;
  blockchain: string;
  transactionType: string;
  from: string;
  to: string;
  amounts: Array< { symbol: string; amount: number; value_usd: number }>;
  text: string;
  hash?: string;
}

function formatUsd(val: number): string {
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
  return `$${val.toFixed(0)}`;
}

function formatTimeAgo(ts: number): string {
  const seconds = ts > 1e12 ? Math.floor(ts / 1000) : ts;
  let diff = Math.floor(Date.now() / 1000 - seconds);
  if (diff < 0) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Human-readable descriptions for Whale Alert API errors
const ERROR_LABELS: Record<string, string> = {
  'not authenticated': 'Invalid or expired API key. Check developer.whale-alert.io',
  'not allowed': 'API key does not include WebSocket access. Upgrade your plan.',
  'invalid blockchain': 'Solana may not be supported for your plan.',
  'min usd value too low': 'min_value_usd must be ≥ $100,000',
  'invalid request': 'Invalid subscription format',
  'alert rate limit exceeded': 'Rate limit (100/hr). Try again in an hour.',
};

export function WhaleAlertFeed({ maxItems = 20 }: { maxItems?: number }) {
  const [alerts, setAlerts] = useState<WhaleAlertItem[]>([]);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error' | 'no-key'>('connecting');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const mountedRef = useRef(true);
  const intentionallyClosedRef = useRef(false);

  const apiKey = typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_WHALE_ALERT_API_KEY : '';

  const addAlert = useCallback((item: WhaleAlertItem) => {
    setAlerts((prev) => [item, ...prev].slice(0, maxItems));
  }, [maxItems]);

  const connect = useCallback(() => {
    if (!apiKey) {
      setStatus('no-key');
      return () => {};
    }
    setStatus('connecting');
    setErrorMsg(null);
    intentionallyClosedRef.current = false;

    const ws = new WebSocket(`${WHALE_ALERT_WS}?api_key=${encodeURIComponent(apiKey)}`);

    ws.onopen = () => {
      if (!mountedRef.current) return;
      setStatus('connected');
      // Solana only + $500K min to stay well under 100 alerts/hour limit
      ws.send(JSON.stringify({
        type: 'subscribe_alerts',
        blockchains: ['solana'],
        min_value_usd: 500000,
      }));
    };

    ws.onmessage = (event) => {
      if (!mountedRef.current) return;
      try {
        const msg = JSON.parse(event.data);
        if (msg.error) {
          const label = ERROR_LABELS[msg.error] ?? msg.error;
          setErrorMsg(label);
          setStatus('error');
          return;
        }
        if (msg.type === 'subscribed_alerts') return;
        if (msg.type === 'alert' && msg.text) {
          // Only show Solana alerts
          if (msg.blockchain?.toLowerCase() !== 'solana') return;
          const hash = msg.transaction?.hash ?? msg.transaction?.custom_transaction_data;
          addAlert({
            id: hash ?? `alert-${msg.timestamp}-${msg.channel_id}`,
            channelId: msg.channel_id ?? '',
            timestamp: msg.timestamp ?? Math.floor(Date.now() / 1000),
            blockchain: msg.blockchain ?? 'solana',
            transactionType: msg.transaction_type ?? 'transfer',
            from: msg.from ?? 'unknown',
            to: msg.to ?? 'unknown',
            amounts: msg.amounts ?? [],
            text: msg.text ?? '',
            hash,
          });
        }
      } catch { /* ignore */ }
    };

    ws.onerror = () => {
      if (mountedRef.current) {
        setErrorMsg((prev) => prev ?? 'WebSocket failed. Check network or API key.');
        setStatus('error');
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current || intentionallyClosedRef.current) return;
      setStatus('error');
      setErrorMsg((prev) => prev ?? 'Connection closed. WebSocket may require a paid plan.');
    };

    return () => {
      intentionallyClosedRef.current = true;
      ws.close();
    };
  }, [apiKey, addAlert]);

  useEffect(() => {
    mountedRef.current = true;
    const cleanup = connect();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [connect]);

  if (status === 'no-key') return null;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 px-2">
        <span className={`h-1.5 w-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-400' : status === 'error' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
        <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
          Whale Alert (live)
        </span>
        {status === 'connecting' && (
          <span className="text-[9px] text-zinc-500">Connecting…</span>
        )}
        {status === 'error' && (
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-red-400/80">
              {errorMsg ?? 'Connection error'}
            </span>
            <button
              type="button"
              onClick={() => connect()}
              className="text-[9px] text-accent hover:underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>
      {alerts.length === 0 && status === 'connected' && (
        <p className="px-3 py-2 text-[10px] text-zinc-500">
          Waiting for Solana whale alerts ($500K+). Alerts stream in real-time.
        </p>
      )}
      {alerts.map((a) => {
        const totalUsd = a.amounts.reduce((s, x) => s + (x.value_usd ?? 0), 0);
        return (
          <div
            key={a.id}
            className="rounded-lg border border-amber-400/20 bg-amber-400/[0.03] px-3 py-2"
          >
            <p className="text-[11px] text-zinc-200 leading-snug line-clamp-2">{a.text}</p>
            <div className="mt-1 flex items-center justify-between text-[10px]">
              <span className="font-mono font-semibold text-amber-400 tabular-nums">
                {formatUsd(totalUsd)}
              </span>
              <span className="text-zinc-500">{formatTimeAgo(a.timestamp)}</span>
            </div>
            {a.hash && (
              <a
                href={`https://solscan.io/tx/${a.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-[9px] text-accent/70 hover:text-accent"
              >
                View on Solscan →
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
