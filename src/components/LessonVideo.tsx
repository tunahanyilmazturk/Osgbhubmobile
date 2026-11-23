import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radius } from '@/theme';

type Props = {
  url: string;
  /** Daha önce izlenen yüzde (kaldığı yerden sayım devam etsin) */
  initialWatched: number;
  /** İzlenen yüzde arttıkça çağrılır (0–100) */
  onProgress: (pct: number) => void;
};

/**
 * Ders videosu. Yalnızca normal hızda oynatılan benzersiz saniyeler "izlendi" sayılır;
 * ileri sarmak, başa sarıp aynı bölümü izlemek veya hızlandırmak izleme yüzdesini artırmaz.
 */
export function LessonVideo({ url, initialWatched, onProgress }: Props) {
  const player = useVideoPlayer(url, (p) => {
    p.timeUpdateEventInterval = 1;
  });

  const last = useRef<number | null>(null);
  const seen = useRef<Set<number> | null>(null);
  const initialRef = useRef(initialWatched);
  const reported = useRef(initialWatched);

  useEffect(() => {
    initialRef.current = initialWatched;
  }, [initialWatched]);

  useEffect(() => {
    last.current = null;
    seen.current = null;
    reported.current = initialRef.current;
  }, [url]);

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const duration = player.duration;
    if (!duration || duration < 1) return;
    const totalSecs = Math.ceil(duration);
    if (seen.current === null) {
      const prefilled = Math.round((initialRef.current / 100) * totalSecs);
      seen.current = new Set(Array.from({ length: prefilled }, (_, i) => i));
    }
    if (last.current !== null) {
      const delta = currentTime - last.current;
      const rate = player.playbackRate ?? 1;
      // Normal oynatma: 1 sn aralıkla ~1 sn ilerler. Sarma ve hızlandırma (2x vb.) sayılmaz.
      if (delta > 0 && delta <= 1.5 && rate <= 1.1) {
        const from = Math.max(0, Math.floor(last.current));
        const to = Math.min(totalSecs - 1, Math.floor(currentTime));
        for (let s = from; s <= to; s++) seen.current.add(s);
      }
    }
    last.current = currentTime;
    const pct = Math.min(100, (seen.current.size / totalSecs) * 100);
    if (pct - reported.current >= 1 || (pct >= 99.5 && reported.current < 100)) {
      reported.current = pct >= 99.5 ? 100 : pct;
      onProgress(reported.current);
    }
  });

  return (
    <View style={styles.wrap}>
      <VideoView player={player} style={styles.video} nativeControls contentFit="contain" allowsPictureInPicture={false} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: colors.border,
  },
  video: { width: '100%', height: '100%' },
});
