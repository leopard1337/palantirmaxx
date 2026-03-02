'use client';

import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import { fetchAllFredSeries } from '@/lib/api/intel';
import { MiniSparkline } from '@/components/MiniSparkline';

const SERIES_TO_FETCH = ['UNRATE', 'VIXCLS', 'DGS10', 'FEDFUNDS', 'T10Y2Y'];

const CompactFred = memo(function CompactFred({
  seriesId,
  label,
  data,
}: {
  seriesId: string;
  label: string;
  data: { date: string; value: number }[];
}) {
  const last = data[data.length - 1];
  const first = data[0];
  const change = last && first ? last.value - first.value : 0;
  const positive = change >= 0;

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-white/[0.06]">
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-zinc-400 truncate">{label}</p>
        <p className="text-[11px] font-mono text-zinc-200 tabular-nums">
          {last != null ? last.value.toFixed(2) : '—'}
        </p>
      </div>
      <MiniSparkline data={data} positive={positive} width={56} height={28} />
    </div>
  );
});

export function EconomicWidget() {
  const { data: seriesMap, isLoading } = useQuery({
    queryKey: ['intel', 'fred-page'],
    queryFn: async () => {
      const all = await fetchAllFredSeries(60);
      const map: Record<string, { seriesId: string; label: string; data: { date: string; value: number }[] }> = {};
      for (const s of all) {
        if (SERIES_TO_FETCH.includes(s.seriesId)) map[s.seriesId] = s;
      }
      return map;
    },
    staleTime: 300_000, // 5 min
    refetchInterval: 600_000, // 10 min
  });

  if (isLoading) {
    return (
      <div className="flex flex-col p-2 gap-px">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[44px] animate-pulse rounded bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  const entries = seriesMap ? Object.entries(seriesMap).filter(([, v]) => v.data.length > 0) : [];

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 p-3">
        <p className="text-[11px] text-zinc-500">Economic Indicators</p>
        <p className="text-[10px] text-zinc-600">Unemployment, VIX, 10Y, Fed Funds, Spread</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="flex flex-col">
        {entries.map(([id, s]) => (
          <CompactFred key={id} seriesId={id} label={s.label} data={s.data} />
        ))}
      </div>
    </div>
  );
}
