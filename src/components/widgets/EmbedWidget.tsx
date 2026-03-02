'use client';

import { useState } from 'react';

export function EmbedWidget({ url, title }: { url: string; title: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="absolute inset-0 bg-background">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-accent" />
          <span className="text-[9px] text-zinc-600">Loading {title}...</span>
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
