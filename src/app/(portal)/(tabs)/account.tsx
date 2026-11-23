import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Avatar, Card, InfoRow, Screen, ScreenHeader, SectionHeader } from '@/components/ui/kit';
import { actions } from '@/data/store';
import { formatDateTime } from '@/lib/format';
import { useParticipant } from '@/lib/portal';
import { useSession } from '@/lib/session';
import { colors, font, radius, spacing } from '@/theme';

export default function Account() {
  const { participant, firm } = useParticipant();
  const { signOut } = useSession();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!participant) return null;
  const acc = participant.account;

  const save = () => {
    if (pw.length < 6) return setMsg({ ok: false, text: 'Şifre en az 6 karakter olmalı.' });
    if (pw !== pw2) return setMsg({ ok: false, text: 'Şifreler eşleşmiyor.' });
    actions.changePassword(participant.id, pw);
    setPw('');
    setPw2('');
    setMsg({ ok: true, text: 'Şifreniz güncellendi.' });
  };

  return (
    <Screen tabBar header={<ScreenHeader title="Hesabım" back={false} large />}>
      <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
        <Avatar name={participant.name} size={72} tone="amber" />
        <Text style={styles.name}>{participant.name}</Text>
        <Text style={styles.dim}>
          {participant.title} · {firm?.name}
        </Text>
      </Card>

      <Card style={{ gap: 2 }}>
        <InfoRow icon="mail-outline" label="E-posta" value={acc?.email ?? '-'} />
        <InfoRow icon="business-outline" label="Firma" value={firm?.name ?? '-'} />
        <InfoRow icon="git-branch-outline" label="Bölüm" value={participant.department} />
        {acc?.lastLogin && <InfoRow icon="time-outline" label="Son giriş" value={formatDateTime(acc.lastLogin)} />}
      </Card>

      <SectionHeader title="Şifre değiştir" />
      <Card style={{ gap: spacing.lg }}>
        {acc?.mustChangePassword && (
          <View style={styles.warn}>
            <Ionicons name="key" size={16} color={colors.amber} />
            <Text style={[styles.dim, { flex: 1, color: colors.text }]}>
              Geçici şifre kullanıyorsunuz. Lütfen kendinize ait bir şifre belirleyin.
            </Text>
          </View>
        )}
        <TextField label="Yeni şifre" icon="lock-closed-outline" value={pw} onChangeText={setPw} secureTextEntry secureToggle autoComplete="new-password" />
        <TextField label="Yeni şifre (tekrar)" icon="lock-closed-outline" value={pw2} onChangeText={setPw2} secureTextEntry secureToggle autoComplete="new-password" />
        {msg && (
          <Text style={{ color: msg.ok ? colors.success : colors.danger, fontSize: 13.5, fontWeight: font.semibold }}>
            {msg.text}
          </Text>
        )}
        <Button title="Şifreyi kaydet" icon="checkmark" onPress={save} />
      </Card>

      <Button title="Çıkış yap" variant="outline" icon="log-out-outline" onPress={signOut} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { color: colors.white, fontSize: 20, fontWeight: font.bold, marginTop: spacing.sm },
  dim: { color: colors.textDim, fontSize: 13 },
  warn: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.amberSoft,
  },
});
