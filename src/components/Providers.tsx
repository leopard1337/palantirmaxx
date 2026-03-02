'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Component, useState, type ReactNode } from 'react';

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-screen items-center justify-center bg-background p-8">
          <div className="max-w-md text-center">
            <h1 className="text-lg font-bold text-foreground mb-2">
              Something went wrong
            </h1>
            <p className="text-[12px] text-zinc-500 mb-4">
              {this.state.error.message}
            </p>
            <button
              onClick={() => {
                this.setState({ error: null });
                window.location.reload();
              }}
              className="rounded-lg bg-accent/10 border border-accent/15 px-4 py-2 text-[12px] font-medium text-accent hover:bg-accent/20 transition-colors"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchInterval: 30_000,
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ErrorBoundary>
  );
}
