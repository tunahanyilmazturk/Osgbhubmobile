import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { CredentialsSheet, type Credential } from '@/components/CredentialsSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { Card, InfoRow, Pill } from '@/components/ui/kit';
import { actions, suggestEmail, useLookups } from '@/data/store';
import type { Participant } from '@/data/types';
import { formatDate, formatDateTime } from '@/lib/format';
import { colors, font, spacing } from '@/theme';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Yönetici: katılımcının online eğitim portalı giriş hesabı */
export function ParticipantAccountCard({ p }: { p: Participant }) {
  const L = useLookups();
  const [creating, setCreating] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creds, setCreds] = useState<Credential | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const acc = p.account;

  const openCreate = () => {
    setEmail(suggestEmail(p.name, L.firm(p.firmId)?.name ?? 'firma'));
    setError(null);
    setCreating(true);
  };

  const create = () => {
    if (!EMAIL_RE.test(email.trim())) return setError('Geçerli bir e-posta adresi girin');
    const r = actions.createAccount(p.id, email);
    if (!r) return;
    if ('error' in r) return setError(r.error);
    setCreating(false);
    setCreds({ name: p.name, email: r.email, password: r.password });
  };

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={styles.head}>
        <Ionicons name="key" size={18} color={colors.amber} />
        <Text style={styles.title}>Online eğitim hesabı</Text>
        {acc ? <Pill label="Aktif" tone="success" icon="checkmark-circle" /> : <Pill label="Hesap yok" />}
      </View>

      {acc ? (
        <>
          <View style={{ gap: 2 }}>
            <InfoRow icon="mail-outline" label="E-posta" value={acc.email} />
            <InfoRow icon="calendar-outline" label="Oluşturuldu" value={formatDate(acc.createdAt.slice(0, 10))} />
            <InfoRow
              icon="time-outline"
              label="Son giriş"
              value={acc.lastLogin ? (acc.lastLogin.length > 10 ? formatDateTime(acc.lastLogin) : formatDate(acc.lastLogin)) : 'Henüz giriş yapmadı'}
            />
          </View>
          {acc.mustChangePassword && (
            <Text style={styles.dim}>Katılımcı henüz geçici şifresini değiştirmedi.</Text>
          )}
          <View style={styles.actions}>
            <View style={{ flex: 1 }}>
              <Button
                title="Şifre sıfırla"
                variant="outline"
                icon="refresh"
                onPress={() => setCreds({ name: p.name, email: acc.email, password: actions.resetPassword(p.id) })}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button title="Hesabı kaldır" variant="outline" icon="trash-outline" onPress={() => setConfirmRemove(true)} />
            </View>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.dim}>
            Hesap oluşturduğunuzda katılımcı, giriş sayfasında “Katılımcı” seçerek kendisine atanan online eğitimleri tamamlayabilir.
          </Text>
          <Button title="Giriş hesabı oluştur" icon="person-add" onPress={openCreate} />
        </>
      )}

      <BottomSheet visible={creating} onClose={() => setCreating(false)} title="Giriş hesabı oluştur" subtitle={p.name}>
        <View style={{ gap: spacing.lg }}>
          <TextField
            label="E-posta"
            icon="mail-outline"
            value={email}
            onChangeText={(t) => {
              setEmail(t);
              setError(null);
            }}
            error={error ?? undefined}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.dim}>Geçici şifre otomatik üretilir; katılımcıdan ilk girişte değiştirmesi istenir.</Text>
          <Button title="Oluştur" icon="checkmark" onPress={create} />
        </View>
      </BottomSheet>

      <BottomSheet
        visible={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title="Hesabı kaldır"
        subtitle="Katılımcı artık giriş yapamaz. Eğitim kayıtları ve sertifikaları korunur."
      >
        <View style={{ gap: spacing.sm }}>
          <Button
            title="Kaldır"
            icon="trash-outline"
            onPress={() => {
              actions.removeAccount(p.id);
              setConfirmRemove(false);
            }}
          />
          <Button title="Vazgeç" variant="outline" onPress={() => setConfirmRemove(false)} />
        </View>
      </BottomSheet>

      <CredentialsSheet visible={!!creds} accounts={creds ? [creds] : []} onClose={() => setCreds(null)} />
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1, color: colors.white, fontSize: 16, fontWeight: font.bold },
  dim: { color: colors.textDim, fontSize: 13, lineHeight: 19 },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
