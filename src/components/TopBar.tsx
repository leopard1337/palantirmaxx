'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWalkthrough } from '@/context/WalkthroughContext';
import { fetchFeed } from '@/lib/api/feed';
import { fetchFlights } from '@/lib/api/flights';
import { fetchEvents } from '@/lib/api/events';
import { fetchMovers } from '@/lib/api/movers';
import { fetchCryptoQuotes, fetchStablecoinMarkets } from '@/lib/api/intel';

const nav: { href: string; label: string; exact?: boolean }[] = [
  { href: '/', label: 'Dashboard', exact: true },
  { href: '/feed', label: 'Feed' },
  { href: '/grid', label: 'Grid' },
  { href: '/events', label: 'Events' },
  { href: '/movers', label: 'Movers' },
  { href: '/intel', label: 'Intel' },
  { href: '/globe', label: 'Globe' },
  { href: '/markets', label: 'Markets' },
];

export function TopBar() {
  const pathname = usePathname();
  const walkthrough = useWalkthrough();
  const queryClient = useQueryClient();

  const prefetchedRef = useRef<Set<string>>(new Set());
  const prefetchRoute = (href: string) => {
    if (prefetchedRef.current.has(href)) return;
    prefetchedRef.current.add(href);
    setTimeout(() => prefetchedRef.current.delete(href), 5000);
    if (href === '/feed') {
      queryClient.prefetchInfiniteQuery({
        queryKey: ['feed', 'all'],
        queryFn: ({ pageParam }) => fetchFeed({ page: pageParam, count: 20 }),
        initialPageParam: 1,
      });
    }
    if (href === '/globe') queryClient.prefetchQuery({ queryKey: ['flights'], queryFn: () => fetchFlights(50) });
    if (href === '/events') queryClient.prefetchQuery({ queryKey: ['events', 'all'], queryFn: () => fetchEvents('all') });
    if (href === '/movers') queryClient.prefetchQuery({ queryKey: ['movers'], queryFn: fetchMovers });
    if (href === '/markets') queryClient.prefetchQuery({ queryKey: ['events', 'all'], queryFn: () => fetchEvents('all') });
    if (href === '/intel') {
      queryClient.prefetchQuery({ queryKey: ['intel', 'crypto'], queryFn: () => fetchCryptoQuotes(['bitcoin', 'ethereum', 'solana']) });
      queryClient.prefetchQuery({ queryKey: ['intel', 'stablecoins'], queryFn: () => fetchStablecoinMarkets() });
    }
  };

  const { data: feedData } = useQuery({
    queryKey: ['feed', 'topbar-count'],
    queryFn: () => fetchFeed({ page: 1, count: 1 }),
    refetchInterval: 10_000,
    staleTime: 10_000,
  });

  const { data: flights } = useQuery({
    queryKey: ['flights', 'topbar-count'],
    queryFn: () => fetchFlights(1),
    refetchInterval: 10_000,
    staleTime: 10_000,
  });

  const feedCount = feedData?.total ?? 0;
  const flightCount = flights?.length ?? 0;

  return (
    <header className="flex h-12 shrink-0 items-center border-b border-[var(--border)] bg-background px-4 md:px-5">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded">
        <span className="text-[14px] font-bold text-foreground tracking-tight">
          PALANTIR
        </span>
        <span className="flex items-center gap-1 rounded px-1.5 py-0.5 bg-accent/10 text-[9px] font-bold text-accent tracking-wider">
          <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          LIVE
        </span>
      </Link>

      {/* Centered Nav - scrollable on mobile */}
      <nav className="flex-1 flex items-center justify-center gap-1 min-w-0 overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Main navigation">
        {nav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => prefetchRoute(item.href)}
              className={`relative rounded-md px-2.5 md:px-3 py-2 md:py-1.5 min-h-[44px] md:min-h-0 flex items-center text-[12px] md:text-[13px] transition-all duration-200 shrink-0 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                active
                  ? 'text-foreground font-medium'
                  : 'text-zinc-500 hover:text-zinc-200'
              }`}
            >
              {item.label}
              {active && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-[2px] w-4 rounded-full bg-accent animate-fade-in" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Right: counters + replay tutorial (dev) */}
      <div className="flex items-center gap-4 shrink-0">
        {walkthrough && (
          <button
            type="button"
            onClick={walkthrough.replay}
            className="rounded px-2 py-1 text-[10px] font-medium text-zinc-500 hover:text-accent hover:bg-accent/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            title="Replay tutorial"
          >
            Replay tutorial
          </button>
        )}
        {feedCount > 0 && (
          <span className="text-[10px] font-medium tracking-wide text-zinc-400">
            Feed <span className="text-zinc-200 tabular-nums">({feedCount})</span>
          </span>
        )}
        {flightCount > 0 && (
          <span className="hidden sm:inline text-[10px] font-medium tracking-wide text-zinc-400">
            Flights <span className="text-zinc-200 tabular-nums">({flightCount})</span>
          </span>
        )}
      </div>
    </header>
  );
}
