'use client';

import { memo, useMemo, useState } from 'react';
import type { FlightData } from '@/lib/api/types';
import { CAT_COLORS } from '@/lib/constants';
import { formatTimeAgo } from '@/lib/utils';

const CATEGORIES = [
  'All',
  'AWACS',
  'Drone',
  'Presidential',
  'Fighter',
  'Bomber',
  'Tanker',
  'Transport',
  'Command',
  'Other',
];

const FlightRow = memo(function FlightRow({
  flight,
  isSelected,
  onClick,
}: {
  flight: FlightData;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = CAT_COLORS[flight.category] ?? CAT_COLORS.Other;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 border-b border-white/[0.04] transition-colors ${
        isSelected ? 'bg-white/[0.06]' : 'hover:bg-white/[0.04]'
      }`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span
          className="h-[7px] w-[7px] rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-[11px] font-bold text-zinc-200 truncate">
          {flight.callsign || flight.hex}
        </span>
        <span
          className="ml-auto text-[8px] font-bold uppercase shrink-0 rounded px-1 py-px tracking-wide"
          style={{ color, backgroundColor: `${color}12` }}
        >
          {flight.category}
        </span>
      </div>
      <div className="text-[10px] text-zinc-500 flex items-center gap-1.5 pl-[13px]">
        <span className="text-zinc-400">{flight.aircraft}</span>
        <span className="text-zinc-600">&middot;</span>
        <span className="truncate">{flight.location}</span>
      </div>
      <div className="mt-0.5 flex items-center gap-2 text-[9px] pl-[13px]">
        <span className="text-zinc-600 font-mono">
          {flight.altitude.feet.toLocaleString()} ft
        </span>
        <span className="text-zinc-600 font-mono">
          {flight.speed.knots.toFixed(0)} kts
        </span>
        <span className="ml-auto text-zinc-500 tabular-nums">
          {formatTimeAgo(flight.timestamp)}
        </span>
      </div>
    </button>
  );
});

export function FlightsPanel({
  flights,
  selectedFlight,
  onSelectFlight,
}: {
  flights: FlightData[];
  selectedFlight: FlightData | null;
  onSelectFlight: (flight: FlightData) => void;
}) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const filtered = useMemo(() => {
    let list = [...flights].sort((a, b) => b.timestamp - a.timestamp);
    if (category !== 'All') list = list.filter((f) => f.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (f) =>
          f.callsign.toLowerCase().includes(q) ||
          f.registration.toLowerCase().includes(q) ||
          f.hex.toLowerCase().includes(q) ||
          f.aircraft.toLowerCase().includes(q) ||
          f.location.toLowerCase().includes(q),
      );
    }
    return list;
  }, [flights, category, search]);

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-white/[0.06] bg-background">
      <div className="border-b border-white/[0.06] px-3 py-2.5 shrink-0 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-semibold text-zinc-300">
              Flights
            </span>
          </div>
          <span className="text-[9px] text-zinc-500 tabular-nums">
            {filtered.length} / {flights.length}
          </span>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search callsign, reg, hex..."
          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-2.5 py-1.5 text-[10px] text-zinc-200 placeholder-zinc-600 outline-none focus:border-white/[0.12] transition-colors"
        />

        <div className="flex flex-wrap gap-0.5">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`rounded px-1.5 py-[3px] text-[8px] font-semibold transition-colors ${
                category === c
                  ? 'bg-zinc-700/70 text-zinc-100'
                  : 'text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.05]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <svg
              className="h-6 w-6 text-zinc-600 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <p className="text-[10px] text-zinc-500">No flights match</p>
          </div>
        )}
        {filtered.map((f) => (
          <FlightRow
            key={f.id}
            flight={f}
            isSelected={selectedFlight?.id === f.id}
            onClick={() => onSelectFlight(f)}
          />
        ))}
      </div>
    </div>
  );
}
