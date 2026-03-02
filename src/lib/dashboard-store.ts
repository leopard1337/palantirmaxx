'use client';

import { useCallback, useEffect, useState } from 'react';

export type WidgetType =
  | 'feed-all'
  | 'feed-news'
  | 'feed-tweet'
  | 'feed-telegram'
  | 'events'
  | 'markets'
  | 'movers'
  | 'globe'
  | 'embed-polymarket'
  | 'embed-liveuamap';

export interface PanelConfig {
  id: string;
  widget: WidgetType | null;
}

export interface DashboardLayout {
  panels: PanelConfig[];
}

const DEFAULT_LAYOUT: DashboardLayout = {
  panels: [
    { id: 'top-1', widget: null },
    { id: 'top-2', widget: null },
    { id: 'bot-1', widget: null },
    { id: 'bot-2', widget: null },
    { id: 'bot-3', widget: null },
  ],
};

const STORAGE_KEY = 'palantir-dashboard-v2';

export function useDashboardLayout() {
  const [layout, setLayout] = useState<DashboardLayout>(DEFAULT_LAYOUT);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DashboardLayout;
        if (parsed?.panels?.length === 5) setLayout(parsed);
      }
    } catch {
      /* corrupt storage -- use defaults */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout, loaded]);

  const setWidget = useCallback(
    (panelId: string, widget: WidgetType | null) => {
      setLayout((prev) => ({
        ...prev,
        panels: prev.panels.map((p) =>
          p.id === panelId ? { ...p, widget } : p,
        ),
      }));
    },
    [],
  );

  return { layout, setWidget, loaded };
}

export const WIDGET_CATALOG: {
  type: WidgetType;
  label: string;
  group: string;
  description: string;
}[] = [
  { type: 'feed-all', label: 'All Feed', group: 'Feed', description: 'All signal sources combined' },
  { type: 'feed-news', label: 'News', group: 'Feed', description: 'News wire signals' },
  { type: 'feed-tweet', label: 'X / Twitter', group: 'Feed', description: 'Twitter/X post signals' },
  { type: 'feed-telegram', label: 'Telegram', group: 'Feed', description: 'Telegram channel signals' },
  { type: 'events', label: 'Events', group: 'Data', description: 'Polymarket event categories' },
  { type: 'markets', label: 'Markets', group: 'Data', description: 'Active market contracts' },
  { type: 'movers', label: 'Top Movers', group: 'Data', description: 'Highest market-impact signals' },
  { type: 'globe', label: 'Flight Tracker', group: 'Visual', description: 'Live flight tracking list' },
  { type: 'embed-polymarket', label: 'Polymarket', group: 'Embed', description: 'Polymarket live embed' },
  { type: 'embed-liveuamap', label: 'Conflict Map', group: 'Embed', description: 'Live conflict awareness map' },
];
