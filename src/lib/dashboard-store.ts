'use client';

import { useCallback, useEffect, useState } from 'react';

export type WidgetType =
  | 'feed-all'
  | 'feed-news'
  | 'feed-tweet'
  | 'feed-telegram'
  | 'camera-feed-all'
  | 'camera-feed-iran'
  | 'camera-feed-israel'
  | 'camera-feed-jerusalem'
  | 'camera-feed-middle-east'
  | 'camera-feed' // legacy, maps to camera-feed-all
  | 'events'
  | 'markets'
  | 'movers'
  | 'globe'
  | 'embed-polymarket'
  | 'embed-liveuamap'
  | 'intel-crypto'
  | 'intel-economic'
  | 'intel-disasters'
  | 'intel-energy';

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
  { type: 'camera-feed-all', label: 'Camera Feed (All)', group: 'Camera', description: 'All 4 live streams' },
  { type: 'camera-feed-iran', label: 'Camera Feed (Iran)', group: 'Camera', description: 'Tehran & Isfahan' },
  { type: 'camera-feed-israel', label: 'Camera Feed (Israel)', group: 'Camera', description: 'Tel Aviv & Region' },
  { type: 'camera-feed-jerusalem', label: 'Camera Feed (Jerusalem)', group: 'Camera', description: 'Jerusalem' },
  { type: 'camera-feed-middle-east', label: 'Camera Feed (Middle East)', group: 'Camera', description: 'Iran, Israel, Qatar' },
  { type: 'embed-polymarket', label: 'Polymarket', group: 'Embed', description: 'Polymarket live embed' },
  { type: 'embed-liveuamap', label: 'Conflict Map', group: 'Embed', description: 'Live conflict awareness map' },
  { type: 'intel-crypto', label: 'Crypto & Stablecoins', group: 'Intel', description: 'Crypto quotes & stablecoin peg status' },
  { type: 'intel-economic', label: 'Economic Indicators', group: 'Intel', description: 'FRED: UNRATE, VIX, 10Y, Fed Funds, CPI' },
  { type: 'intel-disasters', label: 'Disasters & Weather', group: 'Intel', description: 'Earthquakes, GDACS, weather alerts' },
  { type: 'intel-energy', label: 'Energy Prices', group: 'Intel', description: 'Commodity energy prices' },
];
