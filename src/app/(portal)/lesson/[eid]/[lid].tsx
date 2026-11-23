import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { LessonVideo } from '@/components/LessonVideo';
import { Button } from '@/components/ui/Button';
import { Card, EmptyState, ProgressBar, Screen, ScreenHeader, goBack } from '@/components/ui/kit';
import { actions, courseState } from '@/data/store';
import { useParticipant } from '@/lib/portal';
import { useStudyTimer } from '@/lib/useStudyTimer';
import { colors, font, radius, spacing } from '@/theme';

/** Video dersin tamamlanması için gereken izleme oranı */
const VIDEO_REQUIRED = 90;

export default function LessonScreen() {
  const { eid, lid } = useLocalSearchParams<{ eid: string; lid: string }>();
  const { enrollments } = useParticipant();
  const item = enrollments.find((x) => x.e.id === eid);
  const lesson = item?.training.content.lessons.find((l) => l.id === lid);
  const step = item ? courseState(item.training, item.e).steps.find((x) => x.key === lid) : undefined;

  useStudyTimer(item?.e.id, !!lesson && !step?.locked);

  const saved = item?.e.lessonProgress[lid ?? ''] ?? {};
  const slides = lesson?.slides ?? [];
  const [index, setIndex] = useState(() => Math.min(saved.slide ?? 0, Math.max(0, slides.length - 1)));
  const [watched, setWatched] = useState(saved.watched ?? 0);

  if (!item || !lesson || !step) {
    return (
      <Screen header={<ScreenHeader title="Ders" />}>
        <EmptyState icon="easel" title="Ders bulunamadı" />
      </Screen>
    );
  }
  if (step.locked) {
    return (
      <Screen header={<ScreenHeader title={lesson.title} />}>
        <EmptyState icon="lock-closed" title="Bu ders henüz kilitli" text="Önceki adımları tamamlayınca açılır." />
      </Screen>
    );
  }

  const e = item.e;
  const already = e.completedLessons.includes(lesson.id);

  const finish = () => {
    actions.completeLesson(e.id, lesson.id);
    goBack();
  };

  /* ---------------- Video ders ---------------- */
  if (lesson.type === 'video') {
    const ok = already || watched >= VIDEO_REQUIRED || !lesson.videoUrl;
    return (
      <Screen header={<ScreenHeader title={lesson.title} subtitle={`${item.training.title} · Video · ${lesson.minutes} dk`} />}>
        {lesson.videoUrl ? (
          <LessonVideo
            url={lesson.videoUrl}
            initialWatched={saved.watched ?? 0}
            onProgress={(pct) => {
              setWatched(pct);
              actions.saveLessonProgress(e.id, lesson.id, { watched: pct });
            }}
          />
        ) : (
          <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xxl }}>
            <Ionicons name="videocam-off-outline" size={32} color={colors.textDim} />
            <Text style={styles.dim}>Bu derse henüz video eklenmemiş.</Text>
          </Card>
        )}

        {!!lesson.videoUrl && (
          <Card style={{ gap: spacing.sm }}>
            <View style={styles.row}>
              <Text style={styles.label}>İzlenen</Text>
              <Text style={styles.value}>%{Math.round(already ? 100 : watched)}</Text>
            </View>
            <ProgressBar value={(already ? 100 : watched) / 100} tone={ok ? 'success' : 'amber'} label="İzlenen" />
            <Text style={styles.dim}>
              {ok
                ? 'Dersi tamamlayabilirsiniz.'
                : `Dersin tamamlanması için videonun en az %${VIDEO_REQUIRED}'ını izleyin. İleri sarılan kısımlar sayılmaz.`}
            </Text>
          </Card>
        )}

        {!!lesson.description && (
          <Card>
            <Text style={styles.body}>{lesson.description}</Text>
          </Card>
        )}

        <Button title={already ? 'Eğitime dön' : 'Dersi tamamla'} icon="checkmark" disabled={!ok} onPress={finish} />
      </Screen>
    );
  }

  /* ---------------- Slayt ders ---------------- */
  const slide = slides[index];
  const last = index >= slides.length - 1;
  const go = (i: number) => {
    setIndex(i);
    actions.saveLessonProgress(e.id, lesson.id, { slide: i });
  };
  const bullets = (slide?.body ?? '').split('\n').filter((x) => x.trim());

  return (
    <Screen
      header={
        <ScreenHeader
          title={lesson.title}
          subtitle={`${item.training.title} · Slayt ${slides.length ? index + 1 : 0}/${slides.length}`}
        />
      }
    >
      <ProgressBar value={slides.length ? (index + 1) / slides.length : 1} label="Slayt ilerlemesi" />

      {slide ? (
        <View style={styles.slide}>
          <View style={styles.slideStripe} />
          <View style={styles.slideHead}>
            <View style={styles.slideNo}>
              <Text style={styles.slideNoText}>{index + 1}</Text>
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
          </View>
          {!!slide.imageUrl && <Image source={{ uri: slide.imageUrl }} style={styles.image} resizeMode="cover" accessibilityIgnoresInvertColors />}
          <View style={{ gap: spacing.md }}>
            {bullets.map((b, i) => (
              <View key={i} style={styles.bullet}>
                <View style={styles.dot} />
                <Text style={styles.bulletText}>{b}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <EmptyState icon="easel" title="Bu derste slayt yok" />
      )}

      {/* Slayt noktaları */}
      <View style={styles.dots}>
        {slides.map((s, i) => (
          <Pressable
            key={s.id}
            onPress={() => go(i)}
            hitSlop={6}
            accessibilityLabel={`Slayt ${i + 1}`}
            style={[styles.navDot, i === index && styles.navDotOn, i < index && { backgroundColor: colors.amberDeep }]}
          />
        ))}
      </View>

      <View style={styles.nav}>
        <View style={{ flex: 1 }}>
          <Button title="Önceki" variant="outline" icon="arrow-back" disabled={index === 0} onPress={() => go(index - 1)} />
        </View>
        <View style={{ flex: 1.4 }}>
          {last || !slide ? (
            <Button title={already ? 'Eğitime dön' : 'Dersi tamamla'} icon="checkmark" onPress={finish} />
          ) : (
            <Button title="Sonraki" icon="arrow-forward" onPress={() => go(index + 1)} />
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  dim: { color: colors.textDim, fontSize: 12.5, lineHeight: 18 },
  body: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { color: colors.textMuted, fontSize: 13 },
  value: { color: colors.text, fontSize: 13, fontWeight: font.bold },
  slide: {
    minHeight: 320,
    padding: spacing.xxl,
    gap: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  slideStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.amber },
  slideHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  slideNo: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideNoText: { color: colors.onAmber, fontSize: 15, fontWeight: font.heavy },
  slideTitle: { flex: 1, color: colors.white, fontSize: 22, fontWeight: font.heavy, letterSpacing: -0.4 },
  image: { width: '100%', aspectRatio: 16 / 9, borderRadius: radius.md, backgroundColor: colors.surface },
  bullet: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.amber, marginTop: 8 },
  bulletText: { flex: 1, color: colors.text, fontSize: 16.5, lineHeight: 25 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  navDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.borderStrong },
  navDotOn: { width: 22, backgroundColor: colors.amber },
  nav: { flexDirection: 'row', gap: spacing.sm },
});
