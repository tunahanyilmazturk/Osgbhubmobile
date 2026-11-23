import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AlertRow,
  ComplianceCard,
  QuickActionButton,
  SectionHeader,
  StatCard,
  VisitRow,
} from '@/components/dashboard';
import { alerts, compliance, quickActions, stats, todayVisits } from '@/data/dashboard';
import { ROLE_LABELS, displayName, useSession } from '@/lib/session';
import { colors, font, radius, spacing } from '@/theme';

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

function greeting(h: number) {
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const [refreshing, setRefreshing] = useState(false);

  const now = new Date();
  const name = user ? displayName(user.name) : '';
  const role = user ? ROLE_LABELS[user.role] : '';
  const dateText = `${now.getDate()} ${MONTHS[now.getMonth()]}, ${DAYS[now.getDay()]}`;
  const criticalCount = alerts.filter((a) => a.level === 'critical').length;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + 120 },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.amber}
          colors={[colors.amber]}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      <View style={styles.inner}>
        {/* Üst bilgi */}
        <View style={styles.header}>
          <Pressable
            style={styles.avatar}
            onPress={() => router.navigate('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Profil"
          >
            <Text style={styles.avatarText}>{name.charAt(0)}</Text>
            <View style={styles.onlineDot} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet}>{greeting(now.getHours())},</Text>
            <Text style={styles.name} numberOfLines={1}>
              {name} <Text style={styles.role}>· {role}</Text>
            </Text>
          </View>
          <Pressable style={styles.iconBtn} accessibilityRole="button" accessibilityLabel="Ara">
            <Ionicons name="search" size={20} color={colors.text} />
          </Pressable>
          <Pressable
            style={styles.iconBtn}
            accessibilityRole="button"
            accessibilityLabel={`Bildirimler, ${criticalCount} yeni`}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{criticalCount}</Text>
            </View>
          </Pressable>
        </View>

        <View style={styles.dateRow}>
          <Ionicons name="calendar-clear-outline" size={14} color={colors.textDim} />
          <Text style={styles.date}>{dateText}</Text>
        </View>

        <ComplianceCard {...compliance} />

        {/* İstatistikler */}
        <View style={styles.grid}>
          {stats.map((s) => (
            <StatCard key={s.id} stat={s} />
          ))}
        </View>

        {/* Hızlı işlemler */}
        <View>
          <SectionHeader title="Hızlı işlemler" />
          <View style={styles.quickRow}>
            {quickActions.map((a) => (
              <QuickActionButton key={a.id} action={a} />
            ))}
          </View>
        </View>

        {/* Bugünkü program */}
        <View>
          <SectionHeader title="Bugünkü program" action="Takvim" />
          <View style={styles.progress}>
            <Text style={styles.progressText}>
              <Text style={{ color: colors.amber, fontWeight: font.bold }}>
                {todayVisits.filter((v) => v.status === 'done').length}
              </Text>
              /{todayVisits.length} ziyaret tamamlandı
            </Text>
          </View>
          {todayVisits.map((v, i) => (
            <VisitRow key={v.id} visit={v} last={i === todayVisits.length - 1} />
          ))}
        </View>

        {/* Uyarılar */}
        <View>
          <SectionHeader title="Dikkat gerektirenler" action="Tümü" />
          <View style={{ gap: spacing.sm + 2 }}>
            {alerts.map((a) => (
              <AlertRow key={a.id} alert={a} />
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl },
  inner: { width: '100%', maxWidth: 560, alignSelf: 'center', gap: spacing.xxl },

  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.onAmber, fontSize: 19, fontWeight: font.heavy },
  onlineDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  greet: { color: colors.textMuted, fontSize: 13, fontWeight: font.medium },
  name: { color: colors.white, fontSize: 19, fontWeight: font.bold, letterSpacing: -0.3 },
  role: { color: colors.textDim, fontSize: 13, fontWeight: font.medium },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.danger,
    borderWidth: 2,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 9.5, fontWeight: font.heavy },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -spacing.md },
  date: { color: colors.textDim, fontSize: 13, fontWeight: font.medium },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  quickRow: { flexDirection: 'row', gap: spacing.sm },

  progress: {
    alignSelf: 'flex-start',
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
  },
  progressText: { color: colors.textMuted, fontSize: 12, fontWeight: font.medium },
});
