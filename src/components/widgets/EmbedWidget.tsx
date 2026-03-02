'use client';

import { useState, useEffect } from 'react';

const BLOCKED_DOMAINS = ['liveuamap.com'];

function isLikelyBlocked(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return BLOCKED_DOMAINS.some((d) => host.includes(d));
  } catch {
    return false;
  }
}

function ExternalLinkFallback({ url, title }: { url: string; title: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background p-6">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/[0.06] border border-white/[0.08] mb-4">
        <svg className="h-6 w-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
        </svg>
      </div>
      <p className="text-[12px] font-medium text-zinc-200 mb-1">{title}</p>
      <p className="text-[10px] text-zinc-500 text-center mb-4 max-w-48">
        This site doesn&apos;t allow in-app embedding.
      </p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg bg-accent/10 border border-accent/20 px-4 py-2 text-[11px] font-medium text-accent hover:bg-accent/20 transition-colors"
      >
        Open {title} in new tab
      </a>
    </div>
  );
}

export function EmbedWidget({ url, title }: { url: string; title: string }) {
  const [loaded, setLoaded] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const blocked = isLikelyBlocked(url);

  useEffect(() => {
    if (blocked) return;
    const timer = setTimeout(() => {
      if (!loaded) setTimedOut(true);
    }, 8000);
    return () => clearTimeout(timer);
  }, [blocked, loaded]);

  if (blocked || timedOut) {
    return <ExternalLinkFallback url={url} title={title} />;
  }

  return (
    <div className="absolute inset-0 bg-background">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-accent" />
          <span className="text-[9px] text-zinc-500">Loading {title}...</span>
        </div>
      )}
      <iframe
        src={url}
        title={title}
        className={`h-full w-full border-0 ${loaded ? '' : 'opacity-0'}`}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        loading="lazy"
        onLoad={() => setLoaded(true)}
      />
      {loaded && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-1 right-1 z-10 rounded bg-white/[0.06] px-1.5 py-0.5 text-[8px] text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Open in tab
        </a>
      )}
    </div>
  );
}
