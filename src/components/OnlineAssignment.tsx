import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ENROLLMENT_STATUS } from '@/components/domain';
import { Button } from '@/components/ui/Button';
import { Avatar, Card, InfoRow, MiniStat, Pill, ProgressBar, Screen, ScreenHeader, SectionHeader } from '@/components/ui/kit';
import { courseState, useAppState, useLookups } from '@/data/store';
import type { Assignment } from '@/data/types';
import { formatDate, remainingText } from '@/lib/format';
import { formatDuration } from '@/lib/useStudyTimer';
import { colors, font, spacing } from '@/theme';

/** Online eğitim atamasının yönetici görünümü: katılımcı bazında ilerleme */
export function OnlineAssignment({ a }: { a: Assignment }) {
  const s = useAppState();
  const L = useLookups();
  const t = L.training(a.trainingId)!;
  const firm = L.firm(a.firmId);

  const rows = useMemo(
    () =>
      s.enrollments
        .filter((e) => e.assignmentId === a.id)
        .map((e) => ({
          e,
          p: L.participant(e.participantId),
          cs: courseState(t, e),
          cert: s.certificates.find((c) => c.enrollmentId === e.id),
        }))
        .sort((x, y) => y.cs.progress - x.cs.progress),
    [s, a.id, t, L],
  );

  const count = (st: string) => rows.filter((r) => r.e.status === st).length;
  const finals = rows.map((r) => r.cs.bestFinal).filter((x): x is number => x !== undefined);
  const avg = finals.length ? Math.round(finals.reduce((x, y) => x + y, 0) / finals.length) : undefined;
  const pending = rows.filter((r) => r.cert?.status === 'pending').length;
  const completion = rows.length ? count('completed') / rows.length : 0;

  return (
    <Screen width="wide" header={<ScreenHeader title={t.title} subtitle={`${firm?.name} · Online eğitim`} />}>
      <Card style={{ gap: spacing.lg }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.md }}>
          <MiniStat value={String(count('completed'))} label="Tamamlayan" tone="success" />
          <MiniStat value={String(count('in_progress'))} label="Devam eden" tone="amber" />
          <MiniStat value={String(count('not_started'))} label="Başlamayan" />
          <MiniStat value={avg !== undefined ? `%${avg}` : '—'} label="Ort. final puanı" />
        </View>
        <ProgressBar value={completion} tone="success" label="Tamamlanma oranı" />
        <View style={{ gap: 2 }}>
          {a.dueDate && (
            <InfoRow icon="calendar-outline" label="Son tarih" value={`${formatDate(a.dueDate)} (${remainingText(a.dueDate)})`} />
          )}
          <InfoRow icon="person-outline" label="Sorumlu" value={L.member(a.trainerId)?.name ?? '-'} />
          <InfoRow icon="ribbon-outline" label="Geçme notu" value={`%${t.content.passScore} · ${t.content.maxAttempts} hak`} />
        </View>
        {count('failed') > 0 && (
          <View style={styles.warn}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <Text style={styles.warnText}>{count('failed')} katılımcının final hakkı doldu. Kişiye dokunup ek hak tanıyabilirsiniz.</Text>
          </View>
        )}
      </Card>

      {pending > 0 && (
        <Button title={`${pending} sertifika onayınızı bekliyor`} icon="checkmark-done" onPress={() => router.push('/approvals')} />
      )}

      <SectionHeader title={`Katılımcılar (${rows.length})`} />
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {rows.map(({ e, p, cs, cert }, i) => {
          const st = ENROLLMENT_STATUS[e.status];
          return (
            <Pressable
              key={e.id}
              onPress={() => router.push(`/enrollment/${e.id}`)}
              style={({ pressed }) => [styles.row, i > 0 && styles.border, pressed && { opacity: 0.8 }]}
            >
              <Avatar name={p?.name ?? '?'} size={38} />
              <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
                <View style={styles.top}>
                  <Text style={styles.name} numberOfLines={1}>
                    {p?.name}
                  </Text>
                  <Pill label={st.label} tone={st.tone} icon={st.icon} />
                </View>
                <ProgressBar value={cs.progress} tone={e.status === 'completed' ? 'success' : e.status === 'failed' ? 'danger' : 'amber'} height={5} label={`${p?.name} ilerleme`} />
                <Text style={styles.dim} numberOfLines={1}>
                  {[
                    `%${Math.round(cs.progress * 100)}`,
                    e.preTest ? `Ön %${e.preTest.score}` : null,
                    cs.bestFinal !== undefined ? `Final %${cs.bestFinal}${e.finalAttempts.length > 1 ? ` (${e.finalAttempts.length}. deneme)` : ''}` : null,
                    e.seconds ? formatDuration(e.seconds) : null,
                    !p?.account ? 'Hesap yok' : null,
                    cert?.status === 'pending' ? 'Onay bekliyor' : null,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
            </Pressable>
          );
        })}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dim: { color: colors.textDim, fontSize: 12.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, justifyContent: 'space-between' },
  name: { flex: 1, color: colors.text, fontSize: 14.5, fontWeight: font.semibold },
  warn: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', padding: spacing.md, borderRadius: 10, backgroundColor: colors.dangerSoft },
  warnText: { flex: 1, color: colors.text, fontSize: 13 },
});
