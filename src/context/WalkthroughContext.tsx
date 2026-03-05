'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  WALKTHROUGH_STEPS,
  WALKTHROUGH_STORAGE_KEY,
} from '@/lib/walkthrough';
import { useMediaQueryMd } from '@/hooks/useMediaQuery';

type WalkthroughStep = (typeof WALKTHROUGH_STEPS)[number];
type WalkthroughContextValue = {
  active: boolean;
  step: number;
  steps: WalkthroughStep[];
  goNext: () => void;
  goBack: () => void;
  skip: () => void;
  replay: () => void;
};

const WalkthroughContext = createContext<WalkthroughContextValue | null>(null);

function isFirstVisit(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return !localStorage.getItem(WALKTHROUGH_STORAGE_KEY);
  } catch {
    return false;
  }
}

export function WalkthroughProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isDesktop = useMediaQueryMd();
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  const steps = useMemo(
    () =>
      isDesktop
        ? WALKTHROUGH_STEPS
        : WALKTHROUGH_STEPS.filter((s) => !('hideOnMobile' in s && s.hideOnMobile)),
    [isDesktop]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !isFirstVisit()) return;
    const splashKey = 'raven-splash-shown';
    const splashDoneEvent = 'raven-splash-complete';

    if (sessionStorage.getItem(splashKey)) {
      setActive(true);
      setStep(0);
      return;
    }

    const onSplashComplete = () => {
      window.removeEventListener(splashDoneEvent, onSplashComplete);
      setActive(true);
      setStep(0);
    };
    window.addEventListener(splashDoneEvent, onSplashComplete);

    const fallback = setTimeout(() => {
      window.removeEventListener(splashDoneEvent, onSplashComplete);
      setActive(true);
      setStep(0);
    }, 4000);

    return () => {
      window.removeEventListener(splashDoneEvent, onSplashComplete);
      clearTimeout(fallback);
    };
  }, [mounted]);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(WALKTHROUGH_STORAGE_KEY, 'true');
    } catch {
      /* ignore */
    }
    setActive(false);
  }, []);

  const goNext = useCallback(() => {
    const nextStep = step + 1;
    if (nextStep >= WALKTHROUGH_STEPS.length) {
      finish();
      return;
    }
    setStep(nextStep);
    const nextConfig = WALKTHROUGH_STEPS[nextStep];
    if (nextConfig.route !== pathname) {
      router.push(nextConfig.route);
    }
  }, [step, pathname, router, finish]);

  const goBack = useCallback(() => {
    if (step <= 0) return;
    const prevStep = step - 1;
    setStep(prevStep);
    const prevConfig = WALKTHROUGH_STEPS[prevStep];
    if (prevConfig.route !== pathname) {
      router.push(prevConfig.route);
    }
  }, [step, pathname, router]);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  const replay = useCallback(() => {
    try {
      localStorage.removeItem(WALKTHROUGH_STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setStep(0);
    setActive(true);
    router.push('/');
  }, [router]);

  const value: WalkthroughContextValue = {
    active,
    step,
    steps,
    goNext,
    goBack,
    skip,
    replay,
  };

  return (
    <WalkthroughContext.Provider value={value}>
      {children}
    </WalkthroughContext.Provider>
  );
}

export function useWalkthrough() {
  const ctx = useContext(WalkthroughContext);
  return ctx;
}
