import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { colors, font, radius, spacing } from '@/theme';

/** Editör formları için sade metin alanı (tek veya çok satırlı) */
export function Field({
  label,
  hint,
  multiline,
  style,
  ...rest
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        accessibilityLabel={rest.accessibilityLabel ?? label}
        multiline={multiline}
        placeholderTextColor={colors.textDim}
        selectionColor={colors.amber}
        style={[styles.input, multiline && styles.multiline, style]}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
      {!!hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textMuted, fontSize: 13, fontWeight: font.medium },
  hint: { color: colors.textDim, fontSize: 12 },
  input: {
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    // iOS Safari 16px altında odakta yakınlaştırır
    fontSize: 16,
    outlineStyle: 'none',
  } as object,
  multiline: { minHeight: 110, lineHeight: 22 },
});
