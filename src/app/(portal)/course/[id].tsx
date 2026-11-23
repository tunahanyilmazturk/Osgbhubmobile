import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CERT_STATUS } from '@/components/domain';
import { Button } from '@/components/ui/Button';
import { Card, EmptyState, MiniStat, Pill, ProgressBar, Screen, ScreenHeader, SectionHeader, type IconName } from '@/components/ui/kit';
import { certHealth, courseState, type CourseStep } from '@/data/store';
import { formatDate, remainingText } from '@/lib/format';
import { useParticipant } from '@/lib/portal';
import { formatDuration } from '@/lib/useStudyTimer';
import { colors, font, radius, spacing } from '@/theme';

export default function Course() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { enrollments } = useParticipant();
  const item = enrollments.find((x) => x.e.id === id);

  if (!item) {
    return (
      <Screen header={<ScreenHeader title="Eğitim" />}>
        <EmptyState icon="school" title="Eğitim bulunamadı" />
      </Screen>
    );
  }

  const { e, training: t, assignment: a, certificate } = item;
  const c = t.content;
  const cs = courseState(t, e);

  const hrefFor = (st: CourseStep): Href =>
    st.kind === 'lesson' ? `/lesson/${e.id}/${st.key}` : `/exam/${e.id}/${st.kind}`;

  const canOpen = (st: CourseStep) => {
    if (st.locked) return false;
    if (st.kind === 'pre') return !st.done && c.preTest.questions.length > 0;
    if (st.kind === 'final') return !st.done && cs.attemptsLeft > 0;
    return true; // dersler tekrar izlenebilir
  };

  const meta = (st: CourseStep) => {
    if (st.kind === 'pre') {
      if (c.preTest.questions.length === 0) return 'Bu eğitimde ön sınav yok';
      return e.preTest ? `Puanınız %${e.preTest.score}` : `${c.preTest.questions.length} soru · bilgi seviyenizi ölçer`;
    }
    if (st.kind === 'final') {
      const parts = [`${c.finalExam.questions.length} soru`];
      if (c.finalExam.timeLimit) parts.push(`${c.finalExam.timeLimit} dk`);
      parts.push(`geçme notu %${c.passScore}`);
      if (cs.passed) return `Geçtiniz · en yüksek puan %${cs.bestFinal}`;
      if (e.finalAttempts.length) parts.push(`kalan hak ${cs.attemptsLeft}/${cs.attemptLimit}`);
      return parts.join(' · ');
    }
    const l = st.lesson!;
    const kind = l.type === 'video' ? 'Video' : `${l.slides?.length ?? 0} slayt`;
    const prog = e.lessonProgress[l.id];
    const partial =
      !st.done && prog
        ? l.type === 'video'
          ? ` · %${Math.round(prog.watched ?? 0)} izlendi`
          : ` · ${(prog.slide ?? 0) + 1}/${l.slides?.length ?? 0} slayt`
        : '';
    return `${kind} · ${l.minutes} dk${partial}`;
  };

  const icon = (st: CourseStep): IconName =>
    st.kind === 'pre' ? 'help-circle' : st.kind === 'final' ? 'trophy' : st.lesson?.type === 'video' ? 'play-circle' : 'easel';

  const cert = certificate ? CERT_STATUS[certHealth(certificate)] : undefined;

  return (
    <Screen header={<ScreenHeader title={t.title} subtitle={a.dueDate ? `Son tarih: ${formatDate(a.dueDate)}` : undefined} />}>
      {/* Özet */}
      <Card style={{ gap: spacing.lg }}>
        <View style={{ flexDirection: 'row' }}>
          <MiniStat value={`%${Math.round(cs.progress * 100)}`} label="İlerleme" tone="amber" />
          <MiniStat value={formatDuration(e.seconds)} label="Çalışma süresi" />
          <MiniStat
            value={cs.bestFinal !== undefined ? `%${cs.bestFinal}` : '—'}
            label="Final puanı"
            tone={cs.passed ? 'success' : cs.bestFinal !== undefined ? 'danger' : undefined}
          />
        </View>
        <ProgressBar value={cs.progress} label="Eğitim ilerlemesi" />
        {!!t.description && <Text style={styles.desc}>{t.description}</Text>}
        {a.dueDate && e.status !== 'completed' && (
          <Text style={styles.dim}>
            {t.hours} saat · Son tarih {formatDate(a.dueDate)} ({remainingText(a.dueDate)})
          </Text>
        )}
      </Card>

      {/* Tamamlandı */}
      {e.status === 'completed' && (
        <Card highlight style={styles.done}>
          <View style={styles.doneIcon}>
            <Ionicons name="trophy" size={26} color={colors.onAmber} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.doneTitle}>Eğitimi tamamladınız</Text>
            <Text style={styles.dim}>
              {certificate?.status === 'signed'
                ? 'Sertifikanız onaylandı ve e-imzalandı.'
                : certificate?.status === 'approved'
                  ? 'Sertifikanız onaylandı, e-imza bekleniyor.'
                  : 'Sertifikanız eğitim sorumlunuzun onayına gönderildi.'}
            </Text>
            {cert && <Pill label={cert.label} tone={cert.tone} icon={cert.icon} />}
          </View>
        </Card>
      )}
      {e.status === 'failed' && (
        <Card style={[styles.done, { borderColor: 'rgba(255,90,95,0.4)' }]}>
          <Ionicons name="alert-circle" size={26} color={colors.danger} />
          <Text style={[styles.dim, { flex: 1, color: colors.text }]}>
            Final sınavı deneme hakkınız doldu. Eğitim sorumlunuz size yeni hak tanıyabilir.
          </Text>
        </Card>
      )}

      {/* Adımlar */}
      <SectionHeader title="Eğitim adımları" />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {cs.steps.map((st, i) => {
          const isNext = cs.next?.key === st.key && e.status !== 'completed';
          const open = canOpen(st);
          return (
            <Pressable
              key={st.key}
              disabled={!open}
              onPress={() => router.push(hrefFor(st))}
              style={({ pressed }) => [
                styles.step,
                i > 0 && styles.border,
                isNext && styles.stepNext,
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityState={{ disabled: !open }}
              accessibilityLabel={`${i + 1}. ${st.title}${st.done ? ', tamamlandı' : st.locked ? ', kilitli' : ''}`}
            >
              <View
                style={[
                  styles.stepIcon,
                  st.done && { backgroundColor: colors.amber },
                  isNext && { backgroundColor: colors.amberSoft, borderColor: colors.amber, borderWidth: 1.5 },
                ]}
              >
                <Ionicons
                  name={st.done ? 'checkmark' : st.locked ? 'lock-closed' : icon(st)}
                  size={18}
                  color={st.done ? colors.onAmber : st.locked ? colors.textDim : colors.amber}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.stepTitle, st.locked && { color: colors.textDim }]}>
                  {st.kind === 'lesson' ? `${i}. ` : ''}
                  {st.title}
                </Text>
                <Text style={styles.dim}>{meta(st)}</Text>
              </View>
              {isNext ? (
                <Pill label="Sıradaki" tone="amber" />
              ) : open ? (
                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              ) : null}
            </Pressable>
          );
        })}
      </Card>

      {cs.next && e.status !== 'completed' && e.status !== 'failed' && (
        <Button
          title={
            cs.next.kind === 'pre'
              ? 'Ön sınava başla'
              : cs.next.kind === 'final'
                ? e.finalAttempts.length
                  ? `Final sınavını tekrar dene (${cs.attemptsLeft} hak)`
                  : 'Final sınavına başla'
                : `Derse devam et: ${cs.next.title}`
          }
          icon="arrow-forward"
          onPress={() => router.push(hrefFor(cs.next!))}
        />
      )}
      {certificate && (
        <Button
          title="Sertifikamı görüntüle"
          variant="outline"
          icon="ribbon-outline"
          onPress={() => router.push(`/my-certificate/${certificate.id}`)}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  dim: { color: colors.textDim, fontSize: 12.5, lineHeight: 17 },
  desc: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  done: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  doneIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneTitle: { color: colors.white, fontSize: 17, fontWeight: font.bold },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  stepNext: { backgroundColor: '#17140D' },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: { color: colors.text, fontSize: 15, fontWeight: font.semibold },
});
