import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BarChart, StatusDistribution } from '@/components/charts';
import { AssignmentRow, CertificateRow, HazardPill } from '@/components/domain';
import {
  Avatar,
  Card,
  Column,
  Columns,
  ProgressBar,
  SectionHeader,
  TONES,
  useBottomPadding,
  type IconName,
  type Tone,
} from '@/components/ui/kit';
import {
  certHealth,
  firmCompliance,
  latestCertificates,
  memberLoad,
  ROLE_LABEL,
  useAppState,
} from '@/data/store';
import { DAYS_LONG, MONTHS_LONG, daysUntil, monthLabel, parseDate } from '@/lib/format';
import { useLayout } from '@/lib/responsive';
import { useTheme } from '@/lib/theme';
import { ROLE_LABELS, displayName, useSession } from '@/lib/session';
import { colors, font, radius, spacing } from '@/theme';

function greeting(h: number) {
  if (h < 6) return 'İyi geceler';
  if (h < 12) return 'Günaydın';
  if (h < 18) return 'İyi günler';
  return 'İyi akşamlar';
}

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const s = useAppState();
  const [refreshing, setRefreshing] = useState(false);
  const { isDesktop, isWide, contentMaxWidth } = useLayout();
  const { mode, toggle, switchable } = useTheme();
  const bottom = useBottomPadding(true);

  const now = new Date();
  const name = user ? displayName(user.name) : '';

  const m = useMemo(() => {
    const latest = latestCertificates(s.certificates);
    const health = latest.map(certHealth);
    const count = (h: string) => health.filter((x) => x === h).length;

    const compliances = s.firms.map((f) => ({ firm: f, value: firmCompliance(s, f.id) }));
    const trainingCoverage = compliances.length
      ? Math.round(compliances.reduce((a, c) => a + c.value, 0) / compliances.length)
      : 0;
    const validRatio = Math.round(
      ((count('valid') + count('expiring')) /
        Math.max(1, count('valid') + count('expiring') + count('expired'))) *
        100,
    );
    const katipOk = s.firms.length
      ? Math.round((s.firms.filter((f) => f.katip.status === 'synced').length / s.firms.length) * 100)
      : 0;
    const overall = Math.round(trainingCoverage * 0.5 + validRatio * 0.3 + katipOk * 0.2);

    // Son 6 ayda düzenlenen sertifikalar
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
    const monthly = months.map(({ y, m: mo }) => ({
      label: monthLabel(mo),
      detail: `${MONTHS_LONG[mo]} ${y} · düzenlenen sertifika`,
      value: s.certificates.filter((c) => {
        if (c.status === 'rejected') return false;
        const d = parseDate(c.issueDate);
        return d.getFullYear() === y && d.getMonth() === mo;
      }).length,
    }));

    const expiring = latest
      .filter((c) => certHealth(c) === 'expiring')
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

    const upcoming = s.assignments
      .filter((a) => a.status !== 'completed')
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    const thisMonthTrainings = s.assignments.filter((a) => {
      const d = parseDate(a.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    const load = s.team.map((t) => ({ member: t, ...memberLoad(s, t) })).sort((a, b) => b.ratio - a.ratio);

    return {
      overall,
      breakdown: [
        { label: 'Temel İSG eğitimi kapsamı', value: trainingCoverage },
        { label: 'Sertifika geçerliliği', value: validRatio },
        { label: 'İSG-KATİP uyumu', value: katipOk },
      ],
      counts: {
        valid: count('valid'),
        expiring: count('expiring'),
        expired: count('expired'),
        waiting: count('pending') + count('approved'),
      },
      pendingApproval: s.certificates.filter((c) => c.status === 'pending').length,
      toSign:
        s.certificates.filter((c) => c.status === 'approved').length +
        s.documents.filter((d) => d.status === 'waiting').length,
      katipIssues: s.firms.filter((f) => f.katip.status !== 'synced').length,
      katipErrors: s.firms.filter((f) => f.katip.status === 'error').length,
      monthly,
      expiring,
      upcoming,
      risky: [...compliances].sort((a, b) => a.value - b.value).slice(0, 3),
      employees: s.firms.reduce((a, f) => a + f.employees, 0),
      thisMonthTrainings,
      load,
      overloaded: load.filter((l) => l.ratio > 1).length,
      contractsEnding: s.firms.filter((f) => daysUntil(f.contractEnd) <= 30).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const tasks: { label: string; count: number; icon: IconName; tone: Tone; href: Href }[] = [
    {
      label: 'Onay bekleyen\nsertifika',
      count: m.pendingApproval,
      icon: 'hourglass',
      tone: 'amber',
      href: '/approvals',
    },
    {
      label: 'İmza bekleyen\nbelge',
      count: m.toSign,
      icon: 'finger-print',
      tone: 'amber',
      href: '/e-signature',
    },
    {
      label: 'İSG-KATİP\nsorunu',
      count: m.katipIssues,
      icon: 'cloud-offline',
      tone: m.katipErrors ? 'danger' : 'amber',
      href: '/isg-katip',
    },
  ];

  const kpis: { label: string; value: string; hint: string; icon: IconName; tone: Tone; href: Href }[] = [
    {
      label: 'Aktif firma',
      value: String(s.firms.length),
      hint: `${m.employees.toLocaleString('tr-TR')} çalışan`,
      icon: 'business',
      tone: 'amber',
      href: '/firms',
    },
    {
      label: 'Katılımcı',
      value: String(s.participants.length),
      hint: 'kayıtlı personel',
      icon: 'people',
      tone: 'neutral',
      href: '/participants',
    },
    {
      label: 'Geçerli sertifika',
      value: String(m.counts.valid + m.counts.expiring),
      hint: `${m.counts.expiring} tanesi 30 gün içinde bitiyor`,
      icon: 'ribbon',
      tone: 'success',
      href: '/certificates',
    },
    {
      label: 'Bu ay eğitim',
      value: String(m.thisMonthTrainings),
      hint: `${m.upcoming.length} yaklaşan oturum`,
      icon: 'school',
      tone: 'neutral',
      href: '/trainings',
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={[
        styles.content,
        isDesktop && { paddingHorizontal: spacing.xxxl },
        { paddingTop: insets.top + (isWide ? spacing.xl : spacing.lg), paddingBottom: bottom },
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
      <View style={[styles.inner, { maxWidth: contentMaxWidth }]}>
        {/* Üst bilgi */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.push('/profile')}
            accessibilityRole="button"
            accessibilityLabel="Profil"
          >
            <Avatar name={user?.name ? displayName(user.name) : '?'} size={46} tone="amber" />
            <View style={styles.onlineDot} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.greet}>{greeting(now.getHours())},</Text>
            <Text style={styles.name} numberOfLines={1}>
              {name} <Text style={styles.role}>· {user ? ROLE_LABELS[user.role] : ''}</Text>
            </Text>
          </View>
          {isWide && (
            <View style={styles.datePill}>
              <Ionicons name="calendar-clear-outline" size={14} color={colors.amber} />
              <Text style={styles.datePillText}>
                {now.getDate()} {MONTHS_LONG[now.getMonth()]}, {DAYS_LONG[now.getDay()]}
              </Text>
            </View>
          )}
          {/* Geniş ekranda arama, bildirim ve tema üst barda */}
          {!isWide && switchable && (
            <Pressable
              style={styles.iconBtn}
              onPress={toggle}
              accessibilityRole="switch"
              accessibilityState={{ checked: mode === 'light' }}
              accessibilityLabel={mode === 'dark' ? 'Aydınlık temaya geç' : 'Karanlık temaya geç'}
            >
              <Ionicons
                name={mode === 'dark' ? 'sunny-outline' : 'moon-outline'}
                size={20}
                color={colors.text}
              />
            </Pressable>
          )}
          {!isWide && (
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push('/participants')}
              accessibilityRole="button"
              accessibilityLabel="Katılımcı ara"
            >
              <Ionicons name="search" size={20} color={colors.text} />
            </Pressable>
          )}
          {!isWide && (
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push('/approvals')}
              accessibilityRole="button"
              accessibilityLabel={`Bildirimler, ${m.pendingApproval + m.katipIssues} yeni`}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.text} />
              {m.pendingApproval + m.katipIssues > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{m.pendingApproval + m.katipIssues}</Text>
                </View>
              )}
            </Pressable>
          )}
        </View>
        {!isWide && (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-clear-outline" size={14} color={colors.textDim} />
            <Text style={styles.date}>
              {now.getDate()} {MONTHS_LONG[now.getMonth()]}, {DAYS_LONG[now.getDay()]}
            </Text>
          </View>
        )}

        {/* 1. satır: uyum skoru + bekleyen işler (bilgisayarda eşit yükseklik) */}
        <Columns gap={spacing.xl} style={isDesktop && { alignItems: 'stretch' }}>
          <Column flex={1} gap={spacing.xl}>
            {/* Uyum skoru */}
            <LinearGradient
              colors={[colors.amberLight, colors.amber, colors.amberDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, isDesktop && { flex: 1, justifyContent: 'space-between' }]}
            >
              <View pointerEvents="none" style={styles.heroStripes}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <View key={i} style={styles.heroStripe} />
                ))}
              </View>
              <View style={styles.heroTop}>
                <View style={{ gap: 4 }}>
                  <View style={styles.heroBadge}>
                    <View style={styles.heroBadgeDot} />
                    <Text style={styles.heroBadgeText}>
                      {m.overall >= 85 ? 'İyi düzey' : m.overall >= 65 ? 'Geliştirilmeli' : 'Dikkat gerekli'}
                    </Text>
                  </View>
                  <Text style={styles.heroLabel}>Genel uyum skoru</Text>
                  <Text style={styles.heroValue}>%{m.overall}</Text>
                </View>
                <View style={styles.heroIcon}>
                  <Ionicons name="shield-checkmark" size={26} color={colors.amber} />
                </View>
              </View>
              <View style={{ gap: spacing.md }}>
                {m.breakdown.map((b) => (
                  <View key={b.label} style={{ gap: 6 }}>
                    <View style={styles.barRow}>
                      <Text style={styles.barLabel}>{b.label}</Text>
                      <Text style={styles.barValue}>%{b.value}</Text>
                    </View>
                    <View
                      style={styles.barTrack}
                      accessibilityRole="progressbar"
                      accessibilityLabel={b.label}
                      accessibilityValue={{ min: 0, max: 100, now: b.value }}
                    >
                      <View style={[styles.barFill, { width: `${b.value}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
            </LinearGradient>
          </Column>
          <Column flex={1.25} gap={spacing.xl}>
            {/* Bekleyen işler */}
            <View style={[{ gap: spacing.md }, isDesktop && { flex: 1 }]}>
              <SectionHeader title="Bekleyen işler" />
              <View style={[styles.taskRow, isDesktop && { flex: 1 }]}>
                {tasks.map((t) => {
                  const done = t.count === 0;
                  const tone = done ? TONES.success : TONES[t.tone];
                  return (
                    <Pressable
                      key={t.label}
                      onPress={() => router.push(t.href)}
                      style={({ pressed, hovered }) => [
                        styles.task,
                        isDesktop && { justifyContent: 'space-between', padding: spacing.lg },
                        !done && { borderTopWidth: 2, borderTopColor: tone.fg },
                        hovered && styles.cardInteractiveHover,
                        pressed && { opacity: 0.82 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${t.label.replace('\n', ' ')}: ${t.count}`}
                    >
                      <View style={styles.taskHead}>
                        <View style={[styles.taskIcon, { backgroundColor: tone.bg }]}>
                          <Ionicons name={done ? 'checkmark' : t.icon} size={17} color={tone.fg} />
                        </View>
                        <Ionicons name="arrow-forward" size={14} color={colors.textDim} />
                      </View>
                      <View style={{ gap: 4 }}>
                        <Text
                          style={[styles.taskCount, !done && t.tone === 'danger' && { color: colors.danger }]}
                        >
                          {t.count}
                        </Text>
                        <Text style={styles.taskLabel}>{t.label}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </Column>
        </Columns>

        {/* KPI'lar */}
        <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
          {kpis.map((k) => (
            <Pressable
              key={k.label}
              onPress={() => router.push(k.href)}
              style={({ pressed, hovered }) => [
                styles.kpi,
                isDesktop && styles.kpiDesktop,
                hovered && styles.cardInteractiveHover,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.kpiTop}>
                <View style={[styles.kpiIcon, { backgroundColor: TONES[k.tone].bg }]}>
                  <Ionicons
                    name={k.icon}
                    size={18}
                    color={k.tone === 'neutral' ? colors.text : TONES[k.tone].fg}
                  />
                </View>
                <Ionicons name="chevron-forward" size={15} color={colors.textDim} />
              </View>
              <Text style={styles.kpiValue}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
              <Text style={styles.kpiHint} numberOfLines={2}>
                {k.hint}
              </Text>
            </Pressable>
          ))}
        </View>

        <Columns gap={spacing.xl}>
          <Column flex={1.3} gap={spacing.xl}>
            {/* Aylık sertifika grafiği */}
            <Card style={{ gap: spacing.md }}>
              <View>
                <Text style={styles.cardTitle}>Aylık düzenlenen sertifika</Text>
                <Text style={styles.cardSub}>Son 6 ay · ayrıntı için bir çubuğa dokunun</Text>
              </View>
              <BarChart data={m.monthly} unit="sertifika" />
            </Card>
          </Column>
          <Column flex={1} gap={spacing.xl}>
            {/* Sertifika durumu */}
            <Card style={{ gap: spacing.md }}>
              <View style={styles.cardHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Sertifika durumu</Text>
                  <Text style={styles.cardSub}>Her personelin her eğitimdeki son sertifikası</Text>
                </View>
                <Pressable onPress={() => router.push('/certificates')} hitSlop={8}>
                  <Text style={styles.link}>Tümü</Text>
                </Pressable>
              </View>
              <StatusDistribution
                segments={[
                  {
                    key: 'valid',
                    label: 'Geçerli',
                    value: m.counts.valid,
                    color: colors.success,
                    icon: 'checkmark-circle',
                  },
                  {
                    key: 'expiring',
                    label: '30 gün içinde bitiyor',
                    value: m.counts.expiring,
                    color: colors.amber,
                    icon: 'time',
                  },
                  {
                    key: 'expired',
                    label: 'Süresi dolmuş',
                    value: m.counts.expired,
                    color: colors.danger,
                    icon: 'close-circle',
                  },
                  {
                    key: 'waiting',
                    label: 'Onay / imza sürecinde',
                    value: m.counts.waiting,
                    color: colors.textDim,
                    icon: 'hourglass',
                  },
                ]}
              />
            </Card>
          </Column>
        </Columns>

        <Columns gap={spacing.xl}>
          <Column gap={spacing.xl}>
            {/* Yaklaşan eğitimler */}
            <View style={{ gap: spacing.md }}>
              <SectionHeader
                title="Yaklaşan eğitimler"
                action="Tümü"
                onAction={() => router.push('/trainings')}
              />
              {m.upcoming.slice(0, 3).map((a) => (
                <AssignmentRow key={a.id} a={a} />
              ))}
            </View>
          </Column>
          <Column gap={spacing.xl}>
            {/* Süresi yaklaşan sertifikalar */}
            {m.expiring.length > 0 && (
              <View style={{ gap: spacing.md }}>
                <SectionHeader
                  title="Süresi yaklaşan sertifikalar"
                  action={`${m.expiring.length} adet`}
                  onAction={() => router.push({ pathname: '/certificates', params: { filter: 'expiring' } })}
                />
                {m.expiring.slice(0, 3).map((c) => (
                  <CertificateRow key={c.id} cert={c} />
                ))}
              </View>
            )}
          </Column>
        </Columns>

        <Columns gap={spacing.xl}>
          <Column gap={spacing.xl}>
            {/* Riskli firmalar */}
            <View style={{ gap: spacing.md }}>
              <SectionHeader
                title="Dikkat gerektiren firmalar"
                action="Firmalar"
                onAction={() => router.push('/firms')}
              />
              <Card style={{ gap: spacing.lg }}>
                {m.risky.map(({ firm, value }) => (
                  <Pressable key={firm.id} onPress={() => router.push(`/firm/${firm.id}`)} style={{ gap: 8 }}>
                    <View style={styles.riskTop}>
                      <Text style={styles.riskName} numberOfLines={1}>
                        {firm.name}
                      </Text>
                      <HazardPill hazard={firm.hazard} />
                    </View>
                    <View style={styles.riskBar}>
                      <View style={{ flex: 1 }}>
                        <ProgressBar
                          value={value / 100}
                          tone={value >= 85 ? 'success' : value >= 65 ? 'amber' : 'danger'}
                          label={`${firm.name} eğitim uyumu`}
                        />
                      </View>
                      <Text style={styles.riskValue}>%{value}</Text>
                    </View>
                  </Pressable>
                ))}
              </Card>
            </View>
          </Column>
          <Column gap={spacing.xl}>
            {/* Ekip kapasitesi */}
            <View style={{ gap: spacing.md }}>
              <SectionHeader
                title="Ekip çalışma süresi"
                action="Ekip"
                onAction={() => router.push('/team')}
              />
              <Card style={{ gap: spacing.lg }}>
                <Text style={styles.cardSub}>
                  İSG-KATİP asgari süresi / tam zamanlı kapasite (195 saat/ay)
                  {m.overloaded ? ` · ${m.overloaded} kişi kapasite üstünde` : ''}
                </Text>
                {m.load.slice(0, 4).map(({ member, ratio }) => (
                  <View key={member.id} style={styles.loadRow}>
                    <Avatar name={member.name} size={34} />
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={styles.barRowDark}>
                        <Text style={styles.loadName} numberOfLines={1}>
                          {member.name}
                        </Text>
                        <Text style={[styles.loadPct, ratio > 1 && { color: colors.danger }]}>
                          %{Math.round(ratio * 100)}
                        </Text>
                      </View>
                      <ProgressBar
                        value={ratio}
                        tone={ratio > 1 ? 'danger' : ratio > 0.85 ? 'amber' : 'success'}
                        label={`${member.name} kapasite`}
                      />
                      <Text style={styles.loadRole}>{ROLE_LABEL[member.role]}</Text>
                    </View>
                  </View>
                ))}
              </Card>
            </View>
          </Column>
        </Columns>

        {m.contractsEnding > 0 && (
          <Card highlight onPress={() => router.push('/firms')} style={styles.notice}>
            <Ionicons name="document-text" size={20} color={colors.amber} />
            <Text style={styles.noticeText}>
              {m.contractsEnding} firmanın hizmet sözleşmesi 30 gün içinde bitiyor.
            </Text>
            <Ionicons name="chevron-forward" size={18} color={colors.amber} />
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.xl },
  inner: { width: '100%', alignSelf: 'center', gap: spacing.xl },

  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
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
  badgeText: { color: colors.onDanger, fontSize: 9.5, fontWeight: font.heavy },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -spacing.md },
  date: { color: colors.textDim, fontSize: 13, fontWeight: font.medium },
  datePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  datePillText: { color: colors.textMuted, fontSize: 13, fontWeight: font.semibold },

  hero: {
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.xl,
    overflow: 'hidden',
    shadowColor: colors.amber,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  heroStripes: {
    position: 'absolute',
    top: -40,
    right: -30,
    flexDirection: 'row',
    gap: 12,
    opacity: 0.1,
    transform: [{ rotate: '-35deg' }],
  },
  heroStripe: { width: 12, height: 200, backgroundColor: colors.onAmber },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(9,9,11,0.12)',
    marginBottom: 4,
  },
  heroBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.onAmber },
  heroBadgeText: { color: colors.onAmber, fontSize: 11, fontWeight: font.bold, letterSpacing: 0.2 },
  heroLabel: { color: 'rgba(9,9,11,0.72)', fontSize: 13, fontWeight: font.semibold },
  heroValue: {
    color: colors.onAmber,
    fontSize: 46,
    lineHeight: 50,
    fontWeight: font.heavy,
    letterSpacing: -1.6,
    fontVariant: ['tabular-nums'],
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.onAmber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { color: 'rgba(9,9,11,0.78)', fontSize: 12.5, fontWeight: font.semibold },
  barValue: { color: colors.onAmber, fontSize: 12.5, fontWeight: font.bold, fontVariant: ['tabular-nums'] },
  barTrack: { height: 7, borderRadius: 4, backgroundColor: 'rgba(9,9,11,0.15)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4, backgroundColor: colors.onAmber },

  cardInteractiveHover: { borderColor: colors.borderStrong, backgroundColor: colors.surface },

  taskRow: { flexDirection: 'row', gap: spacing.md },
  task: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  taskHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  taskIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCount: {
    color: colors.white,
    fontSize: 28,
    fontWeight: font.heavy,
    letterSpacing: -0.8,
    fontVariant: ['tabular-nums'],
  },
  taskLabel: { color: colors.textMuted, fontSize: 12, lineHeight: 16, fontWeight: font.medium },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gridDesktop: { flexWrap: 'nowrap' },
  kpi: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  kpiDesktop: { flex: 1, flexBasis: 0, minWidth: 0 },
  kpiTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  kpiIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    color: colors.white,
    fontSize: 30,
    fontWeight: font.heavy,
    letterSpacing: -0.9,
    fontVariant: ['tabular-nums'],
  },
  kpiLabel: { color: colors.text, fontSize: 13.5, fontWeight: font.semibold },
  kpiHint: { color: colors.textDim, fontSize: 12, fontWeight: font.medium, marginTop: 2 },

  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardTitle: { color: colors.white, fontSize: 16, fontWeight: font.bold, letterSpacing: -0.2 },
  cardSub: { color: colors.textDim, fontSize: 12.5, marginTop: 2, lineHeight: 17 },
  link: { color: colors.amber, fontSize: 13, fontWeight: font.semibold },

  riskTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  riskName: { flex: 1, color: colors.text, fontSize: 14.5, fontWeight: font.semibold },
  riskBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  riskValue: { color: colors.text, fontSize: 13, fontWeight: font.bold, width: 42, textAlign: 'right', fontVariant: ['tabular-nums'] },

  loadRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  barRowDark: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  loadName: { flex: 1, color: colors.text, fontSize: 14, fontWeight: font.semibold },
  loadPct: { color: colors.text, fontSize: 13, fontWeight: font.bold, fontVariant: ['tabular-nums'] },
  loadRole: { color: colors.textDim, fontSize: 11.5 },

  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  noticeText: { flex: 1, color: colors.text, fontSize: 13.5, fontWeight: font.medium, lineHeight: 19 },
});
