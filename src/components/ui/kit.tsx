import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { createContext, useContext, useState, type ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { initials } from '@/lib/format';
import { useLayout } from '@/lib/responsive';
import { colors, font, radius, spacing } from '@/theme';

export type IconName = keyof typeof Ionicons.glyphMap;
export type Tone = 'amber' | 'success' | 'danger' | 'neutral';

export const TONES: Record<Tone, { fg: string; bg: string; border: string }> = {
  amber: { fg: colors.amber, bg: colors.amberSoft, border: 'rgba(255,176,32,0.3)' },
  success: { fg: colors.success, bg: colors.successSoft, border: 'rgba(61,220,151,0.3)' },
  danger: { fg: colors.danger, bg: colors.dangerSoft, border: 'rgba(255,90,95,0.3)' },
  neutral: { fg: colors.textMuted, bg: colors.surfaceHigh, border: colors.border },
};

/* ---------------- Ekran genişliği ---------------- */

/** Screen'in seçtiği en fazla içerik genişliği; başlık aynı hizayı kullanır */
const WidthContext = createContext<number | null>(null);

/** Sayfa genişliği: 'narrow' detay/form sayfaları, 'wide' listeler ve panel */
export function usePageWidth(width: 'narrow' | 'wide' = 'wide') {
  const { contentMaxWidth, isDesktop } = useLayout();
  return width === 'narrow' && isDesktop ? 880 : contentMaxWidth;
}

/* ---------------- Ekran başlığı ---------------- */

export function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/dashboard');
}

type HeaderProps = {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  large?: boolean;
};

export function ScreenHeader({ title, subtitle, back = true, right, large }: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { isDesktop, contentMaxWidth } = useLayout();
  const maxWidth = useContext(WidthContext) ?? contentMaxWidth;
  return (
    <View
      style={[
        s.header,
        { paddingTop: insets.top + (isDesktop ? spacing.xxl : spacing.md) },
        isDesktop && { paddingHorizontal: spacing.xxxl, paddingBottom: spacing.lg },
      ]}
    >
      <View style={[s.headerRow, { maxWidth }]}>
        {back && (
          <Pressable
            onPress={goBack}
            style={s.headerBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Geri"
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </Pressable>
        )}
        <View style={{ flex: 1 }}>
          <Text style={[s.headerTitle, large && s.headerTitleLarge]} numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text style={s.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {right}
      </View>
    </View>
  );
}

export function IconButton({
  icon,
  onPress,
  label,
  tone = 'neutral',
}: {
  icon: IconName;
  onPress?: () => void;
  label: string;
  tone?: 'neutral' | 'amber';
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[s.headerBtn, tone === 'amber' && { backgroundColor: colors.amber, borderColor: colors.amber }]}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={tone === 'amber' ? colors.onAmber : colors.text} />
    </Pressable>
  );
}

/** Başlık + kaydırılabilir içerik; sekme çubuğu varsa alt boşluk bırakır */
export function Screen({
  header,
  children,
  tabBar,
  contentStyle,
  width = 'narrow',
}: {
  header: ReactNode;
  children: ReactNode;
  /** Altta sekme çubuğu ya da sabit işlem çubuğu varsa ekstra boşluk */
  tabBar?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  width?: 'narrow' | 'wide';
}) {
  const bottom = useBottomPadding(tabBar);
  const maxWidth = usePageWidth(width);
  const { isDesktop } = useLayout();
  return (
    <WidthContext.Provider value={maxWidth}>
      <View style={s.screen}>
        {header}
        <ScrollView
          contentContainerStyle={[
            s.screenContent,
            isDesktop && { paddingHorizontal: spacing.xxxl },
            { paddingBottom: bottom },
            contentStyle,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[s.inner, { maxWidth }]}>{children}</View>
        </ScrollView>
      </View>
    </WidthContext.Provider>
  );
}

export function useBottomPadding(tabBar?: boolean) {
  const insets = useSafeAreaInsets();
  const { isDesktop } = useLayout();
  // Bilgisayarda sekme çubuğu yok; yalnızca sabit işlem çubuğu için yer bırak
  if (tabBar) return insets.bottom + (isDesktop ? 100 : 120);
  return insets.bottom + spacing.xxxl;
}

/** FlatList'i ekran genişliğine göre çok sütunlu yapar */
export function useListLayout(gap: number = spacing.md) {
  const { columns, isDesktop } = useLayout();
  const maxWidth = usePageWidth('wide');
  return {
    key: `cols-${columns}`,
    numColumns: columns,
    columnWrapperStyle: columns > 1 ? { gap } : undefined,
    contentContainerStyle: {
      paddingHorizontal: isDesktop ? spacing.xxxl : spacing.xl,
      gap,
      width: '100%' as const,
      maxWidth: maxWidth + (isDesktop ? spacing.xxxl * 2 : spacing.xl * 2),
      alignSelf: 'center' as const,
    },
    /** Çok sütunda her öğe eşit genişlik alsın */
    itemStyle: columns > 1 ? { flex: 1 / columns, maxWidth: `${100 / columns}%` as const } : undefined,
  };
}

/** Bilgisayarda yan yana, telefonda alt alta sütunlar */
export function Columns({
  children,
  gap = spacing.xl,
  breakpoint = 'desktop',
  style,
}: {
  children: ReactNode;
  gap?: number;
  breakpoint?: 'wide' | 'desktop';
  style?: StyleProp<ViewStyle>;
}) {
  const { isDesktop, isWide } = useLayout();
  const row = breakpoint === 'wide' ? isWide : isDesktop;
  return <View style={[{ flexDirection: row ? 'row' : 'column', gap, alignItems: row ? 'flex-start' : 'stretch' }, style]}>{children}</View>;
}

/** Columns içinde bir sütun */
export function Column({ children, flex = 1, gap = spacing.lg }: { children: ReactNode; flex?: number; gap?: number }) {
  const { isDesktop } = useLayout();
  return <View style={[{ gap, minWidth: 0 }, isDesktop ? { flex } : { width: '100%' }]}>{children}</View>;
}

/* ---------------- Arama ---------------- */

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Ara',
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={s.search}>
      <Ionicons name="search" size={18} color={colors.textDim} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textDim}
        selectionColor={colors.amber}
        style={s.searchInput}
        autoCorrect={false}
        returnKeyType="search"
      />
      {!!value && (
        <Pressable onPress={() => onChangeText('')} hitSlop={10} accessibilityLabel="Aramayı temizle">
          <Ionicons name="close-circle" size={18} color={colors.textDim} />
        </Pressable>
      )}
    </View>
  );
}

