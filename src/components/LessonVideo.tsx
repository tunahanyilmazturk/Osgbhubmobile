import { useEventListener } from 'expo';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useRef } from 'react';
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
 * Ders videosu. Yalnızca normal hızda oynatılan süre "izlendi" sayılır;
 * ileri sarmak izleme yüzdesini artırmaz.
 */
export function LessonVideo({ url, initialWatched, onProgress }: Props) {
  const player = useVideoPlayer(url, (p) => {
    p.timeUpdateEventInterval = 1;
  });

  const last = useRef<number | null>(null);
  const watched = useRef<number | null>(null);
  const reported = useRef(initialWatched);

  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    const duration = player.duration;
    if (!duration) return;
    if (watched.current === null) watched.current = (initialWatched / 100) * duration;
    if (last.current !== null) {
      const delta = currentTime - last.current;
      // Normal oynatma: 1 sn aralıkla ~1 sn ilerler. Büyük sıçramalar (sarma) sayılmaz.
      if (delta > 0 && delta <= 2.5) watched.current = Math.min(duration, watched.current + delta);
    }
    last.current = currentTime;
    const pct = Math.min(100, (watched.current / duration) * 100);
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
