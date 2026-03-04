'use client';

import dynamic from 'next/dynamic';
import { useState, useRef, useEffect } from 'react';
import {
  type WidgetType,
  type PanelConfig,
  WIDGET_CATALOG,
} from '@/lib/dashboard-store';
import type { FeedItem, EventData } from '@/lib/api/types';
import { CryptoStablecoinWidget } from './widgets/CryptoStablecoinWidget';
import { DisastersWeatherWidget } from './widgets/DisastersWeatherWidget';
import { EconomicWidget } from './widgets/EconomicWidget';
import { EnergyWidget } from './widgets/EnergyWidget';
import { EventsWidget } from './widgets/EventsWidget';
import { FeedWidget } from './widgets/FeedWidget';
import { MarketsWidget } from './widgets/MarketsWidget';
import { MoversWidget } from './widgets/MoversWidget';

const FlightGlobeWidget = dynamic(
  () => import('./widgets/FlightGlobeWidget').then((m) => ({ default: m.FlightGlobeWidget })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-accent" /></div> }
);

const CameraFeedWidget = dynamic(
  () => import('./widgets/CameraFeedWidget').then((m) => ({ default: m.CameraFeedWidget })),
  { ssr: false, loading: () => <div className="flex h-full items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-accent" /></div> }
);

function WidgetSelector({
  onSelect,
  onClose,
}: {
  onSelect: (type: WidgetType) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const groups = WIDGET_CATALOG.reduce<Record<string, typeof WIDGET_CATALOG>>(
    (acc, item) => {
      (acc[item.group] ??= []).push(item);
      return acc;
    },
    {},
  );

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm">
      <div
        ref={ref}
        className="w-64 max-h-[85%] overflow-y-auto rounded-lg border border-white/[0.1] bg-surface shadow-2xl animate-scale-in"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-surface px-4 py-2.5">
          <span className="text-[11px] font-semibold text-zinc-200">
            Select Widget
          </span>
          <button
            onClick={onClose}
            aria-label="Close widget selector"
            className="rounded p-0.5 text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="p-2 space-y-2">
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <span className="block px-2 py-1 text-[9px] font-bold uppercase tracking-widest text-zinc-500">
                {group}
              </span>
              <div className="space-y-px">
                {items.map((item) => (
                  <button
                    key={item.type}
                    onClick={() => onSelect(item.type)}
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/[0.06]"
                  >
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-zinc-100">
                        {item.label}
                      </p>
                      <p className="text-[9px] text-zinc-400 truncate">
                        {item.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getWidgetLabel(type: WidgetType): string {
  if (type === 'camera-feed') return 'Camera Feed (All)';
  return WIDGET_CATALOG.find((w) => w.type === type)?.label ?? type;
}

function WidgetContent({
  type,
  onSelectFeedItem,
  onSelectEvent,
}: {
  type: WidgetType;
  onSelectFeedItem?: (item: FeedItem) => void;
  onSelectEvent?: (event: EventData) => void;
}) {
  if (type.startsWith('feed-')) {
    const feedType = type.replace('feed-', '') as
      | 'all'
      | 'news'
      | 'tweet'
      | 'telegram';
    return <FeedWidget type={feedType} onSelectItem={onSelectFeedItem} />;
  }
  if (type.startsWith('camera-feed-') || type === 'camera-feed') {
    return <CameraFeedWidget widgetType={type === 'camera-feed' ? 'camera-feed-all' : type} />;
  }
  switch (type) {
    case 'events':
      return <EventsWidget onSelectEvent={onSelectEvent} />;
    case 'markets':
      return <MarketsWidget />;
    case 'movers':
      return <MoversWidget onSelectItem={onSelectFeedItem} />;
    case 'globe':
      return <FlightGlobeWidget />;
    case 'intel-crypto':
      return <CryptoStablecoinWidget />;
    case 'intel-economic':
      return <EconomicWidget />;
    case 'intel-disasters':
      return <DisastersWeatherWidget />;
    case 'intel-energy':
      return <EnergyWidget />;
    default:
      return (
        <div className="flex items-center justify-center h-full text-zinc-500 text-[11px]">
          Unknown widget
        </div>
      );
  }
}

export function WidgetPanel({
  panel,
  onSetWidget,
  onSelectFeedItem,
  onSelectEvent,
}: {
  panel: PanelConfig;
  onSetWidget: (widget: WidgetType | null) => void;
  onSelectFeedItem?: (item: FeedItem) => void;
  onSelectEvent?: (event: EventData) => void;
}) {
  const [selectorOpen, setSelectorOpen] = useState(false);

  const handleSelect = (type: WidgetType) => {
    onSetWidget(type);
    setSelectorOpen(false);
  };

  if (!panel.widget) {
    return (
      <div className="relative h-full min-h-0 overflow-hidden">
        <button
          onClick={() => setSelectorOpen(true)}
          className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.08] bg-white/[0.02] transition-all hover:border-white/[0.14] hover:bg-white/[0.04] group"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.06] mb-2 transition-colors group-hover:border-white/[0.1] group-hover:bg-white/[0.08]">
            <svg
              className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300 transition-colors"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
          <span className="text-[11px] text-zinc-500 group-hover:text-zinc-300 transition-colors">
            Add Widget
          </span>
        </button>
        {selectorOpen && (
          <WidgetSelector
            onSelect={handleSelect}
            onClose={() => setSelectorOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-col rounded-lg border border-white/[0.08] bg-white/[0.03] overflow-hidden">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2 bg-white/[0.03] shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-[10px] font-semibold text-zinc-300 tracking-wide">
            {getWidgetLabel(panel.widget)}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setSelectorOpen(true)}
            className="rounded p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-colors"
            title="Change widget"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
          </button>
          <button
            onClick={() => onSetWidget(null)}
            className="rounded p-1 text-zinc-500 hover:bg-white/[0.06] hover:text-zinc-300 transition-colors"
            title="Remove widget"
            aria-label="Remove widget"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        <div className="absolute inset-0 overflow-hidden">
          <WidgetContent
            type={panel.widget}
            onSelectFeedItem={onSelectFeedItem}
            onSelectEvent={onSelectEvent}
          />
        </div>
      </div>
      {selectorOpen && (
        <WidgetSelector
          onSelect={handleSelect}
          onClose={() => setSelectorOpen(false)}
        />
      )}
    </div>
  );
}
