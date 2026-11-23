import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Avatar,
  IconTile,
  Screen,
  ScreenHeader,
  SectionHeader,
  type IconName,
  type Tone,
} from '@/components/ui/kit';
import { useAppState } from '@/data/store';
import { ROLE_LABELS, displayName, useSession } from '@/lib/session';
import { useTheme } from '@/lib/theme';
import { colors, font, radius, spacing } from '@/theme';

type Item = { label: string; hint: string; icon: IconName; href: Href; badge?: number; badgeTone?: Tone };

export default function More() {
  const s = useAppState();
  const { user } = useSession();
  const { mode, toggle, switchable } = useTheme();

  const groups = useMemo<{ title: string; items: Item[] }[]>(() => {
    const pending = s.certificates.filter((c) => c.status === 'pending').length;
    const toSign =
      s.certificates.filter((c) => c.status === 'approved').length +
      s.documents.filter((d) => d.status === 'waiting').length;
    const katipErr = s.firms.filter((f) => f.katip.status !== 'synced').length;
    return [
      {
        title: 'Kişiler',
        items: [
          {
            label: 'Ekip',
            hint: `${s.team.length} profesyonel · uzman, hekim, DSP`,
            icon: 'people-circle',
            href: '/team',
          },
          {
            label: 'Katılımcılar',
            hint: `${s.participants.length} firma personeli`,
            icon: 'people',
            href: '/participants',
          },
        ],
      },
      {
        title: 'Sertifika süreçleri',
        items: [
          {
            label: 'Sertifikalar',
            hint: 'Tüm sertifikalar ve geçerlilik',
            icon: 'ribbon',
            href: '/certificates',
          },
          {
            label: 'Sertifika onayları',
            hint: 'Tamamlanan eğitimlerin onayı',
            icon: 'checkmark-done',
            href: '/approvals',
            badge: pending,
            badgeTone: 'amber',
          },
          {
            label: 'E-imza',
            hint: 'Sertifika ve belgeleri imzala',
            icon: 'finger-print',
            href: '/e-signature',
            badge: toSign,
            badgeTone: 'amber',
          },
        ],
      },
      {
        title: 'Entegrasyonlar',
        items: [
          {
            label: 'İSG-KATİP',
            hint: 'Sözleşme ve atama senkronizasyonu',
            icon: 'sync',
            href: '/isg-katip',
            badge: katipErr,
            badgeTone: 'danger',
          },
        ],
      },
    ];
  }, [s]);

  return (
    <Screen tabBar header={<ScreenHeader title="Menü" back={false} large />}>
      <Pressable onPress={() => router.push('/profile')} style={styles.profile} accessibilityRole="button">
        <Avatar name={user ? displayName(user.name) : '?'} size={52} tone="amber" />
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>{user ? displayName(user.name) : ''}</Text>
          <Text style={styles.dim}>
            {user ? ROLE_LABELS[user.role] : ''} · {user?.email}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
      </Pressable>

      {switchable && (
        <Pressable
          onPress={toggle}
          style={styles.profile}
          accessibilityRole="switch"
          accessibilityState={{ checked: mode === 'light' }}
        >
          <IconTile icon={mode === 'dark' ? 'moon' : 'sunny'} tone="amber" size={40} />
          <View style={{ flex: 1 }}>
            <Text style={styles.itemLabel}>Görünüm</Text>
            <Text style={styles.dim}>
              {mode === 'dark' ? 'Karanlık tema' : 'Aydınlık tema'} · değiştirmek için dokunun
            </Text>
          </View>
          <Ionicons name="swap-horizontal" size={18} color={colors.textDim} />
        </Pressable>
      )}

      {groups.map((g) => (
        <View key={g.title} style={{ gap: spacing.md }}>
          <SectionHeader title={g.title} />
          <View style={styles.group}>
            {g.items.map((it, i) => (
              <Pressable
                key={it.label}
                onPress={() => router.push(it.href)}
                style={({ pressed }) => [
                  styles.item,
                  i > 0 && styles.border,
                  pressed && { backgroundColor: colors.surface },
                ]}
                accessibilityRole="button"
                accessibilityLabel={it.badge ? `${it.label}, ${it.badge} bekleyen` : it.label}
              >
                <IconTile icon={it.icon} tone="amber" size={40} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemLabel}>{it.label}</Text>
                  <Text style={styles.dim}>{it.hint}</Text>
                </View>
                {!!it.badge && (
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: it.badgeTone === 'danger' ? colors.danger : colors.amber },
                    ]}
                  >
                    <Text style={[styles.badgeText, it.badgeTone !== 'danger' && { color: colors.onAmber }]}>
                      {it.badge}
                    </Text>
                  </View>
                )}
                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileName: { color: colors.white, fontSize: 17, fontWeight: font.bold },
  dim: { color: colors.textDim, fontSize: 12.5, marginTop: 1 },
  group: {
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  itemLabel: { color: colors.text, fontSize: 15, fontWeight: font.semibold },
  badge: {
    minWidth: 24,
    height: 24,
    paddingHorizontal: 7,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.onDanger, fontSize: 12, fontWeight: font.heavy },
});
