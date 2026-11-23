import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CERT_STATUS, ENROLLMENT_STATUS } from '@/components/domain';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import {
  Avatar,
  Card,
  Column,
  Columns,
  EmptyState,
  InfoRow,
  MiniStat,
  Pill,
  ProgressBar,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui/kit';
import { actions, certHealth, courseState, useAppState, useLookups } from '@/data/store';
import type { ExamResult, Question } from '@/data/types';
import { formatWhen } from '@/lib/format';
import { displayName, useSession } from '@/lib/session';
import { formatDuration } from '@/lib/useStudyTimer';
import { colors, font, radius, spacing } from '@/theme';

const REASONS = ['Sınav sonucu yetersiz', 'Eğitim süresi çok kısa', 'Kimlik doğrulanamadı', 'Hatalı kişi bilgisi'];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

/** Yönetici: katılımcının online eğitim kaydını inceler, sertifikayı onaylar/reddeder */
export default function EnrollmentReview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useAppState();
  const L = useLookups();
  const { user } = useSession();
  const [rejecting, setRejecting] = useState(false);
  const [showPre, setShowPre] = useState(false);
  const e = s.enrollments.find((x) => x.id === id);

  if (!e) {
    return (
      <Screen header={<ScreenHeader title="Eğitim kaydı" />}>
        <EmptyState icon="school" title="Kayıt bulunamadı" />
      </Screen>
    );
  }

  const p = L.participant(e.participantId);
  const t = L.training(e.trainingId)!;
  const firm = L.firm(p?.firmId ?? '');
  const cs = courseState(t, e);
  const st = ENROLLMENT_STATUS[e.status];
  const cert = s.certificates.find((c) => c.enrollmentId === e.id);
  const certSt = cert ? CERT_STATUS[certHealth(cert)] : undefined;
  const lastFinal = e.finalAttempts[e.finalAttempts.length - 1];
  const me = user ? displayName(user.name) : 'Kullanıcı';

  // Kısa sürede bitirilen eğitimler için uyarı (tahmini sürenin %30'undan az)
  const expected = t.content.lessons.reduce((sum, l) => sum + l.minutes, 0) * 60;
  const tooFast = e.status === 'completed' && expected > 0 && e.seconds < expected * 0.3;

  return (
    <Screen
      width="wide"
      header={<ScreenHeader title={p?.name ?? 'Katılımcı'} subtitle={`${t.title} · ${firm?.name ?? ''}`} />}
    >
      <Columns>
        <Column>
          {/* Özet */}
          <Card style={{ gap: spacing.lg }}>
            <View style={styles.head}>
              <Avatar name={p?.name ?? '?'} size={48} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.name}>{p?.name}</Text>
                <Pressable onPress={() => router.push(`/participant/${e.participantId}`)} hitSlop={6} accessibilityRole="link">
                  <Text style={styles.link}>Profili aç · hesap ve şifre</Text>
                </Pressable>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  <Pill label={st.label} tone={st.tone} icon={st.icon} />
                  {certSt && <Pill label={certSt.label} tone={certSt.tone} icon={certSt.icon} />}
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row' }}>
              <MiniStat value={e.preTest ? `%${e.preTest.score}` : '—'} label="Ön sınav" />
              <MiniStat
                value={cs.bestFinal !== undefined ? `%${cs.bestFinal}` : '—'}
                label="Final"
                tone={cs.passed ? 'success' : cs.bestFinal !== undefined ? 'danger' : undefined}
              />
              <MiniStat value={formatDuration(e.seconds)} label="Çalışma süresi" />
            </View>
            {e.preTest && cs.bestFinal !== undefined && (
              <Text style={styles.dim}>
                Gelişim: ön sınavdan finale{' '}
                <Text style={{ color: colors.success, fontWeight: font.bold }}>
                  {cs.bestFinal - e.preTest.score >= 0 ? '+' : ''}
                  {cs.bestFinal - e.preTest.score} puan
                </Text>
              </Text>
            )}
            <ProgressBar value={cs.progress} tone={e.status === 'completed' ? 'success' : 'amber'} label="İlerleme" />
            <View style={{ gap: 2 }}>
              {e.startedAt && <InfoRow icon="play-outline" label="Başladı" value={formatWhen(e.startedAt)} />}
              {e.completedAt && <InfoRow icon="flag-outline" label="Tamamladı" value={formatWhen(e.completedAt)} />}
              <InfoRow icon="mail-outline" label="Hesap" value={p?.account?.email ?? 'Hesap yok'} />
            </View>
            {tooFast && (
              <View style={styles.warn}>
                <Ionicons name="speedometer-outline" size={16} color={colors.amber} />
                <Text style={styles.warnText}>
                  Eğitim tahmini süreden çok daha kısa sürede tamamlanmış ({formatDuration(e.seconds)} / ~
                  {formatDuration(expected)}). Onaylamadan önce kontrol etmeniz önerilir.
                </Text>
              </View>
            )}
          </Card>

          {/* Sertifika işlemleri */}
          {cert?.status === 'pending' && (
            <Card highlight style={{ gap: spacing.md }}>
              <Text style={styles.sectionTitle}>Sertifika onayı</Text>
              <Text style={styles.dim}>
                Katılımcı final sınavını %{cs.bestFinal} ile geçti. Onaylarsanız sertifika e-imza kuyruğuna geçer.
              </Text>
              <Button title="Sertifikayı onayla" icon="checkmark-done" onPress={() => actions.approveCertificates([cert.id], me)} />
              <Button title="Reddet" variant="outline" icon="close" onPress={() => setRejecting(true)} />
            </Card>
          )}
          {cert && cert.status !== 'pending' && (
            <Button title="Sertifikayı görüntüle" variant="outline" icon="ribbon-outline" onPress={() => router.push(`/certificate/${cert.id}`)} />
          )}
          {(e.status === 'failed' || (cs.attemptsLeft === 0 && !cs.passed)) && (
            <Card style={{ gap: spacing.md }}>
              <Text style={styles.sectionTitle}>Deneme hakkı doldu</Text>
              <Text style={styles.dim}>
                {e.finalAttempts.length} denemede geçme notuna (%{t.content.passScore}) ulaşılamadı.
              </Text>
              <Button title="1 ek hak tanı" icon="refresh" onPress={() => actions.grantAttempt(e.id)} />
            </Card>
          )}

          {/* Adımlar */}
          <SectionHeader title="Eğitim adımları" />
          <Card style={{ gap: spacing.md }}>
            {cs.steps.map((x) => {
              const prog = x.lesson ? e.lessonProgress[x.lesson.id] : undefined;
              const detail =
                x.kind === 'pre'
                  ? e.preTest
                    ? `%${e.preTest.score} · ${formatWhen(e.preTest.at)}`
                    : 'Yapılmadı'
                  : x.kind === 'final'
                    ? e.finalAttempts.length
                      ? `${e.finalAttempts.length} deneme · en yüksek %${cs.bestFinal}`
                      : 'Yapılmadı'
                    : x.done
                      ? 'Tamamlandı'
                      : prog
                        ? x.lesson?.type === 'video'
                          ? `%${Math.round(prog.watched ?? 0)} izlendi`
                          : `${(prog.slide ?? 0) + 1}/${x.lesson?.slides?.length ?? 0} slayt`
                        : 'Başlanmadı';
              return (
                <View key={x.key} style={styles.step}>
                  <Ionicons
                    name={x.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={x.done ? colors.success : colors.textDim}
                  />
                  <Text style={styles.stepTitle} numberOfLines={1}>
                    {x.title}
                  </Text>
                  <Text style={styles.dim}>{detail}</Text>
                </View>
              );
            })}
          </Card>

          {e.finalAttempts.length > 0 && (
            <>
              <SectionHeader title="Final denemeleri" />
              <Card style={{ gap: spacing.sm }}>
                {e.finalAttempts.map((r, i) => (
                  <View key={r.at + i} style={styles.step}>
                    <Text style={styles.stepTitle}>{i + 1}. deneme</Text>
                    <Text style={styles.dim}>
                      {formatWhen(r.at)} · {formatDuration(r.seconds)}
                    </Text>
                    <Pill label={`%${r.score}`} tone={r.passed ? 'success' : 'danger'} />
                  </View>
                ))}
              </Card>
            </>
          )}
        </Column>

        <Column>
          {/* Cevaplar */}
          <SectionHeader title={lastFinal ? 'Son final sınavı cevapları' : 'Sınav cevapları'} />
          {lastFinal ? (
            <AnswerReview result={lastFinal} questions={t.content.finalExam.questions} />
          ) : (
            <Card>
              <Text style={styles.dim}>Katılımcı henüz final sınavına girmedi.</Text>
            </Card>
          )}
          {e.preTest && (
            <>
              <Pressable onPress={() => setShowPre((x) => !x)} style={styles.toggle} accessibilityRole="button">
                <Text style={styles.link}>{showPre ? 'Ön sınav cevaplarını gizle' : 'Ön sınav cevaplarını göster'}</Text>
                <Ionicons name={showPre ? 'chevron-up' : 'chevron-down'} size={16} color={colors.amber} />
              </Pressable>
              {showPre && <AnswerReview result={e.preTest} questions={t.content.preTest.questions} />}
            </>
          )}
        </Column>
      </Columns>

      <BottomSheet visible={rejecting} onClose={() => setRejecting(false)} title="Sertifikayı reddet" subtitle={p?.name}>
        <View style={{ gap: spacing.sm }}>
          {REASONS.map((r) => (
            <Pressable
              key={r}
              style={styles.reason}
              onPress={() => {
                if (cert) actions.rejectCertificate(cert.id, r);
                setRejecting(false);
              }}
            >
              <Ionicons name="ban" size={18} color={colors.danger} />
              <Text style={styles.reasonText}>{r}</Text>
            </Pressable>
          ))}
        </View>
      </BottomSheet>
    </Screen>
  );
}

