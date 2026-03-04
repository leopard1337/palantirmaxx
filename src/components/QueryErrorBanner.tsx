'use client';

import { useState } from 'react';

export function QueryErrorBanner({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!onRetry || retrying) return;
    setRetrying(true);
    try {
      await Promise.resolve(onRetry());
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      className="rounded-lg border border-red-900/40 bg-red-950/20 p-4 text-red-300"
      role="alert"
      aria-busy={retrying}
    >
      <p className="text-[12px] font-medium">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={handleRetry}
          disabled={retrying}
          className="mt-3 rounded bg-red-900/40 px-3 py-1.5 text-[11px] hover:bg-red-900/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {retrying ? 'Retrying…' : 'Retry'}
        </button>
      )}
    </div>
  );
}
