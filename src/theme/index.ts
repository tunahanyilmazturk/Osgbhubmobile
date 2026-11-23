/**
 * OSGB Hub tasarım sistemi — Siyah · Amber · Beyaz
 *
 * İki palet vardır (koyu / aydınlık). Web'de renkler CSS değişkeni olarak verilir
 * (`var(--c-bg)` gibi); tema değişince yalnızca değişkenler güncellenir, sayfa
 * yeniden çizilmeden tüm ekranlar anında yeni renge geçer. Telefon uygulamasında
 * şimdilik koyu palet kullanılır.
 */
import { Platform } from 'react-native';

const dark = {
  // Zemin
  bg: '#09090B',
  bgElevated: '#111114',
  surface: '#16161B',
  surfaceHigh: '#1E1E25',
  border: '#24242D',
  borderStrong: '#343442',

  // Amber
  amber: '#FFB020',
  amberLight: '#FFCB5C',
  amberDark: '#E08E00',
  amberDeep: '#B36B00',
  amberSoft: 'rgba(255, 176, 32, 0.12)',
  amberGlow: 'rgba(255, 176, 32, 0.28)',
  amberBorder: 'rgba(255, 176, 32, 0.34)',

  // Metin ("white" = en güçlü başlık rengi; aydınlık temada koyulaşır)
  white: '#FAFAFA',
  text: '#F2F2F0',
  textMuted: '#A1A1AA',
  textDim: '#71717D',
  onAmber: '#09090B',
  onDanger: '#FFFFFF',

  // Durum
  danger: '#FF5A5F',
  dangerSoft: 'rgba(255, 90, 95, 0.12)',
  dangerBorder: 'rgba(255, 90, 95, 0.34)',
  success: '#3DDC97',
  successSoft: 'rgba(61, 220, 151, 0.12)',
  successBorder: 'rgba(61, 220, 151, 0.34)',

  // Yüzeyler
  highlight: '#18140C',
  tabBarBg: 'rgba(17, 17, 20, 0.9)',
  barBg: 'rgba(9, 9, 11, 0.88)',
  backdrop: 'rgba(0, 0, 0, 0.68)',
  certA: '#1D180F',
  certB: '#121216',
  certC: '#0C0C0F',
  panelA: '#1E170A',
  panelB: '#110F0B',
};

export type Palette = typeof dark;

const light: Palette = {
  bg: '#F5F4EF',
  bgElevated: '#FFFFFF',
  surface: '#F0EFEA',
  surfaceHigh: '#E6E5DF',
  border: '#E2E0D8',
  borderStrong: '#CCC9BE',

  amber: '#D98C00',
  amberLight: '#FFBD42',
  amberDark: '#B87500',
  amberDeep: '#945E00',
  amberSoft: 'rgba(217, 140, 0, 0.11)',
  amberGlow: 'rgba(217, 140, 0, 0.22)',
  amberBorder: 'rgba(217, 140, 0, 0.34)',

  white: '#111114',
  text: '#1C1C21',
  textMuted: '#52525E',
  textDim: '#787885',
  onAmber: '#09090B',
  onDanger: '#FFFFFF',

  danger: '#DC2F35',
  dangerSoft: 'rgba(220, 47, 53, 0.09)',
  dangerBorder: 'rgba(220, 47, 53, 0.28)',
  success: '#158F5B',
  successSoft: 'rgba(21, 143, 91, 0.11)',
  successBorder: 'rgba(21, 143, 91, 0.28)',

  highlight: '#FFF6DE',
  tabBarBg: 'rgba(255, 255, 255, 0.92)',
  barBg: 'rgba(245, 244, 239, 0.88)',
  backdrop: 'rgba(15, 15, 22, 0.45)',
  certA: '#FFF7E4',
  certB: '#FFFFFF',
  certC: '#FBFBF8',
  panelA: '#FFF0CB',
  panelB: '#FFF9EC',
};

export const palettes = { dark, light } as const;
export type ThemeMode = keyof typeof palettes;

export const isThemeSwitchable = Platform.OS === 'web';

/** Bileşenlerde kullanılan renkler. Web: CSS değişkenleri, telefon: koyu palet. */
export const colors: Palette = isThemeSwitchable
  ? (Object.fromEntries(Object.keys(dark).map((k) => [k, `var(--c-${k})`])) as Palette)
  : dark;

/** Tema paletlerini CSS değişkenleri olarak üretir (web) */
export function themeCss() {
  const vars = (p: Palette) =>
    Object.entries(p)
      .map(([k, v]) => `--c-${k}:${v};`)
      .join('');
  return `:root{${vars(dark)}color-scheme:dark;}:root[data-theme="light"]{${vars(light)}color-scheme:light;}`;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  pill: 999,
} as const;

export const font = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  heavy: '800',
} as const;