function AnswerReview({ result, questions }: { result: ExamResult; questions: Question[] }) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  return (
    <Card style={{ gap: spacing.lg }}>
      <Text style={styles.dim}>
        {formatWhen(result.at)} · %{result.score} · {formatDuration(result.seconds)}
      </Text>
      {result.questionIds.map((qid, i) => {
        const q = byId.get(qid);
        const given = result.answers[i];
        if (!q) {
          return (
            <Text key={qid} style={styles.dim}>
              {i + 1}. Bu soru içerikten silinmiş.
            </Text>
          );
        }
        const ok = given === q.answer;
        return (
          <View key={qid} style={{ gap: 6 }}>
            <View style={styles.qHead}>
              <Ionicons name={ok ? 'checkmark-circle' : 'close-circle'} size={18} color={ok ? colors.success : colors.danger} />
              <Text style={styles.qText}>
                {i + 1}. {q.text}
              </Text>
            </View>
            <View style={{ gap: 4, paddingLeft: 26 }}>
              {q.options.map((o, j) => {
                const correct = j === q.answer;
                const chosen = j === given;
                if (!correct && !chosen) return null;
                return (
                  <View key={j} style={[styles.opt, correct && styles.optCorrect, chosen && !correct && styles.optWrong]}>
                    <Text style={styles.optLetter}>{LETTERS[j]}</Text>
                    <Text style={styles.optText}>{o}</Text>
                    <Text style={styles.optTag}>{correct && chosen ? 'Doğru cevap' : correct ? 'Doğru' : 'Katılımcı'}</Text>
                  </View>
                );
              })}
              {given < 0 && <Text style={styles.dim}>Boş bırakıldı</Text>}
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  dim: { color: colors.textDim, fontSize: 12.5, lineHeight: 18 },
  link: { color: colors.amber, fontSize: 13.5, fontWeight: font.semibold },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { color: colors.white, fontSize: 18, fontWeight: font.bold },
  sectionTitle: { color: colors.white, fontSize: 16, fontWeight: font.bold },
  warn: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: 10, backgroundColor: colors.amberSoft },
  warnText: { flex: 1, color: colors.text, fontSize: 13, lineHeight: 18 },
  step: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  stepTitle: { flex: 1, color: colors.text, fontSize: 14, fontWeight: font.medium },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  qHead: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  qText: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20, fontWeight: font.medium },
  opt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optCorrect: { borderColor: 'rgba(61,220,151,0.4)', backgroundColor: colors.successSoft },
  optWrong: { borderColor: 'rgba(255,90,95,0.4)', backgroundColor: colors.dangerSoft },
  optLetter: { color: colors.textMuted, fontSize: 12, fontWeight: font.bold, width: 14 },
  optText: { flex: 1, color: colors.text, fontSize: 13 },
  optTag: { color: colors.textDim, fontSize: 11, fontWeight: font.semibold },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  reasonText: { color: colors.text, fontSize: 15, fontWeight: font.medium },
});
