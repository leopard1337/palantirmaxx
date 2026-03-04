import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
      <div className="max-w-sm text-center">
        <h1 className="text-2xl font-bold text-foreground mb-2">404</h1>
        <p className="text-sm text-zinc-500 mb-6">This page could not be found.</p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link
            href="/"
            className="inline-block rounded-lg border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.1] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Dashboard
          </Link>
          <Link
            href="/feed"
            className="inline-block rounded-lg border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-white/[0.1] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Feed
          </Link>
        </div>
      </div>
    </div>
  );
}
