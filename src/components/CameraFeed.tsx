'use client';

import { memo, useCallback, useState } from 'react';

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

const YT_EMBED_PARAMS = 'autoplay=1&mute=1&controls=0&fs=0&modestbranding=1&rel=0&disablekb=1';

function CameraEmbed({ source }: { source: CameraSource }) {
  const url = `https://www.youtube.com/embed/${source.embedId}?${YT_EMBED_PARAMS}`;

  return (
    <div className="relative w-full aspect-video bg-black">
      <iframe
        src={url}
        title={`Live camera: ${source.country}`}
        className="absolute inset-0 w-full h-full border-0 block"
        allow="autoplay; encrypted-media; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
      />
    </div>
  );
}

const CameraTile = memo(function CameraTile({
  source,
  selected,
  onClick,
}: {
  source: CameraSource;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-lg border overflow-hidden bg-black/40 backdrop-blur-sm transition-all duration-150 hover:border-white/[0.2] active:scale-[0.99] ${
        selected ? 'border-accent ring-1 ring-accent/50' : 'border-white/[0.08]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-2 sm:px-3 py-1.5 shrink-0">
        <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-200 uppercase tracking-wide truncate">
          {source.country}
        </span>
        {source.title && (
          <span className="text-[9px] text-zinc-500 truncate max-w-[100px] sm:max-w-[140px] hidden sm:inline">
            {source.title}
          </span>
        )}
      </div>
      <div className="w-full aspect-video min-h-0 overflow-hidden">
        <CameraEmbed source={source} />
      </div>
    </button>
  );
});

function CameraCard({ source, compact = false }: { source: CameraSource; compact?: boolean }) {
  const url = `https://www.youtube.com/embed/${source.embedId}?${YT_EMBED_PARAMS}`;

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
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    </div>
  );
}

type CameraStreamId = 'all' | 'iran' | 'israel' | 'jerusalem' | 'middle-east';

export function CameraFeedGrid({
  compact = false,
  streamId = 'all',
  fill,
}: {
  compact?: boolean;
  streamId?: CameraStreamId;
  /** Fill parent - filmstrip grid with focus view */
  fill?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sources =
    streamId === 'all'
      ? CAMERA_SOURCES
      : CAMERA_SOURCES.filter((s) => s.id === streamId);

  const isSingle = streamId !== 'all';
  const selectedSource = selectedId ? sources.find((s) => s.id === selectedId) : null;

  const handleTileClick = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  }, []);

  const handleCloseFocus = useCallback(() => setSelectedId(null), []);

  if (fill) {
    return (
      <div className="flex flex-col h-full w-full p-3 gap-3 overflow-hidden">
        {/* Focus view - larger 16:9 player when a camera is selected */}
        {selectedSource && (
          <div className="shrink-0 animate-fade-in">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-semibold text-zinc-200 uppercase tracking-wide">
                {selectedSource.country}
                {selectedSource.title && (
                  <span className="text-zinc-500 font-normal normal-case ml-1">
                    — {selectedSource.title}
                  </span>
                )}
              </span>
              <button
                type="button"
                onClick={handleCloseFocus}
                className="text-[9px] text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Close focus
              </button>
            </div>
            <div className="rounded-lg overflow-hidden border border-white/[0.08] bg-black w-full max-w-2xl">
              <CameraEmbed source={selectedSource} />
            </div>
          </div>
        )}

        {/* Filmstrip grid - auto-fit minmax, 16:9 tiles */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div
            className="grid gap-2 sm:gap-3 items-start"
            style={{
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            }}
          >
            {sources.map((source) => (
              <CameraTile
                key={source.id}
                source={source}
                selected={selectedId === source.id}
                onClick={() => handleTileClick(source.id)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`grid gap-1.5 sm:gap-2 min-h-0 ${
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
