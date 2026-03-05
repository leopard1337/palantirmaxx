'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWalkthrough } from '@/context/WalkthroughContext';
import { WALKTHROUGH_STEPS } from '@/lib/walkthrough';

const OVERLAY_OPACITY = 'bg-black/[0.06]';
const CARD_OFFSET_PX = 16;

export function WalkthroughOverlay() {
  const ctx = useWalkthrough();
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  const steps = ctx?.steps ?? WALKTHROUGH_STEPS;
  const active = ctx?.active ?? false;
  const step = ctx?.step ?? 0;
  const config = steps[step] ?? null;
  const highlightKey = config?.highlight ?? null;

  useEffect(() => {
    if (!active || !highlightKey) {
      setHighlightRect(null);
      return;
    }
    const el = document.querySelector(`[data-walkthrough="${highlightKey}"]`);
    if (!el) {
      setHighlightRect(null);
      return;
    }
    let raf: number;
    const update = () => {
      raf = requestAnimationFrame(() => {
        setHighlightRect(el.getBoundingClientRect());
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    window.addEventListener('scroll', update, true);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('scroll', update, true);
    };
  }, [active, highlightKey]);

  const cardPosition = useMemo(() => {
    const pad = 24;
    if (!highlightRect || typeof window === 'undefined') {
      return {
        bottom: pad,
        top: undefined as number | undefined,
        left: '50%' as const,
        transform: 'translateX(-50%)',
        isHighlight: false,
      };
    }
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cardW = Math.min(448, vw - 32);
    const cardH = 180;

    const below = highlightRect.bottom + CARD_OFFSET_PX + cardH < vh - pad;
    const right = highlightRect.right + CARD_OFFSET_PX + cardW < vw - pad;
    const left = highlightRect.left - CARD_OFFSET_PX - cardW > pad;

    if (below) {
      const cx = highlightRect.left + highlightRect.width / 2;
      return {
        bottom: undefined,
        top: highlightRect.bottom + CARD_OFFSET_PX,
        left: Math.max(pad, Math.min(vw - pad - cardW, cx - cardW / 2)),
        transform: undefined,
        isHighlight: true,
      };
    }
    if (right) {
      const cy = highlightRect.top + highlightRect.height / 2;
      return {
        bottom: undefined,
        top: Math.max(pad, Math.min(vh - pad - cardH, cy - cardH / 2)),
        left: highlightRect.right + CARD_OFFSET_PX,
        transform: undefined,
        isHighlight: true,
      };
    }
    if (left) {
      const cy = highlightRect.top + highlightRect.height / 2;
      return {
        bottom: undefined,
        top: Math.max(pad, Math.min(vh - pad - cardH, cy - cardH / 2)),
        left: highlightRect.left - CARD_OFFSET_PX - cardW,
        transform: undefined,
        isHighlight: true,
      };
    }
    return {
      bottom: pad,
      top: undefined,
      left: '50%',
      transform: 'translateX(-50%)',
      isHighlight: false,
    };
  }, [highlightRect]);

  if (!ctx || !config || !active) return null;

  const { goNext, goBack, skip } = ctx;
  const isFirst = step === 0;
  const isLast = WALKTHROUGH_STEPS.length - 1 === step;

  const renderBackdrop = () => {
    if (!highlightRect) {
      return (
        <div
          className={`absolute inset-0 ${OVERLAY_OPACITY} backdrop-blur-[1px] transition-opacity duration-300`}
          aria-hidden
        />
      );
    }
    const pad = 6;
    const t = Math.max(0, highlightRect.top - pad);
    const l = Math.max(0, highlightRect.left - pad);
    const r = highlightRect.right + pad;
    const b = highlightRect.bottom + pad;
    const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const h = typeof window !== 'undefined' ? window.innerHeight : 1080;
    return (
      <>
        <div className={`absolute left-0 top-0 w-full ${OVERLAY_OPACITY} backdrop-blur-[1px] transition-opacity duration-300`} style={{ height: t }} />
        <div className={`absolute ${OVERLAY_OPACITY} backdrop-blur-[1px]`} style={{ top: t, left: 0, width: l, height: b - t }} />
        <div className={`absolute ${OVERLAY_OPACITY} backdrop-blur-[1px]`} style={{ top: t, left: r, width: w - r, height: b - t }} />
        <div className={`absolute left-0 ${OVERLAY_OPACITY} backdrop-blur-[1px] w-full`} style={{ top: b, height: h - b }} />
        <div
          className="absolute rounded-xl ring-2 ring-accent/70 pointer-events-none animate-highlight-ring transition-[top,left,width,height] duration-200"
          style={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
        />
      </>
    );
  };

  const totalSteps = steps.length;
  const stepLabel = `${step + 1}/${totalSteps}`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      aria-modal
      aria-labelledby="walkthrough-title"
    >
      {renderBackdrop()}

      {/* Card wrapper - positioning */}
      <div
        className="relative z-10 w-full max-w-md transition-[top,left,bottom] duration-300"
        style={{
          position: 'absolute',
          top: cardPosition.top,
          bottom: cardPosition.bottom,
          left: cardPosition.left,
          transform: cardPosition.transform,
        }}
      >
        <div
          key={step}
          className={`w-full rounded-2xl border border-white/[0.08] bg-zinc-950/98 shadow-2xl shadow-black/40 backdrop-blur-xl overflow-hidden ${
            cardPosition.isHighlight ? 'animate-walkthrough-card-highlight' : 'animate-walkthrough-card'
          }`}
        >
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-accent to-transparent animate-accent-shimmer" />

        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p
                id="walkthrough-title"
                className="text-[13px] sm:text-[14px] text-zinc-200 leading-[1.65]"
              >
                {config.text}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="animate-step-badge rounded-md bg-white/[0.06] px-2.5 py-1 text-[10px] font-medium tabular-nums text-zinc-500">
                {stepLabel}
              </span>
              <button
                type="button"
                onClick={skip}
                className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors duration-150"
                aria-label="Skip walkthrough"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 mt-6 pt-6 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={goBack}
              disabled={isFirst}
              className={`rounded-lg px-4 py-2.5 text-[12px] font-medium transition-all duration-150 ${
                isFirst
                  ? 'text-zinc-600 cursor-not-allowed'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06] active:scale-[0.98]'
              }`}
            >
              Back
            </button>
            <button
              type="button"
              onClick={goNext}
              className="rounded-lg bg-accent px-5 py-2.5 text-[12px] font-semibold text-black hover:bg-accent/90 active:scale-[0.98] transition-all duration-150"
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
