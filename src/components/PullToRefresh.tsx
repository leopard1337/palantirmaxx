'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

interface PullToRefreshContextValue {
  scrollRef: React.RefObject<HTMLDivElement | null>;
}

const PullToRefreshContext = createContext<PullToRefreshContextValue | null>(
  null,
);

export function usePullToRefreshScrollRef() {
  return useContext(PullToRefreshContext)?.scrollRef ?? null;
}

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<unknown> | void;
  disabled?: boolean;
  threshold?: number;
  /** Only enable on touch devices (mobile) */
  touchOnly?: boolean;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  disabled = false,
  threshold = 80,
  touchOnly = true,
  className = '',
}: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const scrollTop = useRef(0);
  const pullYRef = useRef(0);
  const refreshingRef = useRef(false);

  pullYRef.current = pullY;
  refreshingRef.current = refreshing;

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  const shouldEnable = !touchOnly || isTouchDevice;

  const handleRefresh = useCallback(async () => {
    if (refreshing || disabled) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, refreshing, disabled]);

  useEffect(() => {
    if (!shouldEnable || disabled) return;

    const container = scrollRef.current;
    if (!container) return;

    const onTouchStart = (e: TouchEvent) => {
      startY.current = e.touches[0].clientY;
      scrollTop.current = container.scrollTop;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (refreshing) return;
      if (scrollTop.current > 0) return;

      const y = e.touches[0].clientY;
      const diff = y - startY.current;
      if (diff > 0) {
        setPullY(Math.min(diff * 0.4, threshold * 1.5));
      }
    };

    const onTouchEnd = () => {
      if (pullY >= threshold && !refreshing) {
        handleRefresh();
      }
      setPullY(0);
    };

    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('touchmove', onTouchMove, { passive: true });
    container.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('touchmove', onTouchMove);
      container.removeEventListener('touchend', onTouchEnd);
    };
  }, [shouldEnable, disabled, threshold, handleRefresh]);

  const pullProgress = Math.min(pullY / threshold, 1);

  return (
    <PullToRefreshContext.Provider value={{ scrollRef }}>
      <div className={`relative flex flex-1 min-h-0 flex-col ${className}`}>
        {shouldEnable && (
          <div
            className="absolute top-0 left-0 right-0 flex justify-center pt-2 pb-1 z-10 pointer-events-none transition-opacity duration-150"
            style={{
              opacity: pullY > 0 ? 1 : 0,
              transform: `translateY(${pullY > 0 ? 0 : -20}px)`,
            }}
          >
            <div
              className={`flex items-center gap-2 rounded-full bg-white/[0.08] px-3 py-1.5 text-[10px] font-medium text-zinc-300 ${
                refreshing ? 'animate-pulse' : ''
              }`}
            >
              {refreshing ? (
                <>
                  <svg
                    className="h-3.5 w-3.5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Refreshing…
                </>
              ) : (
                <>
                  <svg
                    className="h-3.5 w-3.5 transition-transform"
                    style={{ transform: `rotate(${pullProgress * 180}deg)` }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  {pullProgress >= 1 ? 'Release to refresh' : 'Pull to refresh'}
                </>
              )}
            </div>
          </div>
        )}
        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </div>
      </div>
    </PullToRefreshContext.Provider>
  );
}
