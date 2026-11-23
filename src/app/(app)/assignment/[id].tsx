import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ASSIGNMENT_STATUS } from '@/components/domain';
import { OnlineAssignment } from '@/components/OnlineAssignment';
import { Button } from '@/components/ui/Button';
import {
  Avatar,
  Card,
  Checkbox,
  EmptyState,
  InfoRow,
  Pill,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui/kit';
import { actions, useAppState, useLookups } from '@/data/store';
import { formatDate, relativeDays } from '@/lib/format';
import { colors, font, radius, spacing } from '@/theme';

export default function AssignmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useAppState();
  const L = useLookups();
  const a = s.assignments.find((x) => x.id === id);
  const [prevId, setPrevId] = useState(a?.id);
  const [attended, setAttended] = useState<Set<string>>(() => new Set(a?.participantIds ?? []));
  const [doneCount, setDoneCount] = useState<number | null>(null);

  if (prevId !== a?.id) {
    setPrevId(a?.id);
    setAttended(new Set(a?.participantIds ?? []));
    setDoneCount(null);
  }

  if (!a) {
    return (
      <Screen header={<ScreenHeader title="Atama" />}>
        <EmptyState icon="calendar" title="Atama bulunamadı" />
      </Screen>
    );
  }

  if (a.delivery === 'online') return <OnlineAssignment a={a} />;

  const t = L.training(a.trainingId);
  const firm = L.firm(a.firmId);
  const trainer = L.member(a.trainerId);
  const st = ASSIGNMENT_STATUS[a.status];
  const editable = a.status === 'in_progress';
  const certs = s.certificates.filter((c) => c.assignmentId === a.id);

  const toggle = (pid: string) => {
    if (!editable) return;
    setAttended((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });
  };

  const validAttended = a.participantIds.filter((pid) => attended.has(pid));

  return (
    <Screen header={<ScreenHeader title={t?.title ?? 'Atama'} subtitle={firm?.name} />}>
      <Card style={{ gap: spacing.sm }}>
        <View style={styles.statusRow}>
          <Pill label={st.label} tone={st.tone} icon={st.icon} />
          <Text style={styles.dim}>{relativeDays(a.date)}</Text>
        </View>
        <InfoRow icon="calendar-outline" label="Tarih" value={`${formatDate(a.date)} · ${a.time}`} />
        <InfoRow icon="location-outline" label="Yer" value={a.location} />
        <InfoRow icon="person-outline" label="Eğitmen" value={trainer?.name ?? '-'} />
        <InfoRow icon="time-outline" label="Süre" value={`${t?.hours} saat · ${t?.mode}`} />
        <InfoRow icon="business-outline" label="Firma" value={firm?.name ?? '-'} />
      </Card>

      {doneCount !== null && (
        <Card highlight style={styles.success}>
          <Ionicons name="checkmark-circle" size={22} color={colors.amber} />
          <View style={{ flex: 1 }}>
            <Text style={styles.successTitle}>Eğitim tamamlandı</Text>
            <Text style={styles.dim}>{doneCount} sertifika onaya gönderildi.</Text>
          </View>
          <Pressable onPress={() => router.push('/approvals')} hitSlop={8}>
            <Text style={styles.link}>Onaylara git</Text>
          </Pressable>
        </Card>
      )}

      <SectionHeader
        title={editable ? `Yoklama (${validAttended.length}/${a.participantIds.length})` : `Katılımcılar (${a.participantIds.length})`}
      />
      {editable && <Text style={styles.dim}>Eğitime katılmayan kişilerin işaretini kaldırın.</Text>}
      <Card style={{ padding: 0 }}>
        {a.participantIds.map((pid, i) => {
          const p = L.participant(pid);
          if (!p) return null;
          const cert = certs.find((c) => c.participantId === pid);
          return (
            <Pressable
              key={pid}
              onPress={() => (editable ? toggle(pid) : router.push(`/participant/${pid}`))}
              style={[styles.person, i > 0 && styles.border]}
              accessibilityRole={editable ? 'checkbox' : 'button'}
              accessibilityState={editable ? { checked: attended.has(pid) } : undefined}
            >
              <Avatar name={p.name} size={34} />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{p.name}</Text>
                <Text style={styles.dim}>{p.title}</Text>
              </View>
              {editable ? (
                <Checkbox checked={attended.has(pid)} />
              ) : cert ? (
                <Ionicons name="ribbon" size={18} color={colors.amber} accessibilityLabel="Sertifika var" />
              ) : null}
            </Pressable>
          );
        })}
      </Card>

      {a.status === 'planned' && (
        <Button title="Eğitimi başlat" icon="play" onPress={() => actions.startAssignment(a.id)} />
      )}
      {editable && (
        <Button
          title={`Tamamla ve ${validAttended.length} sertifika oluştur`}
          icon="ribbon"
          disabled={validAttended.length === 0}
          onPress={() => setDoneCount(actions.completeAssignment(a.id, validAttended))}
        />
      )}
      {a.status === 'completed' && certs.length > 0 && (
        <View style={styles.certInfo}>
          <Ionicons name="ribbon-outline" size={18} color={colors.textMuted} />
          <Text style={[styles.dim, { flex: 1 }]}>
            Bu eğitimden {certs.length} sertifika oluşturuldu. Katılımcıya dokunarak sertifikalarını görebilirsiniz.
          </Text>
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  dim: { color: colors.textDim, fontSize: 12.5, lineHeight: 17 },
  person: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  border: { borderTopWidth: 1, borderTopColor: colors.border },
  name: { color: colors.text, fontSize: 14.5, fontWeight: font.semibold },
  success: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  successTitle: { color: colors.white, fontSize: 15, fontWeight: font.bold },
  link: { color: colors.amber, fontSize: 13, fontWeight: font.semibold },
  certInfo: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
});
