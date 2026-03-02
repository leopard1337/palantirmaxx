'use client';

import { CameraFeedGrid } from '@/components/CameraFeed';

type CameraStreamId = 'all' | 'iran' | 'israel' | 'jerusalem' | 'middle-east';

const WIDGET_TO_STREAM: Record<string, CameraStreamId> = {
  'camera-feed-all': 'all',
  'camera-feed-iran': 'iran',
  'camera-feed-israel': 'israel',
  'camera-feed-jerusalem': 'jerusalem',
  'camera-feed-middle-east': 'middle-east',
};

export function CameraFeedWidget({ widgetType }: { widgetType: string }) {
  const streamId = WIDGET_TO_STREAM[widgetType] ?? 'all';

  return (
    <div className="absolute inset-0 overflow-hidden flex flex-col min-h-0">
      <CameraFeedGrid compact streamId={streamId} />
    </div>
  );
}
