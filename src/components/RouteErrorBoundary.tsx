'use client';

import Link from 'next/link';
import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
  retryKey: number;
}

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null, retryKey: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[RouteErrorBoundary]', error.message, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-1 items-center justify-center bg-background p-6">
          <div className="max-w-sm text-center">
            <h2 className="text-sm font-semibold text-foreground mb-1">
              This page encountered an error
            </h2>
            <p className="text-[11px] text-zinc-500 mb-4">
              {this.state.error.message}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() =>
                  this.setState((s) => ({ error: null, retryKey: s.retryKey + 1 }))
                }
                className="rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-zinc-200 hover:bg-white/[0.1] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Try again
              </button>
              <Link
                href="/"
                className="rounded-lg border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-[11px] font-medium text-zinc-200 hover:bg-white/[0.1] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
  }
}
