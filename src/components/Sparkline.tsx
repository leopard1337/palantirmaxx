'use client';

import { memo, useMemo } from 'react';

interface SparklineProps {
  detected: number;
  peak: number;
  now: number;
  positive?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export const Sparkline = memo(function Sparkline({
  detected,
  peak,
  now,
  positive = true,
  width = 120,
  height = 36,
}: SparklineProps) {
  const { path, fillPath, gradientId, points } = useMemo(() => {
    const pad = 4;
    const w = width - pad * 2;
    const h = height - pad * 2;

    const vals = [detected, peak, now];
    const min = Math.min(...vals) * 0.98;
    const max = Math.max(...vals) * 1.02;
    const range = max - min || 1;

    const toY = (v: number) => pad + h - ((v - min) / range) * h;
    const pts = [
      { x: pad, y: toY(detected) },
      { x: pad + w * 0.55, y: toY(peak) },
      { x: pad + w, y: toY(now) },
    ];

    const cp1x = pts[0].x + (pts[1].x - pts[0].x) * 0.5;
    const cp2x = pts[1].x + (pts[2].x - pts[1].x) * 0.5;

    const linePath = `M${pts[0].x},${pts[0].y} Q${cp1x},${pts[1].y} ${pts[1].x},${pts[1].y} Q${cp2x},${pts[2].y} ${pts[2].x},${pts[2].y}`;
    const fill = `${linePath} L${pts[2].x},${height} L${pts[0].x},${height} Z`;
    const gid = `sg-${Math.random().toString(36).slice(2, 8)}`;

    return { path: linePath, fillPath: fill, gradientId: gid, points: pts };
  }, [detected, peak, now, width, height]);

  const color = positive ? '#00ffa3' : '#ff4757';
  const colorFaded = positive ? 'rgba(0,255,163,0.15)' : 'rgba(255,71,87,0.15)';

  return (
    <svg width={width} height={height} className="shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorFaded} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill={`url(#${gradientId})`} />
      <path d={path} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      {/* Detected dot */}
      <circle cx={points[0].x} cy={points[0].y} r={2} fill={color} opacity={0.5} />
      {/* Peak dot */}
      <circle cx={points[1].x} cy={points[1].y} r={2.5} fill={color} opacity={0.8} />
      {/* Now dot (pulsing) */}
      <circle cx={points[2].x} cy={points[2].y} r={3} fill={color}>
        <animate attributeName="r" values="2.5;3.5;2.5" dur="2s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="1;0.6;1" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
});
