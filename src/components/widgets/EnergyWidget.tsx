'use client';

import { useQuery } from '@tanstack/react-query';
import { memo } from 'react';
import { fetchEnergyPrices } from '@/lib/api/intel';
import type { EnergyPrice } from '@/lib/api/intel-types';

const CompactEnergy = memo(function CompactEnergy({ e }: { e: EnergyPrice }) {
  const name = e.commodity ?? 'Unknown';
  const price = e.price ?? 0;
  return (
    <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/[0.06]">
      <span className="text-[10px] font-medium text-zinc-400">{name}</span>
      <span className="text-[11px] font-mono text-zinc-200">
        ${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        {e.unit && <span className="text-[9px] text-zinc-500 ml-0.5">/{e.unit}</span>}
      </span>
    </div>
  );
});

export function EnergyWidget() {
  const { data: prices, isLoading } = useQuery({
    queryKey: ['intel', 'energy'],
    queryFn: () => fetchEnergyPrices(),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const list = prices ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col p-2 gap-px">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[40px] animate-pulse rounded bg-white/[0.03]" />
        ))}
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-3 text-[11px] text-zinc-500">
        Energy prices (oil, gas, etc.)
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="flex flex-col">
        {list.map((e, i) => (
          <CompactEnergy key={e.commodity ?? i} e={e} />
        ))}
      </div>
    </div>
  );
}
