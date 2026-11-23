import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { LessonVideo } from '@/components/LessonVideo';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { Card, EmptyState, Screen, ScreenHeader, SectionHeader } from '@/components/ui/kit';
import { actions, useAppState } from '@/data/store';
import type { Slide } from '@/data/types';
import { colors, font, radius, spacing } from '@/theme';

const isUrl = (v?: string) => !!v && /^https?:\/\/\S+$/i.test(v.trim());

export default function LessonEditor() {
  const { trainingId, lessonId } = useLocalSearchParams<{ trainingId: string; lessonId: string }>();
  const s = useAppState();
  const t = s.trainings.find((x) => x.id === trainingId);
  const l = t?.content.lessons.find((x) => x.id === lessonId);

  if (!t || !l) {
    return (
      <Screen header={<ScreenHeader title="Ders" />}>
        <EmptyState icon="easel" title="Ders bulunamadı" />
      </Screen>
    );
  }

  const up = (patch: Parameters<typeof actions.updateLesson>[2]) => actions.updateLesson(t.id, l.id, patch);
  const slides = l.slides ?? [];
  const setSlides = (next: Slide[]) => up({ slides: next });
  const editSlide = (id: string, patch: Partial<Slide>) => setSlides(slides.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const moveSlide = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= slides.length) return;
    const copy = [...slides];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setSlides(copy);
  };

  return (
    <Screen header={<ScreenHeader title={l.type === 'video' ? 'Video dersi' : 'Slayt dersi'} subtitle={t.title} />}>
      <Card style={{ gap: spacing.lg }}>
        <Field label="Ders adı" value={l.title} onChangeText={(v) => up({ title: v })} />
        <Field
          label="Tahmini süre (dakika)"
          value={String(l.minutes)}
          keyboardType="number-pad"
          onChangeText={(v) => up({ minutes: parseInt(v.replace(/\D/g, ''), 10) || 1 })}
        />
      </Card>

      {l.type === 'video' ? (
        <>
          <SectionHeader title="Video" />
          <Card style={{ gap: spacing.lg }}>
            <Field
              label="Video adresi (MP4 / HLS)"
              value={l.videoUrl ?? ''}
              autoCapitalize="none"
              keyboardType="url"
              placeholder="https://…/egitim-videosu.mp4"
              hint="Doğrudan oynatılabilen bir video dosyası adresi girin. Katılımcının dersi tamamlaması için en az %90'ını izlemesi gerekir."
              onChangeText={(v) => up({ videoUrl: v.trim() })}
            />
            <Field label="Açıklama" multiline value={l.description ?? ''} onChangeText={(v) => up({ description: v })} />
          </Card>
          {isUrl(l.videoUrl) && (
            <>
              <SectionHeader title="Önizleme" />
              <LessonVideo key={l.videoUrl} url={l.videoUrl!} initialWatched={0} onProgress={() => {}} />
            </>
          )}
        </>
      ) : (
        <>
          <SectionHeader title={`Slaytlar (${slides.length})`} />
          {slides.map((sl, i) => (
            <Card key={sl.id} style={{ gap: spacing.md }}>
              <View style={styles.slideHead}>
                <View style={styles.no}>
                  <Text style={styles.noText}>{i + 1}</Text>
                </View>
                <Text style={styles.slideLabel}>Slayt {i + 1}</Text>
                <Tool icon="chevron-up" label="Yukarı taşı" disabled={i === 0} onPress={() => moveSlide(i, -1)} />
                <Tool icon="chevron-down" label="Aşağı taşı" disabled={i === slides.length - 1} onPress={() => moveSlide(i, 1)} />
                <Tool icon="trash-outline" label="Slaytı sil" danger disabled={slides.length === 1} onPress={() => setSlides(slides.filter((x) => x.id !== sl.id))} />
              </View>
              <Field label="Başlık" value={sl.title} onChangeText={(v) => editSlide(sl.id, { title: v })} />
              <Field
                label="İçerik"
                multiline
                value={sl.body}
                placeholder={'Her satır bir madde olarak gösterilir\nÖrn: Baret takmak zorunludur'}
                onChangeText={(v) => editSlide(sl.id, { body: v })}
              />
              <Field
                label="Görsel adresi (isteğe bağlı)"
                value={sl.imageUrl ?? ''}
                autoCapitalize="none"
                keyboardType="url"
                placeholder="https://…/gorsel.jpg"
                onChangeText={(v) => editSlide(sl.id, { imageUrl: v.trim() || undefined })}
              />
            </Card>
          ))}
          <Button
            title="Slayt ekle"
            variant="outline"
            icon="add"
            onPress={() => setSlides([...slides, { id: actions.newSlideId(), title: `Slayt ${slides.length + 1}`, body: '' }])}
          />
        </>
      )}
      <Text style={styles.dim}>Değişiklikler otomatik kaydedilir.</Text>
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
    <Pressable onPress={onPress} disabled={disabled} hitSlop={4} style={[styles.tool, disabled && { opacity: 0.3 }]} accessibilityRole="button" accessibilityLabel={label}>
      <Ionicons name={icon} size={17} color={danger ? colors.danger : colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  dim: { color: colors.textDim, fontSize: 12.5 },
  slideHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  no: { width: 26, height: 26, borderRadius: 8, backgroundColor: colors.amber, alignItems: 'center', justifyContent: 'center' },
  noText: { color: colors.onAmber, fontSize: 13, fontWeight: font.heavy },
  slideLabel: { flex: 1, color: colors.text, fontSize: 14, fontWeight: font.semibold },
  tool: { width: 32, height: 32, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
});
