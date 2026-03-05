'use client';

import { useEffect, useState } from 'react';

/** Returns true when viewport is >= 768px (Tailwind md breakpoint). */
export function useMediaQueryMd(): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    setMatches(mq.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return matches;
}
