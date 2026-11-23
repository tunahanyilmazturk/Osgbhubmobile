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
  bg: '#0A0A0B',
  bgElevated: '#121214',
  surface: '#17171A',
  surfaceHigh: '#1F1F23',
  border: '#2A2A30',
  borderStrong: '#3A3A42',

  // Amber
  amber: '#FFB020',
  amberLight: '#FFC857',
  amberDark: '#E08E00',
  amberDeep: '#B36B00',
  amberSoft: 'rgba(255, 176, 32, 0.12)',
  amberGlow: 'rgba(255, 176, 32, 0.28)',

  // Metin ("white" = en güçlü başlık rengi; aydınlık temada koyulaşır)
  white: '#FFFFFF',
  text: '#F5F5F4',
  textMuted: '#A1A1AA',
  textDim: '#6B6B75',
  onAmber: '#0A0A0B',
  onDanger: '#FFFFFF',

  // Durum
  danger: '#FF5A5F',
  dangerSoft: 'rgba(255, 90, 95, 0.12)',
  success: '#3DDC97',
  successSoft: 'rgba(61, 220, 151, 0.12)',

  // Yüzeyler
  highlight: '#17140D',
  tabBarBg: 'rgba(18, 18, 20, 0.97)',
  barBg: 'rgba(10, 10, 11, 0.96)',
  backdrop: 'rgba(0, 0, 0, 0.65)',
  certA: '#1C1810',
  certB: '#121214',
  certC: '#0E0E10',
  panelA: '#1C1609',
  panelB: '#110F0B',
};

export type Palette = typeof dark;

const light: Palette = {
  bg: '#F4F4F1',
  bgElevated: '#FFFFFF',
  surface: '#F2F2EF',
  surfaceHigh: '#E9E9E5',
  border: '#E2E2DD',
  borderStrong: '#CBCBC4',

  amber: '#D98F00',
  amberLight: '#FFC04D',
  amberDark: '#B97A00',
  amberDeep: '#966200',
  amberSoft: 'rgba(217, 143, 0, 0.12)',
  amberGlow: 'rgba(217, 143, 0, 0.22)',

  white: '#111113',
  text: '#1C1C1F',
  textMuted: '#55555F',
  textDim: '#7E7E88',
  onAmber: '#0A0A0B',
  onDanger: '#FFFFFF',

  danger: '#E0353A',
  dangerSoft: 'rgba(224, 53, 58, 0.10)',
  success: '#17955F',
  successSoft: 'rgba(23, 149, 95, 0.12)',

  highlight: '#FFF5DC',
  tabBarBg: 'rgba(255, 255, 255, 0.97)',
  barBg: 'rgba(255, 255, 255, 0.96)',
  backdrop: 'rgba(15, 15, 20, 0.45)',
  certA: '#FFF6E2',
  certB: '#FFFFFF',
  certC: '#FAFAF7',
  panelA: '#FFEFC7',
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
