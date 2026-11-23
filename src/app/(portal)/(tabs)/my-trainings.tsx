import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CERT_STATUS, ENROLLMENT_STATUS } from '@/components/domain';
import { Button } from '@/components/ui/Button';
import {
  Card,
  EmptyState,
  IconTile,
  Pill,
  ProgressBar,
  Screen,
  ScreenHeader,
  SectionHeader,
  type IconName,
} from '@/components/ui/kit';
import { certHealth, courseState } from '@/data/store';
import type { Assignment, Certificate, Enrollment, Training } from '@/data/types';
import { daysUntil, formatDate, remainingText } from '@/lib/format';
import { useParticipant } from '@/lib/portal';
import { useLayout } from '@/lib/responsive';
import { colors, font, radius, spacing } from '@/theme';

type Item = { e: Enrollment; training: Training; assignment: Assignment; certificate?: Certificate };

export default function MyTrainings() {
  const { participant, firm, enrollments } = useParticipant();
  const { isWide } = useLayout();

  if (!participant) {
    return (
      <Screen tabBar header={<ScreenHeader title="Eğitimlerim" back={false} large />}>
        <EmptyState icon="person" title="Hesap bulunamadı" text="Eğitim sorumlunuzla iletişime geçin." />
      </Screen>
    );
  }

  const active = enrollments
    .filter((x) => x.e.status !== 'completed')
    .sort((a, b) => (a.assignment.dueDate ?? '').localeCompare(b.assignment.dueDate ?? ''));
  const done = enrollments.filter((x) => x.e.status === 'completed');
  const overall =
    enrollments.length === 0
      ? 0
      : enrollments.reduce((sum, x) => sum + courseState(x.training, x.e).progress, 0) / enrollments.length;
  const first = participant.name.split(' ')[0];

  return (
    <Screen
      tabBar
      width="wide"
      header={<ScreenHeader title={`Merhaba, ${first}`} subtitle={`${firm?.name} · ${participant.title}`} back={false} large />}
    >
      {participant.account?.mustChangePassword && (
        <Card highlight onPress={() => router.push('/account')} style={styles.notice}>
          <Ionicons name="key" size={20} color={colors.amber} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noticeTitle}>Geçici şifrenizi değiştirin</Text>
            <Text style={styles.dim}>Hesabınızın güvenliği için kendinize ait bir şifre belirleyin.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.amber} />
        </Card>
      )}

      {/* Özet */}
      <LinearGradient
        colors={[colors.amberLight, colors.amber, colors.amberDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.heroLabel}>Genel ilerleme</Text>
            <Text style={styles.heroValue}>%{Math.round(overall * 100)}</Text>
          </View>
          <View style={styles.heroIcon}>
            <Ionicons name="school" size={24} color={colors.amber} />
          </View>
        </View>
        <View style={styles.heroBar}>
          <View style={[styles.heroFill, { width: `${overall * 100}%` }]} />
        </View>
        <View style={styles.heroStats}>
          <HeroStat value={enrollments.length} label="Atanan" />
          <HeroStat value={active.length} label="Devam eden" />
          <HeroStat value={done.length} label="Tamamlanan" />
        </View>
      </LinearGradient>

      <SectionHeader title="Devam eden eğitimler" />
      {active.length === 0 ? (
        <Card>
          <Text style={styles.dim}>Şu an tamamlamanız gereken bir eğitim yok. 🎉</Text>
        </Card>
      ) : (
        <View style={[styles.grid, isWide && { flexDirection: 'row' }]}>
          {active.map((x) => (
            <View key={x.e.id} style={isWide ? styles.half : undefined}>
              <CourseCard item={x} />
            </View>
          ))}
        </View>
      )}

      {done.length > 0 && (
        <>
          <SectionHeader title="Tamamlananlar" />
          <View style={[styles.grid, isWide && { flexDirection: 'row' }]}>
            {done.map((x) => (
              <View key={x.e.id} style={isWide ? styles.half : undefined}>
                <CourseCard item={x} />
              </View>
            ))}
          </View>
        </>
      )}
    </Screen>
  );
}

function HeroStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.heroStatValue}>{value}</Text>
      <Text style={styles.heroStatLabel}>{label}</Text>
    </View>
  );
}

