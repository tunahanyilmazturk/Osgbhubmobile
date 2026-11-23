import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { IconTile, type IconName } from '@/components/ui/kit';
import { useAppState } from '@/data/store';
import { colors, font, radius, spacing } from '@/theme';

type Action = { label: string; hint: string; icon: IconName; href: Href; badge?: number };

export function QuickActionsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const s = useAppState();

  const actions = useMemo<Action[]>(() => {
    const pending = s.certificates.filter((c) => c.status === 'pending').length;
    const toSign =
      s.certificates.filter((c) => c.status === 'approved').length +
      s.documents.filter((d) => d.status === 'waiting').length;
    const katip = s.firms.filter((f) => f.katip.status !== 'synced').length;
    return [
      { label: 'Eğitim ata', hint: 'Firma personeline yeni eğitim planla', icon: 'add-circle', href: '/assignment/new' },
      { label: 'Sertifika onayla', hint: 'Tamamlanan eğitimlerin sertifikaları', icon: 'checkmark-done', href: '/approvals', badge: pending },
      { label: 'E-imza', hint: 'Onaylı sertifika ve belgeleri imzala', icon: 'finger-print', href: '/e-signature', badge: toSign },
      { label: 'İSG-KATİP', hint: 'Sözleşme ve atamaları senkronize et', icon: 'sync', href: '/isg-katip', badge: katip },
    ];
  }, [s]);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Hızlı işlemler">
      <View style={styles.grid}>
        {actions.map((a) => (
          <Pressable
            key={a.label}
            style={({ pressed }) => [styles.item, pressed && { opacity: 0.8 }]}
            onPress={() => {
              onClose();
              router.push(a.href);
            }}
            accessibilityRole="button"
            accessibilityLabel={a.badge ? `${a.label}, ${a.badge} bekleyen` : a.label}
          >
            <View style={styles.itemTop}>
              <IconTile icon={a.icon} tone="amber" size={44} />
              {!!a.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{a.badge}</Text>
                </View>
              )}
            </View>
            <Text style={styles.label}>{a.label}</Text>
            <Text style={styles.hint}>{a.hint}</Text>
          </Pressable>
        ))}
      </View>
      <Pressable onPress={onClose} style={styles.close} accessibilityRole="button">
        <Ionicons name="close" size={18} color={colors.textMuted} />
        <Text style={styles.closeText}>Kapat</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  item: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.lg,
    gap: 4,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  badge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
    borderRadius: 12,
    backgroundColor: colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 12, fontWeight: font.heavy },
  label: { color: colors.white, fontSize: 15, fontWeight: font.bold },
  hint: { color: colors.textDim, fontSize: 12, lineHeight: 16 },
  close: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.lg,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  closeText: { color: colors.textMuted, fontSize: 15, fontWeight: font.semibold },
});
