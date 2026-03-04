'use client';

/**
 * Catches unhandled errors at the root layout level.
 * Renders a minimal fallback UI (must define its own html/body).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[GlobalError]', error);
  }
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#06060a] text-zinc-200 antialiased flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <h1 className="text-lg font-bold text-zinc-100 mb-2">Something went wrong</h1>
          <p className="text-sm text-zinc-500 mb-4">
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="rounded-lg bg-[#00ffa3]/20 border border-[#00ffa3]/30 px-4 py-2 text-sm font-medium text-[#00ffa3] hover:bg-[#00ffa3]/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00ffa3]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#06060a]"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
