import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CredentialsSheet, type Credential } from '@/components/CredentialsSheet';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { DateField, FormActions, FormError, SelectField } from '@/components/ui/forms';
import { Card, Checkbox, Screen, ScreenHeader } from '@/components/ui/kit';
import { actions, useAppState } from '@/data/store';
import { daysFromNow } from '@/lib/format';
import { colors, font, spacing } from '@/theme';

/** Katılımcı (firma personeli) ekleme / düzenleme */
export function ParticipantForm({ id, firmId }: { id?: string; firmId?: string }) {
  const s = useAppState();
  const existing = id ? s.participants.find((p) => p.id === id) : undefined;
  const [name, setName] = useState(existing?.name ?? '');
  const [firm, setFirm] = useState(existing?.firmId ?? firmId ?? '');
  const [title, setTitle] = useState(existing?.title ?? '');
  const [department, setDepartment] = useState(existing?.department ?? '');
  const [tc, setTc] = useState('');
  const [startDate, setStartDate] = useState<string | null>(existing?.startDate ?? daysFromNow(0));
  const [withAccount, setWithAccount] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ id: string; c: Credential } | null>(null);
  const [confirm, setConfirm] = useState(false);

  const save = () => {
    if (!name.trim() || name.trim().split(/\s+/).length < 2) return setError('Ad ve soyad girin.');
    if (!firm) return setError('Firma seçin.');
    if (!title.trim()) return setError('Görev girin.');
    if (tc && !/^\d{11}$/.test(tc)) return setError('T.C. kimlik no 11 haneli olmalı.');
    if (!startDate) return setError('İşe giriş tarihini GG.AA.YYYY biçiminde girin.');
    // T.C. kimlik no açık tutulmaz: ilk 3 ve son 2 hane görünür (KVKK)
    const tcMasked = tc ? `${tc.slice(0, 3)}******${tc.slice(-2)}` : existing?.tcMasked ?? '—';
    const data = { name: name.trim(), firmId: firm, title: title.trim(), department: department.trim() || '—', tcMasked, startDate };
    if (existing) {
      actions.updateParticipant(existing.id, data);
      router.replace(`/participant/${existing.id}`);
      return;
    }
    const newId = actions.createParticipant(data);
    if (withAccount) {
      const r = actions.createAccount(newId);
      if (r && 'password' in r) return setCreds({ id: newId, c: { name: data.name, ...r } });
    }
    router.replace(`/participant/${newId}`);
  };

  const impact = existing
    ? {
        certs: s.certificates.filter((c) => c.participantId === existing.id).length,
        enr: s.enrollments.filter((e) => e.participantId === existing.id).length,
      }
    : null;

  return (
    <Screen header={<ScreenHeader title={existing ? 'Katılımcıyı düzenle' : 'Yeni katılımcı'} subtitle={existing?.name} />}>
      <Card style={{ gap: spacing.lg }}>
        <Field label="Ad soyad *" value={name} onChangeText={setName} autoCapitalize="words" />
        <SelectField
          label="Firma *"
          value={firm || undefined}
          options={s.firms.map((f) => ({ value: f.id, label: f.name, hint: `${f.city} · ${f.employees} çalışan` }))}
          onChange={(v) => setFirm(v ?? '')}
        />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="Görev *" value={title} onChangeText={setTitle} placeholder="Ör. CNC operatörü" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Bölüm" value={department} onChangeText={setDepartment} placeholder="Ör. Üretim" />
          </View>
        </View>
        <Field
          label={existing ? `T.C. kimlik no (kayıtlı: ${existing.tcMasked})` : 'T.C. kimlik no'}
          value={tc}
          onChangeText={(v) => setTc(v.replace(/\D/g, '').slice(0, 11))}
          keyboardType="number-pad"
          placeholder={existing ? 'Değiştirmek için yeni numarayı girin' : '11 haneli'}
          hint="Güvenlik için yalnızca maskelenmiş hali saklanır."
        />
        <DateField label="İşe giriş tarihi *" value={startDate ?? undefined} onChange={(iso) => setStartDate(iso)} />
        {!existing && (
          <Pressable onPress={() => setWithAccount((x) => !x)} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }} accessibilityRole="checkbox" accessibilityState={{ checked: withAccount }}>
            <Checkbox checked={withAccount} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 14, fontWeight: font.semibold }}>Online eğitim giriş hesabı oluştur</Text>
              <Text style={{ color: colors.textDim, fontSize: 12.5 }}>E-posta ve geçici şifre üretilir.</Text>
            </View>
          </Pressable>
        )}
      </Card>
      <FormError message={error} />
      <FormActions saveLabel={existing ? 'Değişiklikleri kaydet' : 'Katılımcıyı ekle'} onSave={save} onDelete={existing ? () => setConfirm(true) : undefined} deleteLabel="Katılımcıyı sil" />

      {existing && impact && (
        <BottomSheet
          visible={confirm}
          onClose={() => setConfirm(false)}
          title="Katılımcı silinsin mi?"
          subtitle={`${existing.name} ile birlikte ${impact.enr} online eğitim kaydı ve ${impact.certs} sertifika kalıcı olarak silinecek.`}
        >
          <View style={{ gap: spacing.sm }}>
            <Button
              title="Kalıcı olarak sil"
              icon="trash-outline"
              onPress={() => {
                actions.deleteParticipants([existing.id]);
                setConfirm(false);
                router.replace('/participants');
              }}
            />
            <Button title="Vazgeç" variant="outline" onPress={() => setConfirm(false)} />
          </View>
        </BottomSheet>
      )}
      <CredentialsSheet
        visible={!!creds}
        accounts={creds ? [creds.c] : []}
        title="Katılımcı eklendi"
        subtitle="Giriş bilgilerini kopyalayıp paylaşın."
        onClose={() => {
          const pid = creds?.id;
          setCreds(null);
          if (pid) router.replace(`/participant/${pid}`);
        }}
      />
    </Screen>
  );
}
