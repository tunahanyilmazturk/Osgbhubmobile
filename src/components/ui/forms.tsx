import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { IconButton, SearchBar, type IconName } from '@/components/ui/kit';
import { normalize, parseTrDate, toTrDate } from '@/lib/format';
import { useLayout } from '@/lib/responsive';
import { colors, font, radius, spacing } from '@/theme';

export type Option = { value: string; label: string; hint?: string; warn?: string };

/** Aranabilir seçim alanı: dokununca liste açılır */
export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = 'Seçin',
  error,
  optional,
}: {
  label: string;
  value?: string;
  options: Option[];
  onChange: (v: string | undefined) => void;
  placeholder?: string;
  error?: string;
  optional?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const sel = options.find((o) => o.value === value);
  const list = q ? options.filter((o) => normalize(`${o.label} ${o.hint ?? ''}`).includes(normalize(q))) : options;

  return (
    <View style={{ gap: 6 }}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.select, !!error && { borderColor: colors.danger }]}
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${sel?.label ?? placeholder}`}
      >
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.value, !sel && { color: colors.textDim }]} numberOfLines={1}>
            {sel?.label ?? placeholder}
          </Text>
          {sel?.hint && (
            <Text style={styles.hint} numberOfLines={1}>
              {sel.hint}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>
      {sel?.warn && (
        <View style={styles.warnRow}>
          <Ionicons name="warning" size={14} color={colors.amber} />
          <Text style={styles.warn}>{sel.warn}</Text>
        </View>
      )}
      {!!error && <Text style={styles.error}>{error}</Text>}

      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label}>
        <View style={{ gap: spacing.md }}>
          {options.length > 8 && <SearchBar value={q} onChangeText={setQ} placeholder="Ara" />}
          <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: 4 }}>
            {optional && (
              <OptionRow
                label="Seçim yok"
                active={!value}
                onPress={() => {
                  onChange(undefined);
                  setOpen(false);
                }}
              />
            )}
            {list.map((o) => (
              <OptionRow
                key={o.value}
                label={o.label}
                hint={o.hint}
                warn={o.warn}
                active={o.value === value}
                onPress={() => {
                  onChange(o.value);
                  setOpen(false);
                  setQ('');
                }}
              />
            ))}
            {list.length === 0 && <Text style={styles.hint}>Sonuç yok</Text>}
          </ScrollView>
        </View>
      </BottomSheet>
    </View>
  );
}

function OptionRow({ label, hint, warn, active, onPress }: { label: string; hint?: string; warn?: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.option, active && styles.optionOn]} accessibilityRole="radio" accessibilityState={{ checked: active }}>
      <View style={{ flex: 1 }}>
        <Text style={styles.value}>{label}</Text>
        {!!hint && <Text style={styles.hint}>{hint}</Text>}
        {!!warn && <Text style={[styles.hint, { color: colors.amber }]}>{warn}</Text>}
      </View>
      {active && <Ionicons name="checkmark-circle" size={20} color={colors.amber} />}
    </Pressable>
  );
}

/** GG.AA.YYYY biçiminde tarih alanı; geçerli tarihte ISO değer döner */
export function DateField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value?: string;
  onChange: (iso: string | null, raw: string) => void;
  error?: string;
}) {
  const [raw, setRaw] = useState(toTrDate(value));
  return (
    <View style={{ gap: 6 }}>
      <Field
        label={label}
        value={raw}
        placeholder="GG.AA.YYYY"
        keyboardType="numbers-and-punctuation"
        onChangeText={(v) => {
          setRaw(v);
          onChange(parseTrDate(v), v);
        }}
        style={error ? { borderColor: colors.danger } : undefined}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

/** Ekran başlığında "Yeni …" butonu: geniş ekranda etiketli, telefonda simge */
export function HeaderAction({ label, icon = 'add', onPress }: { label: string; icon?: IconName; onPress: () => void }) {
  const { isWide } = useLayout();
  if (!isWide) return <IconButton icon={icon} tone="amber" label={label} onPress={onPress} />;
  return (
    <View>
      <Button compact title={label} icon={icon} onPress={onPress} />
    </View>
  );
}

/** Form altı: kaydet + (düzenlemede) sil */
export function FormActions({
  saveLabel,
  onSave,
  onDelete,
  deleteLabel = 'Sil',
}: {
  saveLabel: string;
  onSave: () => void;
  onDelete?: () => void;
  deleteLabel?: string;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Button title={saveLabel} icon="checkmark" onPress={onSave} />
      {onDelete && <Button title={deleteLabel} variant="outline" icon="trash-outline" onPress={onDelete} />}
    </View>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.formError}>
      <Ionicons name="warning-outline" size={18} color={colors.danger} />
      <Text style={styles.formErrorText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textMuted, fontSize: 13, fontWeight: font.medium },
  select: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 46,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  value: { color: colors.text, fontSize: 15, fontWeight: font.medium },
  hint: { color: colors.textDim, fontSize: 12, marginTop: 1 },
  warnRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  warn: { flex: 1, color: colors.amber, fontSize: 12.5 },
  error: { color: colors.danger, fontSize: 12.5, fontWeight: font.medium },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionOn: { borderColor: colors.amber, backgroundColor: colors.highlight },
  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerSoft,
  },
  formErrorText: { flex: 1, color: colors.danger, fontSize: 13.5, fontWeight: font.medium },
});
