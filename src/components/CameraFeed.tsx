'use client';

export interface CameraSource {
  id: string;
  country: string;
  slug: string;
  embedId: string;
  title?: string;
}

export const CAMERA_SOURCES: CameraSource[] = [
  { id: 'iran', country: 'Iran', slug: 'tehran', embedId: '-zGuR1qVKrU', title: 'Tehran & Isfahan' },
  { id: 'israel', country: 'Israel', slug: 'tel-aviv', embedId: 'gmtlJ_m2r5A', title: 'Tel Aviv & Region' },
  { id: 'jerusalem', country: 'Jerusalem', slug: 'jerusalem', embedId: 'FGUKbzulB_Y', title: 'Jerusalem' },
  { id: 'middle-east', country: 'Middle East', slug: 'multi', embedId: '4E-iFtUM2kk', title: 'Iran, Israel, Qatar' },
];

function CameraCard({ source, compact = false }: { source: CameraSource; compact?: boolean }) {
  const url = `https://www.youtube.com/embed/${source.embedId}?autoplay=1&mute=1`;

  return (
    <div className="rounded-lg border border-white/[0.08] bg-black/40 overflow-hidden flex flex-col min-h-0 flex-1 backdrop-blur-sm">
      <div className={`flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] shrink-0 ${compact ? 'px-2 py-1' : 'px-3 py-2'}`}>
        <span className={`font-semibold text-zinc-200 uppercase tracking-wide ${compact ? 'text-[9px]' : 'text-[11px]'}`}>
          {source.country}
        </span>
        {source.title && !compact && (
          <span className="text-[10px] text-zinc-500 truncate max-w-[140px]">
            {source.title}
          </span>
        )}
      </div>
      <div className={`relative bg-black flex-1 min-h-0 ${compact ? '' : 'aspect-video'}`}>
        <iframe
          src={url}
          title={`Live camera: ${source.country}`}
          className="absolute inset-0 w-full h-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
}

type CameraStreamId = 'all' | 'iran' | 'israel' | 'jerusalem' | 'middle-east';

export function CameraFeedGrid({
  compact = false,
  streamId = 'all',
}: {
  compact?: boolean;
  streamId?: CameraStreamId;
}) {
  const sources =
    streamId === 'all'
      ? CAMERA_SOURCES
      : CAMERA_SOURCES.filter((s) => s.id === streamId);

  const isSingle = streamId !== 'all';
  return (
    <div
      className={`grid gap-2 min-h-0 ${
        compact
          ? 'flex-1 w-full p-2'
          : 'gap-3 p-4'
      } ${isSingle ? 'grid-cols-1 grid-rows-1' : 'grid-cols-2 grid-rows-2'}`}
    >
      {sources.map((source) => (
        <CameraCard key={source.id} source={source} compact={compact} />
      ))}
    </div>
  );
}
