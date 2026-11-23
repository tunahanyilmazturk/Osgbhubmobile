import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { CertificateRow, ENROLLMENT_STATUS } from '@/components/domain';
import { ParticipantAccountCard } from '@/components/ParticipantAccountCard';
import { Button } from '@/components/ui/Button';
import { Avatar, Card, EmptyState, InfoRow, Pill, ProgressBar, Screen, ScreenHeader, SectionHeader } from '@/components/ui/kit';
import { courseState, useAppState, useLookups } from '@/data/store';
import { formatDate } from '@/lib/format';
import { colors, font, spacing } from '@/theme';

export default function ParticipantDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useAppState();
  const L = useLookups();
  const p = s.participants.find((x) => x.id === id);

  if (!p) {
    return (
      <Screen header={<ScreenHeader title="Katılımcı" />}>
        <EmptyState icon="person" title="Kişi bulunamadı" />
      </Screen>
    );
  }

  const firm = L.firm(p.firmId);
  const certs = s.certificates
    .filter((c) => c.participantId === p.id)
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
  const upcoming = s.assignments.filter(
    (a) => a.delivery === 'classroom' && a.status !== 'completed' && a.participantIds.includes(p.id),
  );
  const online = s.enrollments.filter((e) => e.participantId === p.id);

  return (
    <Screen header={<ScreenHeader title={p.name} subtitle={firm?.name} />}>
      <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
        <Avatar name={p.name} size={68} tone="amber" />
        <Text style={styles.name}>{p.name}</Text>
        <Text style={styles.dim}>
          {p.title} · {p.department}
        </Text>
      </Card>

      <Card style={{ gap: 2 }}>
        <InfoRow icon="business-outline" label="Firma" value={firm?.name ?? '-'} />
        <InfoRow icon="id-card-outline" label="T.C. kimlik" value={p.tcMasked} />
        <InfoRow icon="calendar-outline" label="İşe giriş" value={formatDate(p.startDate)} />
      </Card>

      <ParticipantAccountCard p={p} />

      {online.length > 0 && (
        <>
          <SectionHeader title="Online eğitimler" />
          {online.map((e) => {
            const t = L.training(e.trainingId)!;
            const cs = courseState(t, e);
            const st = ENROLLMENT_STATUS[e.status];
            return (
              <Card key={e.id} onPress={() => router.push(`/enrollment/${e.id}`)} style={{ gap: spacing.sm }}>
                <View style={styles.rowTop}>
                  <Text style={[styles.item, { flex: 1 }]} numberOfLines={1}>
                    {t.title}
                  </Text>
                  <Pill label={st.label} tone={st.tone} icon={st.icon} />
                </View>
                <ProgressBar value={cs.progress} tone={e.status === 'completed' ? 'success' : 'amber'} height={5} label="İlerleme" />
                <Text style={styles.dim}>
                  %{Math.round(cs.progress * 100)}
                  {e.preTest ? ` · Ön %${e.preTest.score}` : ''}
                  {cs.bestFinal !== undefined ? ` · Final %${cs.bestFinal}` : ''}
                </Text>
              </Card>
            );
          })}
        </>
      )}

      {upcoming.length > 0 && (
        <>
          <SectionHeader title="Planlanan eğitimler" />
          {upcoming.map((a) => (
            <Card key={a.id} onPress={() => router.push(`/assignment/${a.id}`)} highlight style={{ gap: 2 }}>
              <Text style={styles.item}>{L.training(a.trainingId)?.title}</Text>
              <Text style={styles.dim}>
                {formatDate(a.date)} · {a.time} · {a.location}
              </Text>
            </Card>
          ))}
        </>
      )}

      <SectionHeader title={`Sertifikalar (${certs.length})`} />
      {certs.length ? (
        certs.map((c) => <CertificateRow key={c.id} cert={c} showFirm={false} />)
      ) : (
        <Text style={styles.dim}>Henüz sertifika yok.</Text>
      )}

      <Button
        title="Eğitim ata"
        icon="add-circle"
        variant="outline"
        onPress={() => router.push({ pathname: '/assignment/new', params: { firmId: p.firmId } })}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.white, fontSize: 20, fontWeight: font.bold, marginTop: spacing.sm },
  dim: { color: colors.textDim, fontSize: 13 },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  item: { color: colors.text, fontSize: 15, fontWeight: font.semibold },
});
