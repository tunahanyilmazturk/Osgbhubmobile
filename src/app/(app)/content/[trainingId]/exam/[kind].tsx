import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Card, EmptyState, Screen, ScreenHeader, SectionHeader } from '@/components/ui/kit';
import { actions, useAppState } from '@/data/store';
import type { ExamKind, Question } from '@/data/types';
import { colors, font, radius, spacing } from '@/theme';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export default function ExamEditor() {
  const { trainingId, kind: k } = useLocalSearchParams<{ trainingId: string; kind: string }>();
  const kind: ExamKind = k === 'pre' ? 'pre' : 'final';
  const s = useAppState();
  const t = s.trainings.find((x) => x.id === trainingId);
  const [open, setOpen] = useState<string | null>(null);

  if (!t) {
    return (
      <Screen header={<ScreenHeader title="Sınav" />}>
        <EmptyState icon="help-circle" title="Eğitim bulunamadı" />
      </Screen>
    );
  }
  const exam = kind === 'pre' ? t.content.preTest : t.content.finalExam;
  const key = kind === 'pre' ? 'preTest' : 'finalExam';
  const save = (q: Question) => actions.saveQuestion(t.id, kind, q);

  const add = () => {
    const q: Question = { id: actions.newQuestionId(), text: '', options: ['', '', '', ''], answer: 0 };
    save(q);
    setOpen(q.id);
  };

  return (
    <Screen header={<ScreenHeader title={kind === 'pre' ? 'Ön sınav' : 'Final sınavı'} subtitle={t.title} />}>
      <Card style={{ gap: spacing.md }}>
        <Field
          label="Süre sınırı (dakika, 0 = sınırsız)"
          value={String(exam.timeLimit)}
          keyboardType="number-pad"
          onChangeText={(v) => actions.updateTraining(t.id, { content: { [key]: { ...exam, timeLimit: parseInt(v.replace(/\D/g, ''), 10) || 0 } } })}
        />
        <Text style={styles.dim}>
          {kind === 'pre'
            ? 'Ön sınav katılımcının başlangıç bilgisini ölçer; başarı durumunu etkilemez.'
            : `Geçme notu %${t.content.passScore}, deneme hakkı ${t.content.maxAttempts}. Doğru cevaplar katılımcıya yalnızca sınavı geçtikten sonra gösterilir.`}
        </Text>
      </Card>

      <SectionHeader title={`Sorular (${exam.questions.length})`} />
      {exam.questions.map((q, i) => {
        const expanded = open === q.id;
        const incomplete = !q.text.trim() || q.options.some((o) => !o.trim());
        return (
          <Card key={q.id} style={{ gap: spacing.md }}>
            <Pressable onPress={() => setOpen(expanded ? null : q.id)} style={styles.qHead} accessibilityRole="button" accessibilityState={{ expanded }}>
              <Text style={styles.qNo}>{i + 1}</Text>
              <Text style={[styles.qText, !q.text && { color: colors.textDim }]} numberOfLines={expanded ? undefined : 2}>
                {q.text || 'Soru metni girilmedi'}
              </Text>
              {incomplete && <Ionicons name="alert-circle" size={16} color={colors.amber} accessibilityLabel="Eksik" />}
              <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textDim} />
            </Pressable>
            {!expanded && (
              <Text style={styles.dim} numberOfLines={1}>
                Doğru cevap: {LETTERS[q.answer]}) {q.options[q.answer]}
              </Text>
            )}
            {expanded && (
              <>
                <Field label="Soru" multiline value={q.text} onChangeText={(v) => save({ ...q, text: v })} style={{ minHeight: 80 }} />
                <Text style={styles.label}>Seçenekler · doğru cevabı işaretleyin</Text>
                {q.options.map((o, j) => (
                  <View key={j} style={styles.opt}>
                    <Pressable
                      onPress={() => save({ ...q, answer: j })}
                      style={[styles.radio, q.answer === j && styles.radioOn]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: q.answer === j }}
                      accessibilityLabel={`${LETTERS[j]} doğru cevap`}
                    >
                      {q.answer === j && <Ionicons name="checkmark" size={14} color={colors.onAmber} />}
                    </Pressable>
                    <Text style={styles.letter}>{LETTERS[j]}</Text>
                    <TextInput
                      value={o}
                      onChangeText={(v) => save({ ...q, options: q.options.map((x, n) => (n === j ? v : x)) })}
                      placeholder={`Seçenek ${LETTERS[j]}`}
                      placeholderTextColor={colors.textDim}
                      style={styles.optInput}
                    />
                    <Pressable
                      disabled={q.options.length <= 2}
                      onPress={() =>
                        save({
                          ...q,
                          options: q.options.filter((_, n) => n !== j),
                          answer: q.answer === j ? 0 : q.answer > j ? q.answer - 1 : q.answer,
                        })
                      }
                      style={[styles.remove, q.options.length <= 2 && { opacity: 0.3 }]}
                      accessibilityLabel={`${LETTERS[j]} seçeneğini sil`}
                    >
                      <Ionicons name="close" size={16} color={colors.textMuted} />
                    </Pressable>
                  </View>
                ))}
                <View style={styles.actions}>
                  {q.options.length < 6 && (
                    <Pressable onPress={() => save({ ...q, options: [...q.options, ''] })} style={styles.link} accessibilityRole="button">
                      <Ionicons name="add" size={16} color={colors.amber} />
                      <Text style={styles.linkText}>Seçenek ekle</Text>
                    </Pressable>
                  )}
                  <Pressable onPress={() => actions.deleteQuestion(t.id, kind, q.id)} style={styles.link} accessibilityRole="button">
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={[styles.linkText, { color: colors.danger }]}>Soruyu sil</Text>
                  </Pressable>
                </View>
              </>
            )}
          </Card>
        );
      })}
      <Button title="Soru ekle" variant="outline" icon="add" onPress={add} />
      <Text style={styles.dim}>Değişiklikler otomatik kaydedilir. Eksik (⚠) sorular katılımcıya hatalı görünebilir.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dim: { color: colors.textDim, fontSize: 12.5, lineHeight: 18 },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: font.medium },
  qHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  qNo: { color: colors.amber, fontSize: 15, fontWeight: font.heavy, width: 22 },
  qText: { flex: 1, color: colors.text, fontSize: 14.5, lineHeight: 20, fontWeight: font.medium },
  opt: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: colors.success, borderColor: colors.success },
  letter: { color: colors.textMuted, fontSize: 13, fontWeight: font.bold, width: 14 },
  optInput: {
    flex: 1,
    minWidth: 0,
    height: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 16,
    outlineStyle: 'none',
  } as object,
  remove: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', justifyContent: 'space-between' },
  link: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4 },
  linkText: { color: colors.amber, fontSize: 13.5, fontWeight: font.semibold },
});
