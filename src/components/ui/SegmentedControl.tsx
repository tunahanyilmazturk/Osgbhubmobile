import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, font, radius } from '@/theme';

export type Segment<T extends string> = {
  value: T;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type Props<T extends string> = {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
};

const PAD = 4;

export function SegmentedControl<T extends string>({ segments, value, onChange }: Props<T>) {
  const [width, setWidth] = useState(0);
  const index = Math.max(0, segments.findIndex((s) => s.value === value));
  const segWidth = width > 0 ? (width - PAD * 2) / segments.length : 0;
  const x = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    Animated.spring(x, {
      toValue: index * segWidth,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4,
    }).start();
  }, [index, segWidth, x]);

  return (
    <View
      style={styles.track}
      accessibilityRole="tablist"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {segWidth > 0 && (
        <Animated.View
          style={[styles.thumb, { width: segWidth, transform: [{ translateX: x }] }]}
        />
      )}
      {segments.map((s) => {
        const active = s.value === value;
        return (
          <Pressable
            key={s.value}
            onPress={() => onChange(s.value)}
            style={styles.segment}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <Ionicons name={s.icon} size={15} color={active ? colors.onAmber : colors.textMuted} />
            <Text
              numberOfLines={1}
              style={[styles.label, { color: active ? colors.onAmber : colors.textMuted }]}
            >
              {s.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: PAD,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    position: 'absolute',
    top: PAD,
    bottom: PAD,
    left: PAD,
    borderRadius: radius.sm,
    backgroundColor: colors.amber,
    shadowColor: colors.amber,
    shadowOpacity: 0.28,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  label: { fontSize: 13, fontWeight: font.semibold },
});
