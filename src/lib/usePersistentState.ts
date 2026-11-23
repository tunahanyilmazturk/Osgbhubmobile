import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

const PREFIX = 'osgbhub:pref:';
const web = Platform.OS === 'web' && typeof window !== 'undefined';

function readSync<T>(key: string, fallback: T): T {
  if (!web) return fallback;
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

/**
 * Ekran tercihleri (görünüm modu, sayfa boyutu, menü daraltma) için kalıcı state.
 * Web'de ilk çizimde senkron okunur (titreme olmaz), telefonda AsyncStorage'dan yüklenir.
 */
export function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readSync(key, fallback));

  useEffect(() => {
    if (web) return;
    AsyncStorage.getItem(PREFIX + key)
      .then((raw) => {
        if (raw != null) setValue(JSON.parse(raw));
      })
      .catch(() => {});
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        AsyncStorage.setItem(PREFIX + key, JSON.stringify(v)).catch(() => {});
        return v;
      });
    },
    [key],
  );

  return [value, set] as const;
}