function CourseCard({ item }: { item: Item }) {
  const { e, training: t, assignment: a, certificate } = item;
  const cs = courseState(t, e);
  const st = ENROLLMENT_STATUS[e.status];
  const due = a.dueDate ? daysUntil(a.dueDate) : undefined;
  const overdue = due !== undefined && due < 0 && e.status !== 'completed';
  const cert = certificate ? CERT_STATUS[certHealth(certificate)] : undefined;
  const nextLabel =
    cs.next?.kind === 'pre'
      ? 'Ön sınav'
      : cs.next?.kind === 'final'
        ? 'Final sınavı'
        : cs.next
          ? `Ders: ${cs.next.title}`
          : undefined;

  return (
    <Card onPress={() => router.push(`/course/${e.id}`)} style={{ gap: spacing.md }}>
      <View style={styles.cardTop}>
        <IconTile icon={(t.icon as IconName) ?? 'school'} tone="amber" size={44} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={styles.title} numberOfLines={2}>
            {t.title}
          </Text>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            <Pill label={st.label} tone={st.tone} icon={st.icon} />
            {cert && <Pill label={cert.label} tone={cert.tone} icon={cert.icon} />}
          </View>
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <View style={styles.row}>
          <Text style={styles.dim}>
            {cs.steps.filter((x) => x.done).length}/{cs.steps.length} adım
          </Text>
          <Text style={styles.pct}>%{Math.round(cs.progress * 100)}</Text>
        </View>
        <ProgressBar value={cs.progress} tone={e.status === 'completed' ? 'success' : 'amber'} label={`${t.title} ilerleme`} />
      </View>

      <View style={styles.row}>
        {e.status === 'completed' ? (
          <Text style={styles.dim}>
            Tamamlandı · {formatDate(e.completedAt!.slice(0, 10))}
            {cs.bestFinal !== undefined ? ` · Final %${cs.bestFinal}` : ''}
          </Text>
        ) : (
          <Text style={[styles.dim, overdue && { color: colors.danger }]}>
            {a.dueDate ? `Son tarih: ${formatDate(a.dueDate)} (${remainingText(a.dueDate)})` : ''}
          </Text>
        )}
      </View>

      {e.status !== 'completed' &&
        (e.status === 'failed' ? (
          <View style={styles.failed}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.failedText}>Final deneme hakkınız doldu. Eğitim sorumlunuzla görüşün.</Text>
          </View>
        ) : (
          <Button
            title={e.status === 'not_started' ? 'Eğitime başla' : `Devam et${nextLabel ? ` · ${nextLabel}` : ''}`}
            icon={e.status === 'not_started' ? 'play' : 'arrow-forward'}
            onPress={() => router.push(`/course/${e.id}`)}
          />
        ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  dim: { color: colors.textDim, fontSize: 12.5, lineHeight: 17 },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  noticeTitle: { color: colors.white, fontSize: 14.5, fontWeight: font.bold },
  hero: { borderRadius: radius.xl, padding: spacing.xl, gap: spacing.lg },
  heroLabel: { color: 'rgba(10,10,11,0.7)', fontSize: 13, fontWeight: font.semibold },
  heroValue: { color: colors.onAmber, fontSize: 40, lineHeight: 44, fontWeight: font.heavy, letterSpacing: -1.2 },
  heroIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.onAmber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBar: { height: 6, borderRadius: 3, backgroundColor: 'rgba(10,10,11,0.15)', overflow: 'hidden' },
  heroFill: { height: '100%', borderRadius: 3, backgroundColor: colors.onAmber },
  heroStats: { flexDirection: 'row' },
  heroStatValue: { color: colors.onAmber, fontSize: 22, fontWeight: font.heavy },
  heroStatLabel: { color: 'rgba(10,10,11,0.7)', fontSize: 12, fontWeight: font.semibold },
  grid: { gap: spacing.md, flexWrap: 'wrap' },
  half: { flexBasis: '48%', flexGrow: 1 },
  cardTop: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  title: { color: colors.white, fontSize: 16, fontWeight: font.bold },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pct: { color: colors.text, fontSize: 13, fontWeight: font.bold },
  failed: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerSoft,
  },
  failedText: { flex: 1, color: colors.text, fontSize: 13 },
});
