'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';

export function WidgetErrorBoundary({
  children,
  widgetLabel,
  onRetry,
}: {
  children: ReactNode;
  widgetLabel?: string;
  onRetry?: () => void;
}) {
  return (
    <WidgetErrorBoundaryInner widgetLabel={widgetLabel} onRetry={onRetry}>
      {children}
    </WidgetErrorBoundaryInner>
  );
}

class WidgetErrorBoundaryInner extends Component<
  { children: ReactNode; widgetLabel?: string; onRetry?: () => void },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[WidgetErrorBoundary]', error.message, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center p-4 text-center">
          <p className="text-[11px] text-zinc-400 mb-2">
            {this.props.widgetLabel ? `${this.props.widgetLabel} failed` : 'Widget failed'}
          </p>
          <p className="text-[10px] text-zinc-500 mb-3 line-clamp-2">
            {this.state.error.message}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              this.props.onRetry?.();
            }}
            className="rounded bg-white/[0.08] px-2.5 py-1 text-[10px] text-zinc-300 hover:bg-white/[0.12] transition-colors"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
