'use client';

import { useState } from 'react';
import { useDashboardLayout } from '@/lib/dashboard-store';
import { WidgetPanel } from '@/components/WidgetPanel';
import { FeedDetailDrawer } from '@/components/FeedDetailDrawer';
import { EventDetailDrawer } from '@/components/EventDetailDrawer';
import type { FeedItem, EventData } from '@/lib/api/types';

export default function DashboardPage() {
  const { layout, setWidget, loaded } = useDashboardLayout();
  const [selectedFeedItem, setSelectedFeedItem] = useState<FeedItem | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventData | null>(null);

  if (!loaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-700 border-t-accent" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-1.5 p-1.5 min-h-0">
      <div
        className="grid grid-cols-2 gap-1.5 min-h-0 overflow-hidden"
        style={{ flex: '3 1 0%' }}
      >
        {layout.panels.slice(0, 2).map((panel) => (
          <WidgetPanel
            key={panel.id}
            panel={panel}
            onSetWidget={(w) => setWidget(panel.id, w)}
            onSelectFeedItem={setSelectedFeedItem}
            onSelectEvent={setSelectedEvent}
          />
        ))}
      </div>
      <div
        className="grid grid-cols-3 gap-1.5 min-h-0 overflow-hidden"
        style={{ flex: '2 1 0%' }}
      >
        {layout.panels.slice(2, 5).map((panel) => (
          <WidgetPanel
            key={panel.id}
            panel={panel}
            onSetWidget={(w) => setWidget(panel.id, w)}
            onSelectFeedItem={setSelectedFeedItem}
            onSelectEvent={setSelectedEvent}
          />
        ))}
      </div>
      <FeedDetailDrawer item={selectedFeedItem} onClose={() => setSelectedFeedItem(null)} />
      <EventDetailDrawer event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
