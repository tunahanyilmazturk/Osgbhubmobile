import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar, type IconName } from '@/components/ui/kit';
import { useAppState } from '@/data/store';
import { SIDEBAR_WIDTH } from '@/lib/responsive';
import { ROLE_LABELS, displayName, useSession } from '@/lib/session';
import { colors, font, radius, spacing } from '@/theme';

type Item = {
  label: string;
  icon: IconName;
  iconActive: IconName;
  href: Href;
  /** Bu önekle başlayan adresler de bu öğeyi aktif yapar */
  match: string[];
  badge?: number;
  badgeTone?: 'amber' | 'danger';
};

/** Bilgisayar görünümünde sol kenar menü */
export function Sidebar() {
  const s = useAppState();
  const { user, signOut } = useSession();
  const pathname = usePathname();

  const sections = useMemo<{ title?: string; items: Item[] }[]>(() => {
    const pending = s.certificates.filter((c) => c.status === 'pending').length;
    const toSign =
      s.certificates.filter((c) => c.status === 'approved').length +
      s.documents.filter((d) => d.status === 'waiting').length;
    const katip = s.firms.filter((f) => f.katip.status !== 'synced').length;
    return [
      {
        items: [
          { label: 'Panel', icon: 'grid-outline', iconActive: 'grid', href: '/dashboard', match: ['/dashboard'] },
          { label: 'Firmalar', icon: 'business-outline', iconActive: 'business', href: '/firms', match: ['/firms', '/firm/'] },
          { label: 'Eğitimler', icon: 'school-outline', iconActive: 'school', href: '/trainings', match: ['/trainings', '/training/', '/assignment/'] },
        ],
      },
      {
        title: 'Kişiler',
        items: [
          { label: 'Katılımcılar', icon: 'people-outline', iconActive: 'people', href: '/participants', match: ['/participants', '/participant/'] },
          { label: 'Ekip', icon: 'people-circle-outline', iconActive: 'people-circle', href: '/team', match: ['/team'] },
        ],
      },
      {
        title: 'Sertifika süreçleri',
        items: [
          { label: 'Sertifikalar', icon: 'ribbon-outline', iconActive: 'ribbon', href: '/certificates', match: ['/certificates', '/certificate/'] },
          { label: 'Onaylar', icon: 'checkmark-done-outline', iconActive: 'checkmark-done', href: '/approvals', match: ['/approvals'], badge: pending, badgeTone: 'amber' },
          { label: 'E-imza', icon: 'finger-print-outline', iconActive: 'finger-print', href: '/e-signature', match: ['/e-signature'], badge: toSign, badgeTone: 'amber' },
        ],
      },
      {
        title: 'Entegrasyon',
        items: [
          { label: 'İSG-KATİP', icon: 'sync-outline', iconActive: 'sync', href: '/isg-katip', match: ['/isg-katip'], badge: katip, badgeTone: 'danger' },
        ],
      },
    ];
  }, [s]);

  const isActive = (it: Item) => it.match.some((m) => pathname === m || pathname.startsWith(m.endsWith('/') ? m : `${m}/`));

  return (
    <View style={styles.root}>
      {/* Marka */}
      <View style={styles.brand}>
        <LinearGradient
          colors={[colors.amberLight, colors.amber, colors.amberDeep]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logo}
        >
          <Ionicons name="shield-checkmark" size={20} color={colors.onAmber} />
        </LinearGradient>
        <View>
          <Text style={styles.brandName}>
            OSGB<Text style={{ color: colors.amber }}>Hub</Text>
          </Text>
          <Text style={styles.brandCaption}>İSG YÖNETİM PLATFORMU</Text>
        </View>
      </View>

      <Pressable
        onPress={() => router.push('/assignment/new')}
        style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
        accessibilityRole="button"
      >
        <Ionicons name="add-circle" size={18} color={colors.onAmber} />
        <Text style={styles.ctaText}>Eğitim ata</Text>
      </Pressable>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.lg }} showsVerticalScrollIndicator={false}>
        {sections.map((sec, i) => (
          <View key={sec.title ?? i} style={{ gap: 2 }}>
            {sec.title && <Text style={styles.sectionTitle}>{sec.title}</Text>}
            {sec.items.map((it) => (
              <NavItem key={it.label} item={it} active={isActive(it)} />
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Kullanıcı */}
      <View style={styles.user}>
        <Pressable onPress={() => router.push('/profile')} style={styles.userMain} accessibilityRole="button" accessibilityLabel="Profil">
          <Avatar name={user ? displayName(user.name) : '?'} size={36} tone="amber" />
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {user ? displayName(user.name) : ''}
            </Text>
            <Text style={styles.userRole} numberOfLines={1}>
              {user ? ROLE_LABELS[user.role] : ''}
            </Text>
          </View>
        </Pressable>
        <Pressable onPress={signOut} hitSlop={8} style={styles.logout} accessibilityRole="button" accessibilityLabel="Çıkış yap">
          <Ionicons name="log-out-outline" size={18} color={colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

function NavItem({ item, active }: { item: Item; active: boolean }) {
  const [hover, setHover] = useState(false);
  return (
    <Pressable
      onPress={() => router.navigate(item.href)}
      onHoverIn={() => setHover(true)}
      onHoverOut={() => setHover(false)}
      style={[styles.item, hover && !active && styles.itemHover, active && styles.itemActive]}
      accessibilityRole="link"
      accessibilityState={{ selected: active }}
    >
      {active && <View style={styles.activeBar} />}
      <Ionicons name={active ? item.iconActive : item.icon} size={19} color={active ? colors.amber : colors.textMuted} />
      <Text style={[styles.itemText, active && { color: colors.white, fontWeight: font.semibold }]}>{item.label}</Text>
      {!!item.badge && (
        <View style={[styles.badge, { backgroundColor: item.badgeTone === 'danger' ? colors.danger : colors.amber }]}>
          <Text style={[styles.badgeText, item.badgeTone !== 'danger' && { color: colors.onAmber }]}>{item.badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: SIDEBAR_WIDTH,
    height: '100%',
    backgroundColor: colors.bgElevated,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.lg,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.sm },
  logo: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  brandName: { color: colors.white, fontSize: 18, fontWeight: font.heavy, letterSpacing: -0.4 },
  brandCaption: { color: colors.textDim, fontSize: 9, fontWeight: font.semibold, letterSpacing: 1.3 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.amber,
  },
  ctaText: { color: colors.onAmber, fontSize: 14, fontWeight: font.bold },
  sectionTitle: {
    color: colors.textDim,
    fontSize: 11,
    fontWeight: font.bold,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.md,
    marginBottom: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    height: 40,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
  },
  itemHover: { backgroundColor: colors.surface },
  itemActive: { backgroundColor: colors.amberSoft },
  activeBar: {
    position: 'absolute',
    left: -spacing.md,
    top: 8,
    bottom: 8,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.amber,
  },
  itemText: { flex: 1, color: colors.textMuted, fontSize: 14, fontWeight: font.medium },
  badge: {
    minWidth: 22,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: font.heavy },
  user: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  userMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  userName: { color: colors.white, fontSize: 14, fontWeight: font.semibold },
  userRole: { color: colors.textDim, fontSize: 12 },
  logout: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
