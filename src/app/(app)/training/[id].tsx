import { Ionicons } from '@expo/vector-icons';
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

  const assignments = s.assignments
    .filter((a) => a.trainingId === t.id)
    .sort((a, b) => b.date.localeCompare(a.date));
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

      <SectionHeader
        title="Online eğitim içeriği"
        action="Düzenle"
        onAction={() => router.push(`/content/${t.id}`)}
      />
      <Card style={{ gap: spacing.md }}>
        <View style={styles.outline}>
          <Ionicons name="help-circle-outline" size={18} color={colors.amber} />
          <Text style={styles.outlineText}>Ön sınav</Text>
          <Text style={styles.outlineMeta}>{t.content.preTest.questions.length} soru</Text>
        </View>
        {t.content.lessons.map((l, i) => (
          <View key={l.id} style={styles.outline}>
            <Ionicons
              name={l.type === 'video' ? 'play-circle-outline' : 'easel-outline'}
              size={18}
              color={colors.amber}
            />
            <Text style={styles.outlineText} numberOfLines={1}>
              {i + 1}. {l.title}
            </Text>
            <Text style={styles.outlineMeta}>
              {l.type === 'video' ? 'Video' : `${l.slides?.length ?? 0} slayt`} · {l.minutes} dk
            </Text>
          </View>
        ))}
        <View style={styles.outline}>
          <Ionicons name="trophy-outline" size={18} color={colors.amber} />
          <Text style={styles.outlineText}>Final sınavı</Text>
          <Text style={styles.outlineMeta}>
            {t.content.finalExam.questions.length} soru · geçme %{t.content.passScore}
          </Text>
        </View>
        <Button
          title="İçeriği düzenle"
          variant="outline"
          icon="create-outline"
          onPress={() => router.push(`/content/${t.id}`)}
        />
      </Card>

      {t.topics.length > 0 && <SectionHeader title="Konu başlıkları" />}
      {t.topics.length > 0 && (
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
      )}

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
  outline: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  outlineText: { flex: 1, color: colors.text, fontSize: 14 },
  outlineMeta: { color: colors.textDim, fontSize: 12.5 },
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
