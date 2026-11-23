import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import {
  Card,
  Chips,
  Column,
  Columns,
  EmptyState,
  IconTile,
  Screen,
  ScreenHeader,
  SectionHeader,
} from '@/components/ui/kit';
import { actions, useAppState } from '@/data/store';
import type { Training } from '@/data/types';
import { colors, font, radius, spacing } from '@/theme';

const num = (v: string, fallback = 0) => {
  const n = parseInt(v.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : fallback;
};

/** Yönetici: online eğitim içerik editörü */
export default function ContentEditor() {
  const { trainingId } = useLocalSearchParams<{ trainingId: string }>();
  const s = useAppState();
  const t = s.trainings.find((x) => x.id === trainingId);
  const [deleting, setDeleting] = useState<string | null>(null);

  if (!t) {
    return (
      <Screen header={<ScreenHeader title="İçerik editörü" />}>
        <EmptyState icon="school" title="Eğitim bulunamadı" />
      </Screen>
    );
  }
  const c = t.content;
  const up = (patch: Parameters<typeof actions.updateTraining>[1]) => actions.updateTraining(t.id, patch);
  const totalMin = c.lessons.reduce((sum, l) => sum + l.minutes, 0);

  return (
    <Screen width="wide" header={<ScreenHeader title="İçerik editörü" subtitle={t.title} />}>
      <Columns>
        <Column>
          <SectionHeader title="Genel bilgiler" />
          <Card style={{ gap: spacing.lg }}>
            <Field label="Eğitim adı" value={t.title} onChangeText={(v) => up({ title: v })} />
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Kategori</Text>
              <Chips<Training['category']>
                value={t.category}
                onChange={(v) => up({ category: v })}
                options={[
                  { value: 'Zorunlu', label: 'Zorunlu' },
                  { value: 'Mesleki', label: 'Mesleki' },
                  { value: 'Genel', label: 'Genel' },
                ]}
              />
            </View>
            <View style={styles.pair}>
              <View style={{ flex: 1 }}>
                <Field label="Süre (saat)" value={String(t.hours)} keyboardType="number-pad" onChangeText={(v) => up({ hours: num(v, 1) })} />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Geçerlilik (ay)"
                  value={String(t.validityMonths)}
                  keyboardType="number-pad"
                  onChangeText={(v) => up({ validityMonths: num(v, 12) })}
                />
              </View>
            </View>
            <Field
              label="Açıklama"
              multiline
              value={t.description ?? ''}
              placeholder="Katılımcının eğitim sayfasında görünür"
              onChangeText={(v) => up({ description: v })}
            />
          </Card>

          <SectionHeader title="Başarı kuralları" />
          <Card style={{ gap: spacing.lg }}>
            <View style={styles.pair}>
              <View style={{ flex: 1 }}>
                <Field
                  label="Geçme notu (%)"
                  value={String(c.passScore)}
                  keyboardType="number-pad"
                  onChangeText={(v) => up({ content: { passScore: Math.min(100, num(v, 70)) } })}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field
                  label="Final deneme hakkı"
                  value={String(c.maxAttempts)}
                  keyboardType="number-pad"
                  onChangeText={(v) => up({ content: { maxAttempts: Math.max(1, num(v, 3)) } })}
                />
              </View>
            </View>
            <Text style={styles.dim}>
              Katılımcı sırasıyla ön sınavı, dersleri ve final sınavını tamamlar. Final geçilince sertifika onayınıza düşer.
            </Text>
          </Card>

          <SectionHeader title="Sınavlar" />
          {(['pre', 'final'] as const).map((k) => {
            const exam = k === 'pre' ? c.preTest : c.finalExam;
            return (
              <Card key={k} onPress={() => router.push(`/content/${t.id}/exam/${k}`)} style={styles.row}>
                <IconTile icon={k === 'pre' ? 'help-circle' : 'trophy'} tone="amber" size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{k === 'pre' ? 'Ön sınav' : 'Final sınavı'}</Text>
                  <Text style={styles.dim}>
                    {exam.questions.length} soru · {exam.timeLimit ? `${exam.timeLimit} dk` : 'süre sınırı yok'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
              </Card>
            );
          })}
        </Column>

        <Column>
          <SectionHeader title={`Dersler (${c.lessons.length} · ~${totalMin} dk)`} />
          {c.lessons.length === 0 && (
            <Card>
              <Text style={styles.dim}>Henüz ders yok. Aşağıdan slayt ya da video dersi ekleyin.</Text>
            </Card>
          )}
          {c.lessons.map((l, i) => (
            <Card key={l.id} style={styles.row}>
              <Pressable style={styles.lessonMain} onPress={() => router.push(`/content/${t.id}/lesson/${l.id}`)}>
                <IconTile icon={l.type === 'video' ? 'play-circle' : 'easel'} tone="amber" size={42} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.title} numberOfLines={1}>
                    {i + 1}. {l.title}
                  </Text>
                  <Text style={styles.dim}>
                    {l.type === 'video' ? (l.videoUrl ? 'Video' : 'Video eklenmedi') : `${l.slides?.length ?? 0} slayt`} · {l.minutes} dk
                  </Text>
                </View>
              </Pressable>
              <View style={styles.tools}>
                <Tool icon="chevron-up" label="Yukarı taşı" disabled={i === 0} onPress={() => actions.moveLesson(t.id, l.id, -1)} />
                <Tool icon="chevron-down" label="Aşağı taşı" disabled={i === c.lessons.length - 1} onPress={() => actions.moveLesson(t.id, l.id, 1)} />
                <Tool icon="trash-outline" label="Sil" danger onPress={() => setDeleting(l.id)} />
              </View>
            </Card>
          ))}
          <View style={styles.pair}>
            <View style={{ flex: 1 }}>
              <Button
                title="Slayt dersi"
                variant="outline"
                icon="easel-outline"
                onPress={() => router.push(`/content/${t.id}/lesson/${actions.addLesson(t.id, 'slides')}`)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Video dersi"
                variant="outline"
                icon="videocam-outline"
                onPress={() => router.push(`/content/${t.id}/lesson/${actions.addLesson(t.id, 'video')}`)}
              />
            </View>
          </View>
          <Text style={styles.dim}>
            Değişiklikler otomatik kaydedilir. Devam eden eğitimlerde yeni eklenen dersler, katılımcının sıradaki adımı olur.
          </Text>
        </Column>
      </Columns>

      <BottomSheet visible={!!deleting} onClose={() => setDeleting(null)} title="Dersi sil" subtitle="Bu ders ve içeriği kalıcı olarak silinecek.">
        <View style={{ gap: spacing.sm }}>
          <Button
            title="Sil"
            icon="trash-outline"
            onPress={() => {
              if (deleting) actions.deleteLesson(t.id, deleting);
              setDeleting(null);
            }}
          />
          <Button title="Vazgeç" variant="outline" onPress={() => setDeleting(null)} />
        </View>
      </BottomSheet>
    </Screen>
  );
}

function Tool({
  icon,
  label,
  onPress,
  disabled,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={[styles.tool, disabled && { opacity: 0.3 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={17} color={danger ? colors.danger : colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.textMuted, fontSize: 13, fontWeight: font.medium },
  dim: { color: colors.textDim, fontSize: 12.5, lineHeight: 18 },
  title: { color: colors.text, fontSize: 15, fontWeight: font.semibold },
  pair: { flexDirection: 'row', gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  lessonMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md, minWidth: 0 },
  tools: { flexDirection: 'row', gap: 2 },
  tool: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
});
