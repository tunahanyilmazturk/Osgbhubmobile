import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AssignmentRow } from '@/components/domain';
import { Button } from '@/components/ui/Button';
import {
  Card,
  EmptyState,
  IconTile,
  MiniStat,
  Pill,
  Screen,
  ScreenHeader,
  SectionHeader,
  type IconName,
} from '@/components/ui/kit';
import { certHealth, latestCertificates, useAppState } from '@/data/store';
import { colors, font, spacing } from '@/theme';

export default function TrainingDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useAppState();
  const t = s.trainings.find((x) => x.id === id);

  if (!t) {
    return (
      <Screen header={<ScreenHeader title="Eğitim" />}>
        <EmptyState icon="school" title="Eğitim bulunamadı" />
      </Screen>
    );
  }

  const assignments = s.assignments.filter((a) => a.trainingId === t.id).sort((a, b) => b.date.localeCompare(a.date));
  const certs = latestCertificates(s.certificates.filter((c) => c.trainingId === t.id));
  const valid = certs.filter((c) => ['valid', 'expiring'].includes(certHealth(c))).length;

  return (
    <Screen header={<ScreenHeader title={t.title} subtitle={t.category} />}>
      <Card style={{ gap: spacing.lg }}>
        <View style={styles.top}>
          <IconTile icon={t.icon as IconName} tone="amber" size={52} />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.title}>{t.title}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              <Pill label={t.category} tone={t.category === 'Zorunlu' ? 'amber' : 'neutral'} />
              <Pill label={t.mode} icon={t.mode === 'Online' ? 'laptop' : 'people'} />
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <MiniStat value={`${t.hours} sa`} label="Süre" />
          <MiniStat value={`${t.validityMonths} ay`} label="Geçerlilik" />
          <MiniStat value={String(valid)} label="Geçerli sertifika" tone="success" />
        </View>
      </Card>

      <SectionHeader title="Konu başlıkları" />
      <Card style={{ gap: spacing.md }}>
        {t.topics.map((topic, i) => (
          <View key={topic} style={styles.topic}>
            <View style={styles.topicNo}>
              <Text style={styles.topicNoText}>{i + 1}</Text>
            </View>
            <Text style={styles.topicText}>{topic}</Text>
          </View>
        ))}
      </Card>

      <Button
        title="Bu eğitimi ata"
        icon="add-circle"
        onPress={() => router.push({ pathname: '/assignment/new', params: { trainingId: t.id } })}
      />

      <SectionHeader title={`Atamalar (${assignments.length})`} />
      <View style={{ gap: spacing.sm }}>
        {assignments.map((a) => (
          <AssignmentRow key={a.id} a={a} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  title: { color: colors.white, fontSize: 17, fontWeight: font.bold },
  topic: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  topicNo: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.amberSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicNoText: { color: colors.amber, fontSize: 12, fontWeight: font.bold },
  topicText: { flex: 1, color: colors.text, fontSize: 14 },
});
