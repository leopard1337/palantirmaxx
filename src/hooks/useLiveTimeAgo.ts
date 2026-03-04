'use client';

import { useEffect, useState } from 'react';
import { formatTimeAgo } from '@/lib/utils';

/**
 * Returns a live-updating "time ago" string. Triggers re-renders so the
 * text updates (e.g. "8s ago" -> "9s ago" -> "1m ago") instead of staying static.
 * Uses 5s interval for recent items (<1min), 30s otherwise.
 */
export function useLiveTimeAgo(timestampMs: number): string {
  const [, setTick] = useState(0);
  const ageMs = Date.now() - timestampMs;
  const intervalMs = ageMs < 60_000 ? 5_000 : 30_000;

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return formatTimeAgo(timestampMs);
}
