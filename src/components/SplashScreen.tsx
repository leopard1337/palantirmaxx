'use client';

import { useEffect, useRef, useState } from 'react';

const SPLASH_STORAGE_KEY = 'raven-splash-shown';
const MATRIX_GREEN = '#00ff41';

function useSplashEligible(): boolean {
  const [eligible, setEligible] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      setEligible(!sessionStorage.getItem(SPLASH_STORAGE_KEY));
    } catch {
      setEligible(true);
    }
  }, []);
  return eligible;
}

function SplashScreenInner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | undefined>(undefined);
  const [phase, setPhase] = useState<'visible' | 'fading' | 'gone'>('visible');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fontSize = 12;
    const colWidth = 10;
    const trailLen = 12;
    const charSet = '01';
    const cols: { x: number; y: number; speed: number; chars: string[] }[] = [];
    const w = window.innerWidth;
    const colsCount = (w / colWidth) | 0;

    for (let i = 0; i < colsCount; i++) {
      cols.push({
        x: i * colWidth,
        y: Math.random() * -400,
        speed: 0.6 + Math.random() * 0.8,
        chars: Array.from({ length: trailLen }, () => charSet[(Math.random() * 2) | 0]),
      });
    }

    const fontStr = `${fontSize}px "JetBrains Mono", monospace`;
    const alphaCache: string[] = [];
    for (let i = 0; i <= trailLen; i++) {
      const a = Math.max(0, 1 - (i / trailLen) * 0.92);
      alphaCache.push(`rgba(0, 255, 65, ${a})`);
    }

    const resize = () => {
      const dpr = 1; // Lower DPR for speed
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    let last = performance.now();
    const loop = () => {
      const now = performance.now();
      const dt = Math.min(now - last, 32);
      last = now;

      const h = window.innerHeight;
      ctx.fillStyle = 'rgba(10, 10, 10, 0.06)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = fontStr;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';

      for (const c of cols) {
        c.y += c.speed * (dt / 16);
        if (c.y > h + trailLen * fontSize) {
          c.y = -trailLen * fontSize;
          for (let j = 0; j < trailLen; j++) c.chars[j] = charSet[(Math.random() * 2) | 0];
        }
        for (let i = 0; i < trailLen; i++) {
          const sy = c.y - i * fontSize;
          if (sy < -fontSize || sy > h + fontSize) continue;
          ctx.fillStyle = alphaCache[i];
          ctx.fillText(c.chars[i], c.x, sy);
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current!);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setPhase('fading'), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 'fading') return;
    const t = setTimeout(() => {
      setPhase('gone');
      try {
        sessionStorage.setItem(SPLASH_STORAGE_KEY, '1');
      } catch {}
    }, 700);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === 'gone') return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-[#0a0a0a]"
      aria-hidden
      style={{
        opacity: phase === 'visible' ? 1 : 0,
        transition: phase === 'fading' ? 'opacity 0.7s ease-out' : 'none',
        pointerEvents: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
      <div
        className="relative z-10 flex flex-col items-center gap-4"
        style={{ animation: 'splash-drop-in 0.55s ease-out forwards' }}
      >
        <img
          src="/raven-logo.png"
          alt="Raven"
          className="h-16 w-16 object-contain sm:h-20 sm:w-20"
          fetchPriority="high"
        />
        <p
          className="text-xl font-light tracking-[0.25em] sm:text-2xl md:text-3xl"
          style={{
            color: MATRIX_GREEN,
            fontFamily: 'var(--font-jetbrains), "JetBrains Mono", monospace',
          }}
        >
          Welcome to raven.
        </p>
      </div>
    </div>
  );
}

export function SplashScreen() {
  const eligible = useSplashEligible();
  if (!eligible) return null;
  return <SplashScreenInner />;
}