/* ---------------- Filtre çipleri ---------------- */

export type ChipOption<T extends string> = { value: T; label: string; count?: number };

export function Chips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.chips}
      style={{ flexGrow: 0 }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[s.chip, active && s.chipActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <Text style={[s.chipText, active && { color: colors.onAmber }]}>{o.label}</Text>
            {o.count !== undefined && (
              <View style={[s.chipCount, active && { backgroundColor: 'rgba(10,10,11,0.15)' }]}>
                <Text style={[s.chipCountText, active && { color: colors.onAmber }]}>{o.count}</Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/* ---------------- Durum etiketi ---------------- */

export function Pill({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const t = TONES[tone];
  return (
    <View style={[s.pill, { backgroundColor: t.bg, borderColor: t.border }]}>
      {icon && <Ionicons name={icon} size={11} color={t.fg} />}
      <Text style={[s.pillText, { color: t.fg }]}>{label}</Text>
    </View>
  );
}

/* ---------------- Avatar ---------------- */

export function Avatar({ name, size = 40, tone = 'neutral' }: { name: string; size?: number; tone?: 'neutral' | 'amber' }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: tone === 'amber' ? colors.amber : colors.surfaceHigh,
        borderWidth: tone === 'amber' ? 0 : 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: tone === 'amber' ? colors.onAmber : colors.text,
          fontSize: size * 0.36,
          fontWeight: font.bold,
        }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}

export function IconTile({ icon, tone = 'neutral', size = 40 }: { icon: IconName; tone?: Tone; size?: number }) {
  const t = TONES[tone];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: t.bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={size * 0.48} color={tone === 'neutral' ? colors.text : t.fg} />
    </View>
  );
}

/* ---------------- Kart ve satır ---------------- */

export function Card({
  children,
  style,
  onPress,
  highlight,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  highlight?: boolean;
}) {
  const [hover, setHover] = useState(false);
  const base = [s.card, highlight && s.cardHighlight, style];
  if (!onPress) return <View style={base}>{children}</View>;
  return (
    <Pressable
      onPress={onPress}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={({ pressed }) => [...base, hover && s.cardHover, pressed && { opacity: 0.8 }]}
    >
      {children}
    </Pressable>
  );
}

export function Row({
  left,
  title,
  subtitle,
  meta,
  right,
  onPress,
  chevron = !!onPress,
}: {
  left?: ReactNode;
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}) {
  return (
    <Card onPress={onPress} style={s.row}>
      {left}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.rowTitle} numberOfLines={1}>
          {title}
        </Text>
        {!!subtitle && (
          <Text style={s.rowSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {meta}
      </View>
      {right}
      {chevron && <Ionicons name="chevron-forward" size={18} color={colors.textDim} />}
    </Card>
  );
}

/* ---------------- Bölüm başlığı ---------------- */

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action && (
        <Pressable hitSlop={8} style={s.sectionAction} onPress={onAction} accessibilityRole="link">
          <Text style={s.sectionActionText}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.amber} />
        </Pressable>
      )}
    </View>
  );
}

/* ---------------- İlerleme çubuğu ---------------- */

export function ProgressBar({
  value,
  tone = 'amber',
  height = 6,
  label,
}: {
  value: number;
  tone?: Tone;
  height?: number;
  label?: string;
}) {
  const v = Math.max(0, Math.min(1, value));
  return (
    <View
      style={{ height, borderRadius: height / 2, backgroundColor: colors.surfaceHigh, overflow: 'hidden' }}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(v * 100) }}
    >
      <View
        style={{
          width: `${v * 100}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: tone === 'neutral' ? colors.textMuted : TONES[tone].fg,
        }}
      />
    </View>
  );
}

/* ---------------- Boş durum ---------------- */

export function EmptyState({ icon, title, text }: { icon: IconName; title: string; text?: string }) {
  return (
    <View style={s.empty}>
      <IconTile icon={icon} tone="amber" size={56} />
      <Text style={s.emptyTitle}>{title}</Text>
      {!!text && <Text style={s.emptyText}>{text}</Text>}
    </View>
  );
}

/* ---------------- Onay kutusu ---------------- */

export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={[s.checkbox, checked && s.checkboxOn]}>
      {checked && <Ionicons name="checkmark" size={14} color={colors.onAmber} />}
    </View>
  );
}

/* ---------------- Bilgi satırı ---------------- */

export function InfoRow({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <View style={s.info}>
      <Ionicons name={icon} size={16} color={colors.textDim} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

/* ---------------- Mini istatistik ---------------- */

export function MiniStat({ value, label, tone }: { value: string; label: string; tone?: Tone }) {
  return (
    <View style={s.mini}>
      <Text style={[s.miniValue, tone && tone !== 'neutral' && { color: TONES[tone].fg }]}>{value}</Text>
      <Text style={s.miniLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  screenContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  inner: { width: '100%', alignSelf: 'center', gap: spacing.lg },

  header: { paddingHorizontal: spacing.xl, paddingBottom: spacing.md, backgroundColor: colors.bg },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    alignSelf: 'center',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: font.bold, letterSpacing: -0.4 },
  headerTitleLarge: { fontSize: 28, fontWeight: font.heavy, letterSpacing: -0.8 },
  headerSubtitle: { color: colors.textDim, fontSize: 13, fontWeight: font.medium, marginTop: 1 },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 46,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    color: colors.text,
    // iOS Safari 16px altındaki alanlarda odaklanınca sayfayı yakınlaştırır
    fontSize: 16,
    outlineStyle: 'none',
  } as object,

  chips: { gap: spacing.sm, paddingRight: spacing.xl },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.amber, borderColor: colors.amber },
  chipText: { color: colors.textMuted, fontSize: 13, fontWeight: font.semibold },
  chipCount: {
    minWidth: 20,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCountText: { color: colors.textMuted, fontSize: 11, fontWeight: font.bold },

  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  pillText: { fontSize: 11, fontWeight: font.bold, letterSpacing: 0.2 },

  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHover: { borderColor: colors.borderStrong, backgroundColor: colors.surface },
  cardHighlight: { borderColor: 'rgba(255,176,32,0.45)', backgroundColor: '#17140D' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: font.semibold },
  rowSubtitle: { color: colors.textDim, fontSize: 12.5 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  sectionTitle: { color: colors.white, fontSize: 17, fontWeight: font.bold, letterSpacing: -0.3 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { color: colors.amber, fontSize: 13, fontWeight: font.semibold },

  empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: 48 },
  emptyTitle: { color: colors.white, fontSize: 17, fontWeight: font.bold, marginTop: spacing.sm },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: 'center', maxWidth: 280, lineHeight: 20 },

  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.amber, borderColor: colors.amber },

  info: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingVertical: 6 },
  infoLabel: { color: colors.textMuted, fontSize: 13.5, width: 96 },
  infoValue: { flex: 1, color: colors.text, fontSize: 13.5, fontWeight: font.semibold, textAlign: 'right' },

  mini: { flex: 1, gap: 2 },
  miniValue: { color: colors.white, fontSize: 22, fontWeight: font.heavy, letterSpacing: -0.5 },
  miniLabel: { color: colors.textDim, fontSize: 12, fontWeight: font.medium },
});
