import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Avatar, Card, InfoRow, Screen, ScreenHeader, SectionHeader } from '@/components/ui/kit';
import { actions } from '@/data/store';
import { ROLE_LABELS, displayName, useSession } from '@/lib/session';
import { colors, font, spacing } from '@/theme';

const PREFS = [
  { key: 'approvals', label: 'Onay bekleyen sertifikalar', icon: 'hourglass-outline' },
  { key: 'expiry', label: 'Süresi yaklaşan sertifikalar', icon: 'time-outline' },
  { key: 'katip', label: 'İSG-KATİP hataları', icon: 'cloud-offline-outline' },
] as const;

export default function Profile() {
  const { user, signOut } = useSession();
  const [confirmReset, setConfirmReset] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({ approvals: true, expiry: true, katip: true });

  return (
    <Screen header={<ScreenHeader title="Profil" />}>
      <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
        <Avatar name={user ? displayName(user.name) : '?'} size={72} tone="amber" />
        <Text style={styles.name}>{user ? displayName(user.name) : ''}</Text>
        <Text style={styles.dim}>{user ? ROLE_LABELS[user.role] : ''}</Text>
      </Card>

      <Card style={{ gap: 2 }}>
        <InfoRow icon="mail-outline" label="E-posta" value={user?.email ?? '-'} />
        <InfoRow icon="briefcase-outline" label="Rol" value={user ? ROLE_LABELS[user.role] : '-'} />
        <InfoRow icon="business-outline" label="Kurum" value="OSGB Hub Demo OSGB" />
      </Card>

      <SectionHeader title="Bildirimler" />
      <Card style={{ gap: spacing.md }}>
        {PREFS.map((p) => (
          <View key={p.key} style={styles.pref}>
            <Ionicons name={p.icon} size={18} color={colors.textMuted} />
            <Text style={styles.prefLabel}>{p.label}</Text>
            <Switch
              value={prefs[p.key]}
              onValueChange={(v) => setPrefs((x) => ({ ...x, [p.key]: v }))}
              trackColor={{ true: colors.amber, false: colors.surfaceHigh }}
              thumbColor={colors.white}
              accessibilityLabel={p.label}
            />
          </View>
        ))}
      </Card>

      <SectionHeader title="Demo verileri" />
      <Card style={{ gap: spacing.md }}>
        <Text style={styles.dim}>
          Veriler bu cihazda saklanır. Sıfırlarsanız tüm değişiklikler (hesaplar, atamalar, eğitim ilerlemeleri, içerik
          düzenlemeleri) silinir ve örnek verilere dönülür.
        </Text>
        <Button
          title={confirmReset ? 'Emin misiniz? Tekrar dokunun' : 'Demo verilerini sıfırla'}
          variant="outline"
          icon="refresh"
          onPress={() => {
            if (!confirmReset) return setConfirmReset(true);
            actions.resetDemo();
            setConfirmReset(false);
          }}
        />
      </Card>

      <Button title="Çıkış yap" variant="outline" icon="log-out-outline" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.white, fontSize: 20, fontWeight: font.bold, marginTop: spacing.sm },
  dim: { color: colors.textDim, fontSize: 13 },
  pref: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  prefLabel: { flex: 1, color: colors.text, fontSize: 14, fontWeight: font.medium },
});
