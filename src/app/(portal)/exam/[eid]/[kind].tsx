import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { BackHandler, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card, EmptyState, InfoRow, ProgressBar, Screen, ScreenHeader, goBack } from '@/components/ui/kit';
import { actions, courseState } from '@/data/store';
import { nowMs } from '@/lib/clock';
import type { ExamKind } from '@/data/types';
import { useParticipant } from '@/lib/portal';
import { colors, font, radius, spacing } from '@/theme';

type Result = NonNullable<ReturnType<typeof actions.submitExam>>;
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function ExamScreen() {
  const { eid, kind: kindParam } = useLocalSearchParams<{ eid: string; kind: string }>();
  const kind: ExamKind = kindParam === 'pre' ? 'pre' : 'final';
  const { enrollments } = useParticipant();
  const item = enrollments.find((x) => x.e.id === eid);

  const [phase, setPhase] = useState<'intro' | 'exam' | 'result'>('intro');
  const [answers, setAnswers] = useState<number[]>([]);
  const [index, setIndex] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [remaining, setRemaining] = useState(0);
  const startedAt = useRef(0);
  const submittedRef = useRef(false);

  const exam = item ? (kind === 'pre' ? item.training.content.preTest : item.training.content.finalExam) : undefined;
  const questions = exam?.questions ?? [];

  const submit = () => {
    if (!item || submittedRef.current) return;
    submittedRef.current = true;
    setConfirm(false);
    const r = actions.submitExam(item.e.id, kind, answers, (nowMs() - startedAt.current) / 1000);
    if (r) {
      setResult(r);
      setPhase('result');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(
          r.passed === false ? Haptics.NotificationFeedbackType.Error : Haptics.NotificationFeedbackType.Success,
        );
      }
    } else {
      submittedRef.current = false;
    }
  };

  // Sınav sürerken Android geri tuşu ve web sayfa terkine karşı koruma
  useEffect(() => {
    if (phase !== 'exam') return;
    const backSub = BackHandler.addEventListener('hardwareBackPress', () => {
      setConfirm(true);
      return true;
    });
    const onBeforeUnload = (ev: BeforeUnloadEvent) => {
      ev.preventDefault();
      ev.returnValue = '';
    };
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('beforeunload', onBeforeUnload);
    }
    return () => {
      backSub.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', onBeforeUnload);
      }
    };
  }, [phase]);

  // Süre sınırı: sıfırlanınca otomatik teslim
  const submitRef = useRef<() => void>(() => {});
  useEffect(() => {
    submitRef.current = submit;
  });
  useEffect(() => {
    if (phase !== 'exam' || !exam?.timeLimit) return;
    const t = setInterval(() => {
      const left = Math.max(0, exam.timeLimit * 60 - (nowMs() - startedAt.current) / 1000);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(t);
        submitRef.current();
      }
    }, 500);
    return () => clearInterval(t);
  }, [phase, exam?.timeLimit]);

  if (!item || !exam) {
    return (
      <Screen header={<ScreenHeader title="Sınav" />}>
        <EmptyState icon="help-circle" title="Sınav bulunamadı" />
      </Screen>
    );
  }

  const { e, training: t } = item;
  const cs = courseState(t, e);
  const step = cs.steps.find((x) => x.kind === kind)!;
  const title = kind === 'pre' ? 'Ön sınav' : 'Final sınavı';

  /* ---------------- Sonuç ---------------- */
  if (phase === 'result' && result) {
    const passed = result.passed;
    const isFinal = kind === 'final';
    const tone = !isFinal ? colors.amber : passed ? colors.success : colors.danger;
    return (
      <Screen header={<ScreenHeader title={`${title} sonucu`} subtitle={t.title} back={false} />}>
        <Card style={{ alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl }}>
          <View style={[styles.scoreRing, { borderColor: tone }]}>
            <Text style={[styles.score, { color: tone }]}>%{result.score}</Text>
            <Text style={styles.dim}>
              {result.correct}/{result.total} doğru
            </Text>
          </View>
          <Text style={styles.resultTitle}>
            {!isFinal ? 'Ön sınav tamamlandı' : passed ? 'Tebrikler, sınavı geçtiniz!' : 'Bu sefer olmadı'}
          </Text>
          <Text style={[styles.dim, { textAlign: 'center', maxWidth: 420 }]}>
            {!isFinal
              ? 'Ön sınav puanı başarı durumunuzu etkilemez. Şimdi derslere geçebilirsiniz.'
              : passed
                ? 'Eğitimi tamamladınız. Sertifikanız eğitim sorumlunuzun onayına gönderildi; onaylanıp e-imzalandığında Sertifikalarım bölümünde görünecek.'
                : result.attemptsLeft
                  ? `Geçme notu %${t.content.passScore}. Dersleri gözden geçirip tekrar deneyebilirsiniz. Kalan hakkınız: ${result.attemptsLeft}.`
                  : 'Deneme hakkınız doldu. Eğitim sorumlunuz size yeni hak tanıyabilir.'}
          </Text>
        </Card>

        {/* Cevap özeti: doğru cevaplar yalnızca final geçildiğinde gösterilir */}
        {isFinal && (
          <Card style={{ gap: spacing.md }}>
            <Text style={styles.sectionTitle}>Cevaplarınız</Text>
            {questions.map((q, i) => {
              const ok = result.answers[i] === q.answer;
              return (
                <View key={q.id} style={styles.review}>
                  <Ionicons name={ok ? 'checkmark-circle' : 'close-circle'} size={18} color={ok ? colors.success : colors.danger} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.reviewQ}>
                      {i + 1}. {q.text}
                    </Text>
                    {passed && !ok && <Text style={styles.dim}>Doğru cevap: {q.options[q.answer]}</Text>}
                  </View>
                </View>
              );
            })}
          </Card>
        )}

        {isFinal && passed ? (
          <Button title="Sertifikalarım" icon="ribbon" onPress={() => router.replace('/my-certificates')} />
        ) : isFinal && result.attemptsLeft ? (
          <Button
            title="Tekrar dene"
            icon="refresh"
            onPress={() => {
              setAnswers([]);
              setIndex(0);
              setResult(null);
              setPhase('intro');
            }}
          />
        ) : null}
        <Button title="Eğitime dön" variant={isFinal && passed ? 'outline' : kind === 'pre' ? 'primary' : 'outline'} icon="arrow-back" onPress={() => goBack(`/course/${e.id}`)} />
      </Screen>
    );
  }

  /* ---------------- Uygunluk kontrolü ---------------- */
  const blocked =
    step.locked
      ? 'Bu sınav, önceki adımlar tamamlanınca açılır.'
      : kind === 'pre' && e.preTest
        ? `Ön sınavı daha önce tamamladınız (puan %${e.preTest.score}).`
        : kind === 'final' && cs.passed
          ? 'Final sınavını zaten geçtiniz.'
          : kind === 'final' && cs.attemptsLeft === 0
            ? 'Deneme hakkınız doldu.'
            : questions.length === 0
              ? 'Bu sınava henüz soru eklenmemiş.'
              : null;

  const begin = () => {
    submittedRef.current = false;
    startedAt.current = nowMs();
    setRemaining((exam?.timeLimit ?? 0) * 60);
    setAnswers(questions.map(() => -1));
    setIndex(0);
    setPhase('exam');
  };

  /* ---------------- Giriş ---------------- */
  if (phase === 'intro') {
    return (
      <Screen header={<ScreenHeader title={title} subtitle={t.title} />}>
        <Card style={{ gap: spacing.lg, alignItems: 'center', paddingVertical: spacing.xxl }}>
          <View style={styles.introIcon}>
            <Ionicons name={kind === 'pre' ? 'help-circle' : 'trophy'} size={34} color={colors.amber} />
          </View>
          <Text style={styles.resultTitle}>{title}</Text>
          <Text style={[styles.dim, { textAlign: 'center', maxWidth: 420 }]}>
            {kind === 'pre'
              ? 'Eğitime başlamadan önce konu hakkındaki bilginizi ölçer. Puanınız başarı durumunu etkilemez.'
              : `Eğitimi tamamlamak ve sertifika almak için en az %${t.content.passScore} puan almanız gerekir.`}
          </Text>
        </Card>
        <Card style={{ gap: 2 }}>
          <InfoRow icon="list-outline" label="Soru sayısı" value={String(questions.length)} />
          <InfoRow icon="time-outline" label="Süre" value={exam.timeLimit ? `${exam.timeLimit} dakika` : 'Süre sınırı yok'} />
          {kind === 'final' && (
            <>
              <InfoRow icon="ribbon-outline" label="Geçme notu" value={`%${t.content.passScore}`} />
              <InfoRow icon="repeat-outline" label="Kalan hak" value={`${cs.attemptsLeft} / ${cs.attemptLimit}`} />
            </>
          )}
        </Card>
        {blocked ? (
          <Card style={styles.blocked}>
            <Ionicons name="information-circle" size={20} color={colors.amber} />
            <Text style={[styles.dim, { flex: 1, color: colors.text }]}>{blocked}</Text>
          </Card>
        ) : (
          <Button
            title="Sınavı başlat"
            icon="play"
            onPress={begin}
          />
        )}
        {exam.timeLimit > 0 && !blocked && (
          <Text style={[styles.dim, { textAlign: 'center' }]}>Süre dolduğunda sınav otomatik olarak teslim edilir.</Text>
        )}
      </Screen>
    );
  }

  /* ---------------- Sınav ---------------- */
  const q = questions[index];
  const answered = answers.filter((a) => a >= 0).length;
  const lastQ = index === questions.length - 1;
  const mm = Math.floor(remaining / 60);
  const ss = Math.floor(remaining % 60);
  const urgent = exam.timeLimit > 0 && remaining < 60;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Screen
        header={
          <ScreenHeader
            title={title}
            subtitle={`Soru ${index + 1}/${questions.length} · ${answered} cevaplandı`}
            back={false}
            right={
              exam.timeLimit > 0 ? (
                <View style={[styles.timer, urgent && { borderColor: colors.danger, backgroundColor: colors.dangerSoft }]}>
                  <Ionicons name="time-outline" size={16} color={urgent ? colors.danger : colors.amber} />
                  <Text style={[styles.timerText, urgent && { color: colors.danger }]}>
                    {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
                  </Text>
                </View>
              ) : undefined
            }
          />
        }
      >
        <ProgressBar value={(index + 1) / questions.length} label="Sınav ilerlemesi" />

        <Text style={styles.question}>{q.text}</Text>
        <View style={{ gap: spacing.sm }}>
          {q.options.map((opt, i) => {
            const on = answers[index] === i;
            return (
              <Pressable
                key={i}
                onPress={() => setAnswers((prev) => prev.map((a, j) => (j === index ? i : a)))}
                style={({ pressed }) => [styles.option, on && styles.optionOn, pressed && { opacity: 0.85 }]}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
              >
                <View style={[styles.letter, on && styles.letterOn]}>
                  <Text style={[styles.letterText, on && { color: colors.onAmber }]}>{LETTERS[i]}</Text>
                </View>
                <Text style={styles.optionText}>{opt}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Soru gezgini */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navigator}>
          {questions.map((x, i) => (
            <Pressable
              key={x.id}
              onPress={() => setIndex(i)}
              style={[styles.navItem, answers[i] >= 0 && styles.navAnswered, i === index && styles.navCurrent]}
              accessibilityLabel={`Soru ${i + 1}${answers[i] >= 0 ? ', cevaplandı' : ''}`}
            >
              <Text style={[styles.navText, answers[i] >= 0 && { color: colors.onAmber }]}>{i + 1}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.nav}>
          <View style={{ flex: 1 }}>
            <Button title="Önceki" variant="outline" icon="arrow-back" disabled={index === 0} onPress={() => setIndex(index - 1)} />
          </View>
          <View style={{ flex: 1.3 }}>
            {lastQ ? (
              <Button title="Sınavı bitir" icon="checkmark-done" onPress={() => setConfirm(true)} />
            ) : (
              <Button title="Sonraki" icon="arrow-forward" onPress={() => setIndex(index + 1)} />
            )}
          </View>
        </View>
      </Screen>

      <BottomSheet
        visible={confirm}
        onClose={() => setConfirm(false)}
        title="Sınavı bitir"
        subtitle={
          answered < questions.length
            ? `${questions.length - answered} soru boş. Boş sorular yanlış sayılır.`
            : 'Tüm soruları cevapladınız.'
        }
      >
        <View style={{ gap: spacing.sm }}>
          <Button title="Teslim et" icon="checkmark-done" onPress={submit} />
          <Button title="Sınava dön" variant="outline" onPress={() => setConfirm(false)} />
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { color: colors.textDim, fontSize: 13, lineHeight: 19 },
  sectionTitle: { color: colors.white, fontSize: 16, fontWeight: font.bold },
  introIcon: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: { color: colors.white, fontSize: 20, fontWeight: font.bold, textAlign: 'center' },
  blocked: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  scoreRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: { fontSize: 38, fontWeight: font.heavy, letterSpacing: -1 },
  review: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  reviewQ: { color: colors.text, fontSize: 13.5, lineHeight: 19 },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,176,32,0.35)',
    backgroundColor: colors.amberSoft,
  },
  timerText: { color: colors.amber, fontSize: 15, fontWeight: font.bold, fontVariant: ['tabular-nums'] },
  question: { color: colors.white, fontSize: 20, lineHeight: 28, fontWeight: font.bold, marginTop: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  optionOn: { borderColor: colors.amber, backgroundColor: colors.highlight },
  letter: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letterOn: { backgroundColor: colors.amber, borderColor: colors.amber },
  letterText: { color: colors.textMuted, fontSize: 14, fontWeight: font.bold },
  optionText: { flex: 1, color: colors.text, fontSize: 15.5, lineHeight: 22 },
  navigator: { gap: 6, paddingVertical: 4 },
  navItem: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navAnswered: { backgroundColor: colors.amber, borderColor: colors.amber },
  navCurrent: { borderColor: colors.white, borderWidth: 2 },
  navText: { color: colors.textMuted, fontSize: 13, fontWeight: font.bold },
  nav: { flexDirection: 'row', gap: spacing.sm },
});
