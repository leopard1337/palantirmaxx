'use client';

import { memo, useMemo } from 'react';

interface DataPoint {
  date?: string;
  value: number;
}

export const MiniSparkline = memo(function MiniSparkline({
  data,
  width = 60,
  height = 24,
  positive = true,
  className,
}: {
  data: DataPoint[];
  width?: number;
  height?: number;
  positive?: boolean;
  className?: string;
}) {
  const { path, fillPath, gradientId } = useMemo(() => {
    const pad = 2;
    const w = width - pad * 2;
    const h = height - pad * 2;
    const vals = data.map((d) => d.value).filter((v) => typeof v === 'number');
    if (vals.length < 2) return { path: '', fillPath: '', gradientId: 'empty' };

    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const range = max - min || 1;

    const points = vals.map((v, i) => ({
      x: pad + (i / Math.max(1, vals.length - 1)) * w,
      y: pad + h - ((v - min) / range) * h,
    }));

    const linePath =
      'M' +
      points.map((p) => `${p.x},${p.y}`).join(' L');
    const fill = `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;
    const gid = `mspark-${Math.random().toString(36).slice(2, 8)}`;
    return { path: linePath, fillPath: fill, gradientId: gid };
  }, [data, width, height]);

  const color = positive ? '#00ffa3' : '#ff4757';
  const colorFaded = positive ? 'rgba(0,255,163,0.12)' : 'rgba(255,71,87,0.12)';

  if (!path || path === '') return null;

  return (
    <svg width={width} height={height} className={className}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorFaded} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
});
