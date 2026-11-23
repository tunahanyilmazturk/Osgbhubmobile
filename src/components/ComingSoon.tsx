import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, font, radius, spacing } from '@/theme';

type Props = {
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  children?: ReactNode;
};

/** Henüz geliştirilmemiş sekmeler için yer tutucu ekran */
export function ComingSoon({ title, description, icon, children }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.lg }]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.center}>
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={34} color={colors.amber} />
        </View>
        <Text style={styles.heading}>Yakında</Text>
        <Text style={styles.desc}>{description}</Text>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, paddingHorizontal: spacing.xl },
  title: { color: colors.white, fontSize: 28, fontWeight: font.heavy, letterSpacing: -0.8 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingBottom: 120,
  },
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: radius.xl,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,176,32,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  heading: { color: colors.white, fontSize: 20, fontWeight: font.bold },
  desc: {
    color: colors.textMuted,
    fontSize: 14.5,
    lineHeight: 21,
    textAlign: 'center',
    maxWidth: 300,
  },
});
