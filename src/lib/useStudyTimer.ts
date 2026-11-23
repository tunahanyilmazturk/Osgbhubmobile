import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { actions } from '@/data/store';

/**
 * Katılımcının ekranda geçirdiği süreyi online eğitim kaydına ekler.
 * Uygulama arka plana alınınca (web'de sekme gizlenince) sayım durur.
 */
export function useStudyTimer(enrollmentId: string | undefined, active = true) {
  useEffect(() => {
    if (!enrollmentId || !active) return;
    let start = Date.now();
    let paused = false;

    const pause = () => {
      if (paused) return;
      actions.addStudyTime(enrollmentId, (Date.now() - start) / 1000);
      paused = true;
    };
    const resume = () => {
      if (!paused) return;
      start = Date.now();
      paused = false;
    };

    const sub = AppState.addEventListener('change', (st) => {
      if (st === 'active') resume();
      else pause();
    });

    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.hidden) pause();
      else resume();
    };
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisibility);
    }

    return () => {
      sub.remove();
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', onVisibility);
      }
      pause();
    };
  }, [enrollmentId, active]);
}

export function formatDuration(seconds: number) {
  const m = Math.round(seconds / 60);
  if (m < 60) return `${m} dk`;
  return `${Math.floor(m / 60)} sa ${m % 60} dk`;
}
