'use client';

import { useCallback, useEffect, useState } from 'react';

export function useKeyboardShortcuts(opts?: {
  onJ?: () => void;
  onK?: () => void;
  onQuestion?: () => void;
}) {
  const [showHelp, setShowHelp] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setShowHelp((v) => !v);
        opts?.onQuestion?.();
      }
      if (e.key === 'j' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        opts?.onJ?.();
      }
      if (e.key === 'k' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        opts?.onK?.();
      }
    },
    [opts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { showHelp, setShowHelp };
}
