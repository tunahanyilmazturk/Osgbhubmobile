import { useWindowDimensions } from 'react-native';

/** Kırılım noktaları (CSS px / pt) */
export const BREAKPOINTS = {
  /** Tablet: içerik genişler, listeler 2 sütun */
  wide: 768,
  /** Bilgisayar: kenar menü, çok sütunlu ızgara */
  desktop: 1024,
  /** Geniş bilgisayar: listeler 3 sütun */
  xl: 1360,
} as const;

export const SIDEBAR_WIDTH = 264;
export const SIDEBAR_COLLAPSED = 76;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINTS.desktop;
  const isWide = width >= BREAKPOINTS.wide;
  const isXL = width >= BREAKPOINTS.xl;
  return {
    width,
    height,
    isDesktop,
    isWide,
    isXL,
    /** Liste ekranlarında sütun sayısı */
    columns: isXL ? 3 : isWide ? 2 : 1,
    /** Sayfa içeriğinin en fazla genişliği */
    contentMaxWidth: isDesktop ? 1160 : isWide ? 760 : 600,
  };
}
