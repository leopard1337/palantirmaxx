'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useWalkthrough } from '@/context/WalkthroughContext';
import { useMediaQueryMd } from '@/hooks/useMediaQuery';
import { useWalletAccess, isRouteGated } from '@/context/WalletContext';
import { ConnectWalletButton } from '@/components/ConnectWalletButton';
import { fetchFeed } from '@/lib/api/feed';
import { fetchFlights } from '@/lib/api/flights';
import { fetchEvents } from '@/lib/api/events';
import { fetchMovers } from '@/lib/api/movers';
import { fetchCryptoQuotes, fetchStablecoinMarkets, fetchTrends, fetchISS } from '@/lib/api/intel';

const nav: { href: string; label: string; exact?: boolean }[] = [
  { href: '/', label: 'Dashboard', exact: true },
  { href: '/feed', label: 'Feed' },
  { href: '/grid', label: 'Grid' },
  { href: '/events', label: 'Events' },
  { href: '/movers', label: 'Movers' },
  { href: '/intel', label: 'Intel' },
  { href: '/globe', label: 'Globe' },
  { href: '/markets', label: 'Markets' },
  { href: '/wallets', label: 'Wallets' },
  { href: '/watchlist', label: 'Watchlist' },
  { href: '/token', label: '$QUANT' },
];

export function TopBar() {
  const pathname = usePathname();
  const walkthrough = useWalkthrough();
  const queryClient = useQueryClient();
  const isDesktop = useMediaQueryMd();

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
    if (href === '/globe') {
      queryClient.prefetchQuery({ queryKey: ['flights'], queryFn: () => fetchFlights(50) });
      queryClient.prefetchQuery({ queryKey: ['iss'], queryFn: () => fetchISS(true) });
    }
    if (href === '/events') queryClient.prefetchQuery({ queryKey: ['events', 'all'], queryFn: () => fetchEvents('all') });
    if (href === '/movers') queryClient.prefetchQuery({ queryKey: ['movers'], queryFn: fetchMovers });
    if (href === '/markets') queryClient.prefetchQuery({ queryKey: ['events', 'all'], queryFn: () => fetchEvents('all') });
    if (href === '/intel') {
      queryClient.prefetchQuery({ queryKey: ['intel', 'crypto'], queryFn: () => fetchCryptoQuotes(['bitcoin', 'ethereum', 'solana']) });
      queryClient.prefetchQuery({ queryKey: ['intel', 'stablecoins'], queryFn: () => fetchStablecoinMarkets() });
      queryClient.prefetchQuery({ queryKey: ['intel', 'trends'], queryFn: () => fetchTrends('US') });
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
  const navRef = useRef<HTMLElement>(null);

  // Scroll active nav item into view on mobile when route changes
  useEffect(() => {
    const activeEl = navRef.current?.querySelector('[data-nav-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [pathname]);

  return (
    <header className="flex flex-col md:flex-row md:h-12 shrink-0 border-b border-[var(--border)] bg-background">
      {/* Row 1 on mobile: logo + feed count. Desktop: inline with nav */}
      <div className="flex h-11 md:h-auto shrink-0 items-center justify-between md:justify-start px-3 md:px-5 min-w-0 border-b md:border-b-0 border-white/[0.06]">
        <Link href="/" className="flex items-center gap-2 shrink-0 min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded">
          <img src="/quantis-logo.png" alt="Quantis" className="h-7 w-auto" />
          <span className="text-[13px] md:text-[14px] font-bold text-foreground tracking-tight">
            Quantis
          </span>
          <span className="flex items-center gap-1 rounded px-1.5 py-0.5 bg-accent/10 text-[9px] font-bold text-accent tracking-wider">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            LIVE
          </span>
        </Link>
        <div className="flex items-center gap-2 md:hidden">
          <a
            href="https://x.com/quantisgg"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Quantis on X"
            className="rounded p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <ConnectWalletButton />
          {feedCount > 0 && (
            <span className="text-[10px] font-medium text-zinc-400">
              <span className="text-zinc-200 tabular-nums">{feedCount}</span>
            </span>
          )}
        </div>
      </div>

      {/* Nav - centered on desktop */}
      <nav
        ref={navRef}
        className="flex-1 flex items-center md:justify-center justify-start gap-2 md:gap-0.5 min-w-0 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory px-3 md:px-0 py-1.5 md:py-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch]"
        aria-label="Main navigation"
      >
        {nav.filter((item) => item.href !== '/globe' || isDesktop).map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => prefetchRoute(item.href)}
              data-nav-active={active ? 'true' : undefined}
              className={`relative rounded-md px-3 md:px-2.5 py-2.5 md:py-1.5 min-h-[44px] md:min-h-0 flex items-center text-[11px] md:text-[12px] transition-all duration-200 shrink-0 snap-center active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
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

      {/* Right: X link, wallet, counters - hidden on mobile (nav gets full width) */}
      <div className="hidden md:flex items-center gap-3 shrink-0 md:pr-5">
        <a
          href="https://x.com/quantisgg"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Quantis on X"
          className="rounded p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
        <ConnectWalletButton />
        {walkthrough && (
          <button
            type="button"
            onClick={walkthrough.replay}
            className="hidden md:inline-flex rounded px-2 py-1 text-[10px] font-medium text-zinc-500 hover:text-accent hover:bg-accent/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
