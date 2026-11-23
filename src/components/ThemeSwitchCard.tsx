import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Card } from '@/components/ui/kit';
import { useTheme } from '@/lib/theme';
import { colors, font, spacing } from '@/theme';

/** Aydınlık / karanlık tema anahtarı (yalnızca destekleyen platformlarda görünür) */
export function ThemeSwitchCard() {
  const { mode, setMode, switchable } = useTheme();
  if (!switchable) return null;
  return (
    <Card style={styles.row}>
      <Ionicons name={mode === 'dark' ? 'moon' : 'sunny'} size={20} color={colors.amber} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Aydınlık tema</Text>
        <Text style={styles.dim}>Bu cihazda hatırlanır</Text>
      </View>
      <Switch
        value={mode === 'light'}
        onValueChange={(v) => setMode(v ? 'light' : 'dark')}
        trackColor={{ true: colors.amber, false: colors.surfaceHigh }}
        thumbColor="#FFFFFF"
        accessibilityLabel="Aydınlık tema"
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: { color: colors.text, fontSize: 14.5, fontWeight: font.semibold },
  dim: { color: colors.textDim, fontSize: 12.5 },
});
