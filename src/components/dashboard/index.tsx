import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Alert, QuickAction, Stat, Visit } from '@/data/dashboard';
import { colors, font, radius, spacing } from '@/theme';

/* ---------- Bölüm başlığı ---------- */

export function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {action && (
        <Pressable hitSlop={8} style={s.sectionAction}>
          <Text style={s.sectionActionText}>{action}</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.amber} />
        </Pressable>
      )}
    </View>
  );
}

/* ---------- Uyum skoru kartı ---------- */

export function ComplianceCard({
  score,
  change,
  breakdown,
}: {
  score: number;
  change: string;
  breakdown: { label: string; value: number }[];
}) {
  return (
    <LinearGradient
      colors={[colors.amberLight, colors.amber, colors.amberDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.hero}
    >
      {/* dekoratif şeritler */}
      <View pointerEvents="none" style={s.heroStripes}>
        {Array.from({ length: 6 }).map((_, i) => (
          <View key={i} style={s.heroStripe} />
        ))}
      </View>

      <View style={s.heroTop}>
        <View style={{ gap: 2 }}>
          <Text style={s.heroLabel}>Genel uyum skoru</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
            <Text style={s.heroValue}>%{score}</Text>
            <View style={s.heroChange}>
              <Ionicons name="trending-up" size={12} color={colors.amber} />
              <Text style={s.heroChangeText}>{change}</Text>
            </View>
          </View>
        </View>
        <View style={s.heroIcon}>
          <Ionicons name="shield-checkmark" size={26} color={colors.amber} />
        </View>
      </View>

      <View style={{ gap: spacing.md }}>
        {breakdown.map((b) => (
          <View key={b.label} style={{ gap: 6 }}>
            <View style={s.barRow}>
              <Text style={s.barLabel}>{b.label}</Text>
              <Text style={s.barValue}>%{b.value}</Text>
            </View>
            <View
              style={s.barTrack}
              accessibilityRole="progressbar"
              accessibilityLabel={b.label}
              accessibilityValue={{ min: 0, max: 100, now: b.value }}
            >
              <View style={[s.barFill, { width: `${b.value}%` }]} />
            </View>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

/* ---------- İstatistik kartı ---------- */

const TONE = {
  amber: { fg: colors.amber, bg: colors.amberSoft },
  danger: { fg: colors.danger, bg: colors.dangerSoft },
  neutral: { fg: colors.text, bg: colors.surfaceHigh },
};

export function StatCard({ stat }: { stat: Stat }) {
  const tone = TONE[stat.tone];
  return (
    <Pressable style={({ pressed }) => [s.stat, pressed && { opacity: 0.85 }]}>
      <View style={[s.statIcon, { backgroundColor: tone.bg }]}>
        <Ionicons name={stat.icon} size={18} color={tone.fg} />
      </View>
      <Text style={s.statValue}>{stat.value}</Text>
      <Text style={s.statLabel}>{stat.label}</Text>
      <Text style={[s.statHint, stat.tone === 'danger' && { color: colors.danger }]}>
        {stat.hint}
      </Text>
    </Pressable>
  );
}

/* ---------- Hızlı işlem ---------- */

export function QuickActionButton({ action }: { action: QuickAction }) {
  return (
    <Pressable
      style={({ pressed }) => [s.quick, pressed && { transform: [{ scale: 0.96 }] }]}
      accessibilityRole="button"
      accessibilityLabel={action.label.replace('\n', ' ')}
    >
      <View style={s.quickIcon}>
        <Ionicons name={action.icon} size={22} color={colors.amber} />
      </View>
      <Text style={s.quickLabel}>{action.label}</Text>
    </Pressable>
  );
}

/* ---------- Bugünkü ziyaret satırı ---------- */

export function VisitRow({ visit, last }: { visit: Visit; last: boolean }) {
  const done = visit.status === 'done';
  const next = visit.status === 'next';
  return (
    <View style={s.visit}>
      <View style={s.timeline}>
        <View
          style={[
            s.node,
            done && { backgroundColor: colors.amber, borderColor: colors.amber },
            next && { borderColor: colors.amber },
          ]}
        >
          {done && <Ionicons name="checkmark" size={11} color={colors.onAmber} />}
          {next && <View style={s.nodeInner} />}
        </View>
        {!last && <View style={[s.rail, done && { backgroundColor: colors.amberDeep }]} />}
      </View>

      <View style={[s.visitCard, next && s.visitCardNext]}>
        <View style={s.visitIcon}>
          <Ionicons name={visit.icon} size={18} color={next ? colors.amber : colors.textMuted} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[s.visitFirm, done && { color: colors.textMuted }]} numberOfLines={1}>
            {visit.firm}
          </Text>
          <Text style={s.visitTask} numberOfLines={1}>
            {visit.task}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={[s.visitTime, next && { color: colors.amber }]}>{visit.time}</Text>
          {next && (
            <View style={s.nextPill}>
              <Text style={s.nextPillText}>SIRADAKİ</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

/* ---------- Uyarı satırı ---------- */

export function AlertRow({ alert }: { alert: Alert }) {
  const critical = alert.level === 'critical';
  const c = critical ? colors.danger : colors.amber;
  return (
    <Pressable style={({ pressed }) => [s.alert, pressed && { opacity: 0.85 }]}>
      <View style={[s.alertBar, { backgroundColor: c }]} />
      <View style={[s.alertIcon, { backgroundColor: critical ? colors.dangerSoft : colors.amberSoft }]}>
        <Ionicons name={critical ? 'flame' : 'time'} size={18} color={c} />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.alertFirm}>{alert.firm}</Text>
        <Text style={s.alertText}>{alert.text}</Text>
      </View>
      <Text style={[s.alertDue, { color: c }]}>{alert.due}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  sectionTitle: { color: colors.white, fontSize: 18, fontWeight: font.bold, letterSpacing: -0.3 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { color: colors.amber, fontSize: 13, fontWeight: font.semibold },

  hero: { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.xl, overflow: 'hidden' },
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
  heroLabel: { color: 'rgba(10,10,11,0.7)', fontSize: 13, fontWeight: font.semibold },
  heroValue: {
    color: colors.onAmber,
    fontSize: 44,
    lineHeight: 48,
    fontWeight: font.heavy,
    letterSpacing: -1.5,
  },
  heroChange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 9,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.onAmber,
  },
  heroChangeText: { color: colors.amber, fontSize: 11, fontWeight: font.bold },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.onAmber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barRow: { flexDirection: 'row', justifyContent: 'space-between' },
  barLabel: { color: 'rgba(10,10,11,0.78)', fontSize: 12.5, fontWeight: font.semibold },
  barValue: { color: colors.onAmber, fontSize: 12.5, fontWeight: font.bold },
  barTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(10,10,11,0.15)',
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 3, backgroundColor: colors.onAmber },

  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  statValue: { color: colors.white, fontSize: 28, fontWeight: font.heavy, letterSpacing: -0.8 },
  statLabel: { color: colors.text, fontSize: 13, fontWeight: font.semibold },
  statHint: { color: colors.textDim, fontSize: 12, fontWeight: font.medium, marginTop: 2 },

  quick: { flex: 1, alignItems: 'center', gap: spacing.sm },
  quickIcon: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    color: colors.textMuted,
    fontSize: 11.5,
    lineHeight: 15,
    fontWeight: font.medium,
    textAlign: 'center',
  },

  visit: { flexDirection: 'row', gap: spacing.md },
  timeline: { width: 20, alignItems: 'center' },
  node: {
    marginTop: 22,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.amber },
  rail: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2, marginBottom: -24 },
  visitCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm + 2,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  visitCardNext: { borderColor: 'rgba(255,176,32,0.45)', backgroundColor: '#17140D' },
  visitIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  visitFirm: { color: colors.text, fontSize: 14.5, fontWeight: font.semibold },
  visitTask: { color: colors.textDim, fontSize: 12.5 },
  visitTime: { color: colors.textMuted, fontSize: 14, fontWeight: font.bold },
  nextPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: colors.amber,
  },
  nextPillText: { color: colors.onAmber, fontSize: 9, fontWeight: font.heavy, letterSpacing: 0.6 },

  alert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    paddingLeft: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  alertBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  alertIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertFirm: { color: colors.text, fontSize: 14, fontWeight: font.semibold },
  alertText: { color: colors.textMuted, fontSize: 12.5, lineHeight: 17 },
  alertDue: { fontSize: 11.5, fontWeight: font.bold, alignSelf: 'flex-start', marginTop: 2 },
});
