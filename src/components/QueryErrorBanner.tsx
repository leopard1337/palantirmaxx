'use client';

export function QueryErrorBanner({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div
      className="rounded-lg border border-red-900/40 bg-red-950/20 p-4 text-red-300"
      role="alert"
    >
      <p className="text-[12px] font-medium">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded bg-red-900/40 px-3 py-1.5 text-[11px] hover:bg-red-900/60 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  );
}
