import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
  type PressableProps,
} from 'react-native';

import { colors, font, radius, spacing } from '@/theme';

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  variant?: 'primary' | 'outline';
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Daha alçak ve küçük yazılı buton (yan yana butonlar için) */
  compact?: boolean;
};

export function Button({ title, variant = 'primary', loading, icon, disabled, compact, ...rest }: Props) {
  const scale = useState(() => new Animated.Value(1))[0];
  const animate = (to: number) =>
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 6 }).start();

  const isPrimary = variant === 'primary';
  const fg = isPrimary ? colors.onAmber : colors.text;

  const content = (
    <View style={styles.content}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Ionicons name={icon} size={compact ? 18 : 20} color={isPrimary ? fg : colors.amber} />}
          <Text style={[styles.title, compact && styles.titleCompact, { color: fg }]} numberOfLines={1}>
            {title}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
        disabled={disabled || loading}
        onPressIn={() => animate(0.97)}
        onPressOut={() => animate(1)}
        style={[
          styles.base,
          compact && { height: 48 },
          !isPrimary && styles.outline,
          isPrimary && styles.primaryShadow,
          (disabled || loading) && { opacity: 0.85 },
        ]}
        {...rest}
      >
        {isPrimary ? (
          <LinearGradient
            colors={[colors.amberLight, colors.amber, colors.amberDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradient}
          >
            {content}
          </LinearGradient>
        ) : (
          content
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 56,
    borderRadius: radius.md,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  gradient: { flex: 1, justifyContent: 'center' },
  primaryShadow: {
    shadowColor: colors.amber,
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  title: { flexShrink: 1, fontSize: 16, fontWeight: font.bold, letterSpacing: 0.3 },
  titleCompact: { fontSize: 14.5, letterSpacing: 0 },
});
