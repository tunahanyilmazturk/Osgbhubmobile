import { useEffect } from 'react';
import { AppState } from 'react-native';

import { actions } from '@/data/store';

/**
 * Katılımcının ekranda geçirdiği süreyi online eğitim kaydına ekler.
 * Uygulama arka plana alınınca sayım durur.
 */
export function useStudyTimer(enrollmentId: string | undefined, active = true) {
  useEffect(() => {
    if (!enrollmentId || !active) return;
    let start = Date.now();
    const flush = () => {
      actions.addStudyTime(enrollmentId, (Date.now() - start) / 1000);
      start = Date.now();
    };
    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') start = Date.now();
      else flush();
    });
    return () => {
      sub.remove();
      flush();
    };
  }, [enrollmentId, active]);
}

export function formatDuration(seconds: number) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} dk`;
  return `${Math.floor(m / 60)} sa ${m % 60} dk`;
}
