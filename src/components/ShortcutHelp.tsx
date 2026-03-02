'use client';

export function ShortcutHelp({
  onClose,
  feedShortcuts = true,
}: {
  onClose: () => void;
  feedShortcuts?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcut-help-title"
      onClick={onClose}
    >
      <div
        className="max-w-sm rounded-lg border border-white/[0.08] bg-surface p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="shortcut-help-title" className="mb-3 text-sm font-semibold text-zinc-200">
          Keyboard shortcuts
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-zinc-400">?</dt>
            <dd className="text-zinc-300">Show / hide this help</dd>
          </div>
          {feedShortcuts && (
            <>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">j</dt>
                <dd className="text-zinc-300">Next item</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-zinc-400">k</dt>
                <dd className="text-zinc-300">Previous item</dd>
              </div>
            </>
          )}
        </dl>
        <button
          type="button"
          onClick={onClose}
          className="mt-4 w-full rounded bg-white/[0.06] py-1.5 text-sm text-zinc-200 hover:bg-white/[0.1] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        >
          Close
        </button>
      </div>
    </div>
  );
}
