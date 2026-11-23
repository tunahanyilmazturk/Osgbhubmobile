import { Ionicons } from '@expo/vector-icons';
import { useState, type Ref } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { colors, font, radius, spacing } from '@/theme';

type Props = TextInputProps & {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  error?: string;
  secureToggle?: boolean;
  ref?: Ref<TextInputInstance>;
};

export function TextField({
  label,
  icon,
  error,
  secureToggle,
  secureTextEntry,
  onFocus,
  onBlur,
  ref,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(!!secureTextEntry);

  const borderColor = error ? colors.danger : focused ? colors.amber : colors.border;
  const iconColor = error ? colors.danger : focused ? colors.amber : colors.textDim;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          { borderColor },
          focused && !error && styles.fieldFocused,
        ]}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
        <TextInput
          ref={ref}
          {...rest}
          secureTextEntry={secureToggle ? hidden : secureTextEntry}
          placeholderTextColor={colors.textDim}
          selectionColor={colors.amber}
          cursorColor={colors.amber}
          style={styles.input}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
        />
        {secureToggle && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Şifreyi göster' : 'Şifreyi gizle'}
          >
            <Ionicons
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        )}
      </View>
      {!!error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={colors.danger} />
          <Text style={styles.error}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.sm },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: font.medium,
    letterSpacing: 0.2,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    backgroundColor: colors.surface,
  },
  fieldFocused: {
    backgroundColor: colors.surfaceHigh,
    shadowColor: colors.amber,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  input: {
    flex: 1,
    minWidth: 0,
    height: '100%',
    color: colors.text,
    fontSize: 16,
    fontWeight: font.medium,
    // web'de varsayılan odak çerçevesini kaldır
    outlineStyle: 'none',
  } as object,
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  error: { color: colors.danger, fontSize: 12.5, fontWeight: font.medium },
});
