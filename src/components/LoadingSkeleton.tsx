export function FeedListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/[0.04] bg-white/[0.02] p-3"
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className="h-1.5 w-12 rounded bg-zinc-800/40 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }}
            />
            <div
              className="h-1.5 w-20 rounded bg-zinc-800/25 animate-pulse"
              style={{ animationDelay: `${i * 60 + 30}ms` }}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div
              className="h-2 w-full rounded bg-zinc-800/30 animate-pulse"
              style={{ animationDelay: `${i * 60 + 60}ms` }}
            />
            <div
              className="h-2 w-[75%] rounded bg-zinc-800/20 animate-pulse"
              style={{ animationDelay: `${i * 60 + 90}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EventListSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3"
        >
          <div
            className="h-10 w-10 rounded-lg bg-zinc-800/30 animate-pulse shrink-0"
            style={{ animationDelay: `${i * 50}ms` }}
          />
          <div className="flex-1 flex flex-col gap-1.5">
            <div
              className="h-2 w-[75%] rounded bg-zinc-800/30 animate-pulse"
              style={{ animationDelay: `${i * 50 + 30}ms` }}
            />
            <div
              className="h-1.5 w-[50%] rounded bg-zinc-800/20 animate-pulse"
              style={{ animationDelay: `${i * 50 + 60}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MoversTableSkeleton() {
  return (
    <div className="flex flex-col gap-1.5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3"
        >
          <div
            className="h-7 w-7 rounded bg-zinc-800/30 animate-pulse shrink-0"
            style={{ animationDelay: `${i * 40}ms` }}
          />
          <div className="flex-1 flex flex-col gap-1.5">
            <div
              className="h-2 w-full rounded bg-zinc-800/30 animate-pulse"
              style={{ animationDelay: `${i * 40 + 20}ms` }}
            />
            <div
              className="h-1.5 w-[66%] rounded bg-zinc-800/20 animate-pulse"
              style={{ animationDelay: `${i * 40 + 40}ms` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
