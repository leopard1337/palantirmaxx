'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  WALKTHROUGH_STEPS,
  WALKTHROUGH_STORAGE_KEY,
} from '@/lib/walkthrough';

type WalkthroughContextValue = {
  active: boolean;
  step: number;
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
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (isFirstVisit()) {
      setActive(true);
      setStep(0);
    }
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
