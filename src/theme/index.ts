/**
 * OSGB Hub tasarım sistemi
 * Siyah · Amber · Beyaz
 */
export const colors = {
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

  // Metin
  white: '#FFFFFF',
  text: '#F5F5F4',
  textMuted: '#A1A1AA',
  textDim: '#6B6B75',
  onAmber: '#0A0A0B',

  // Durum
  danger: '#FF5A5F',
  dangerSoft: 'rgba(255, 90, 95, 0.12)',
  success: '#3DDC97',
  successSoft: 'rgba(61, 220, 151, 0.12)',
} as const;

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
