import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useLayout } from '@/lib/responsive';
import { colors, font, radius, spacing } from '@/theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
};

/** Alttan açılan, karartılmış arka planlı sayfa */
export function BottomSheet({ visible, onClose, title, subtitle, children }: Props) {
  const insets = useSafeAreaInsets();
  // Bilgisayarda alttan açılan panel yerine ortada pencere
  const { isDesktop } = useLayout();
  const y = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (visible) {
      y.setValue(0);
      Animated.timing(y, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, y]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: y }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Kapat" />
      </Animated.View>
      <View style={[styles.anchor, isDesktop && styles.anchorCenter]} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + spacing.xl },
            isDesktop && styles.dialog,
            {
              transform: [
                { translateY: y.interpolate({ inputRange: [0, 1], outputRange: [isDesktop ? 24 : 500, 0] }) },
              ],
            },
          ]}
        >
          {!isDesktop && <View style={styles.handle} />}
          {title && (
            <View style={{ gap: 4, marginBottom: spacing.lg }}>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          )}
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: colors.backdrop },
  anchor: { flex: 1, justifyContent: 'flex-end' },
  anchorCenter: { justifyContent: 'center', padding: spacing.xxl },
  dialog: {
    maxWidth: 520,
    borderRadius: radius.xl + 4,
    borderBottomWidth: 1,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  sheet: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    backgroundColor: colors.bgElevated,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: spacing.lg,
  },
  title: { color: colors.white, fontSize: 20, fontWeight: font.bold, letterSpacing: -0.3 },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
});
