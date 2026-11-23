import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import { isThemeSwitchable, palettes, themeCss, type ThemeMode } from '@/theme';

const KEY = 'osgbhub:theme';

function readMode(): ThemeMode {
  if (!isThemeSwitchable || typeof window === 'undefined') return 'dark';
  try {
    return window.localStorage.getItem(KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function applyMode(mode: ThemeMode) {
  if (!isThemeSwitchable || typeof document === 'undefined') return;
  document.documentElement.dataset.theme = mode;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', palettes[mode].bg);
}

// Web: tema CSS değişkenlerini uygulama açılırken bir kez ekle
if (isThemeSwitchable && typeof document !== 'undefined' && !document.getElementById('osgb-theme')) {
  const style = document.createElement('style');
  style.id = 'osgb-theme';
  style.textContent = themeCss();
  document.head.appendChild(style);
  applyMode(readMode());
}

type ThemeValue = {
  mode: ThemeMode;
  /** Bu platformda tema değiştirilebilir mi (şimdilik yalnızca web) */
  switchable: boolean;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeValue>({
  mode: 'dark',
  switchable: false,
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readMode);

  const value = useMemo<ThemeValue>(() => {
    const setMode = (m: ThemeMode) => {
      setModeState(m);
      applyMode(m);
      try {
        window.localStorage.setItem(KEY, m);
      } catch {
        // gizli sekme vb.
      }
    };
    return {
      mode,
      switchable: isThemeSwitchable,
      setMode,
      toggle: () => setMode(mode === 'dark' ? 'light' : 'dark'),
    };
  }, [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
