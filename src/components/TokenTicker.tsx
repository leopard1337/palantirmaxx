'use client';

import { useRef, useEffect } from 'react';

const TOKEN_ADDRESS = '3pMnJYtaLD1WP5mVjVAw7ExxWywMtvmh1uhHqribpump';
const TOKEN_URL = `https://pump.fun/coin/${TOKEN_ADDRESS}`;

const tickerText = `Live Now  •  ${TOKEN_ADDRESS}`;

export function TokenTicker() {
  const trackRef = useRef<HTMLDivElement>(null);
  const segmentRef = useRef<HTMLSpanElement>(null);
  const offsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const track = trackRef.current;
    const segment = segmentRef.current;
    if (!track || !segment) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let segmentWidth = segment.offsetWidth;
    const speed = 0.5; // px per frame

    const tick = () => {
      if (segmentWidth <= 0) segmentWidth = segment.offsetWidth;
      offsetRef.current += speed;
      if (offsetRef.current >= segmentWidth) offsetRef.current -= segmentWidth;
      track.style.transform = `translateX(${offsetRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); };
  }, []);

  return (
    <a
      href={TOKEN_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-7 w-full min-w-0 shrink-0 overflow-hidden border-b border-[var(--border)] bg-background"
      aria-label="View token on Pump.fun"
    >
      <div
        ref={trackRef}
        className="flex items-center whitespace-nowrap will-change-transform"
      >
        <span
          ref={segmentRef}
          className="inline-block shrink-0 px-4 text-[11px] font-medium tracking-wide text-accent"
        >
          {tickerText}
        </span>
        {Array.from({ length: 9 }, (_, i) => (
          <span
            key={i}
            className="inline-block shrink-0 px-4 text-[11px] font-medium tracking-wide text-accent"
          >
            {tickerText}
          </span>
        ))}
      </div>
    </a>
  );
}
