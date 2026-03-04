'use client';

import { useEffect } from 'react';
import FocusTrap from 'focus-trap-react';
import type { EventData } from '@/lib/api/types';
import { formatVolume, formatProbability } from '@/lib/utils';

export function EventDetailDrawer({
  event,
  onClose,
}: {
  event: EventData | null;
  onClose: () => void;
}) {
  if (!event) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] animate-backdrop-fade"
        onClick={onClose}
        aria-hidden="true"
      />
      <FocusTrap
        active={!!event}
        focusTrapOptions={{
          allowOutsideClick: true,
          escapeDeactivates: false,
          returnFocusOnDeactivate: true,
          clickOutsideDeactivates: false,
        }}
      >
        <div
          className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[90vw] md:max-w-md flex-col border-l border-white/[0.06] bg-surface shadow-2xl animate-slide-in"
          role="dialog"
          aria-modal="true"
          aria-label="Event detail"
        >
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3 shrink-0">
          <span className="text-[11px] font-semibold text-zinc-200">
            Event Detail
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-200 transition-colors"
            aria-label="Close"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="border-b border-white/[0.06] px-4 py-4">
            <div className="flex items-start gap-3">
              {event.image && (
                <img
                  src={event.image}
                  alt=""
                  className="h-12 w-12 rounded-lg object-cover shrink-0 ring-1 ring-white/[0.08]"
                />
              )}
              <div>
                <h2 className="text-sm font-semibold text-zinc-100 leading-snug">
                  {event.title}
                </h2>
                <div className="mt-1.5 flex items-center gap-3 text-[10px]">
                  {event.volume > 0 && (
                    <span className="text-zinc-300">
                      {formatVolume(event.volume)} vol
                    </span>
                  )}
                  {event.liquidity > 0 && (
                    <span className="text-zinc-300">
                      {formatVolume(event.liquidity)} liq
                    </span>
                  )}
                </div>
              </div>
            </div>
            {event.description && (
              <p className="mt-3 whitespace-pre-wrap text-[11px] leading-relaxed text-zinc-300 max-h-28 overflow-y-auto">
                {event.description}
              </p>
            )}
          </div>

          {event.markets && event.markets.length > 0 && (
            <div className="px-4 py-4">
              <h4 className="mb-2.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                Markets ({event.markets.length})
              </h4>
              <div className="flex flex-col gap-2">
                {event.markets.map((m) => (
                  <a
                    key={m.id}
                    href={`https://polymarket.com/event/${m.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 transition-all hover:border-white/[0.14] hover:bg-white/[0.05]"
                  >
                    <p className="text-[11px] font-medium text-zinc-100">
                      {m.question || m.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2.5 text-[10px]">
                      <div className="flex items-center gap-1">
                        <div className="h-1 w-1 rounded-full bg-accent" />
                        <span className="font-mono font-semibold text-accent">
                          {formatProbability(m.yes_probability)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="h-1 w-1 rounded-full bg-red-400/70" />
                        <span className="font-mono text-red-400/70">
                          {formatProbability(m.no_probability)}
                        </span>
                      </div>
                      <span className="text-zinc-400">
                        {formatVolume(m.volume)}
                      </span>
                      {m.end_date && (
                        <span className="text-zinc-500">
                          Ends {new Date(m.end_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full bg-accent/30 rounded-full"
                        style={{
                          width: `${Math.round(m.yes_probability * 100)}%`,
                        }}
                      />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/[0.06] px-4 py-3 shrink-0">
          <a
            href={`https://polymarket.com/event/${event.markets?.[0]?.slug ?? event.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg bg-accent/10 border border-accent/15 py-2 text-center text-[12px] font-semibold text-accent transition-all hover:bg-accent/20"
          >
            Trade on Polymarket
          </a>
        </div>
        </div>
      </FocusTrap>
    </>
  );
}
