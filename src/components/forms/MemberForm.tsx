import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { FormActions, FormError } from '@/components/ui/forms';
import { Card, Chips, Screen, ScreenHeader } from '@/components/ui/kit';
import { actions, memberFirms, useAppState } from '@/data/store';
import type { TeamMember, TeamRole } from '@/data/types';
import { colors, spacing } from '@/theme';

/** Ekip üyesi (İSG uzmanı, işyeri hekimi, DSP) ekleme / düzenleme */
export function MemberForm({ id }: { id?: string }) {
  const s = useAppState();
  const existing = id ? s.team.find((m) => m.id === id) : undefined;
  const [d, setD] = useState<Omit<TeamMember, 'id'>>(
    existing ?? { name: '', role: 'specialist', certClass: 'C', certNo: '', email: '', phone: '' },
  );
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const set = <K extends keyof typeof d>(k: K, v: (typeof d)[K]) => setD((x) => ({ ...x, [k]: v }));

  const save = () => {
    if (!d.name.trim()) return setError('Ad soyad girin.');
    if (!d.certNo.trim()) return setError('Belge numarası girin.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) return setError('Geçerli bir e-posta girin.');
    if (d.phone.replace(/\D/g, '').length < 10) return setError('Geçerli bir telefon girin.');
    const data = { ...d, name: d.name.trim(), email: d.email.trim(), certClass: d.role === 'specialist' ? d.certClass : undefined };
    if (existing) actions.updateMember(existing.id, data);
    else actions.createMember(data);
    router.replace('/team');
  };

  const firms = existing ? memberFirms(s, existing) : [];

  return (
    <Screen header={<ScreenHeader title={existing ? 'Ekip üyesini düzenle' : 'Yeni ekip üyesi'} subtitle={existing?.name} />}>
      <Card style={{ gap: spacing.lg }}>
        <Field label="Ad soyad *" value={d.name} onChangeText={(v) => set('name', v)} autoCapitalize="words" />
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Görev *</Text>
          <Chips<TeamRole>
            value={d.role}
            onChange={(v) => set('role', v)}
            options={[
              { value: 'specialist', label: 'İSG uzmanı' },
              { value: 'physician', label: 'İşyeri hekimi' },
              { value: 'dsp', label: 'DSP' },
            ]}
          />
        </View>
        {d.role === 'specialist' && (
          <View style={{ gap: 6 }}>
            <Text style={{ color: colors.textMuted, fontSize: 13 }}>Uzmanlık sınıfı *</Text>
            <Chips<'A' | 'B' | 'C'>
              value={d.certClass ?? 'C'}
              onChange={(v) => set('certClass', v)}
              options={[
                { value: 'A', label: 'A sınıfı' },
                { value: 'B', label: 'B sınıfı' },
                { value: 'C', label: 'C sınıfı' },
              ]}
            />
            <Text style={{ color: colors.textDim, fontSize: 12.5 }}>Çok tehlikeli: A · Tehlikeli: A/B · Az tehlikeli: A/B/C</Text>
          </View>
        )}
        <Field label="Belge / sertifika no *" value={d.certNo} onChangeText={(v) => set('certNo', v)} autoCapitalize="characters" />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field label="E-posta *" value={d.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Telefon *" value={d.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" />
          </View>
        </View>
      </Card>
      <FormError message={error} />
      <FormActions saveLabel={existing ? 'Değişiklikleri kaydet' : 'Ekip üyesini ekle'} onSave={save} onDelete={existing ? () => setConfirm(true) : undefined} deleteLabel="Ekip üyesini sil" />

      {existing && (
        <BottomSheet
          visible={confirm}
          onClose={() => setConfirm(false)}
          title={firms.length ? 'Silinemez' : 'Ekip üyesi silinsin mi?'}
          subtitle={
            firms.length
              ? `${existing.name} şu an ${firms.length} firmaya atanmış (${firms.map((f) => f.name).join(', ')}). Önce bu firmalara başka bir kişi atayın.`
              : `${existing.name} kalıcı olarak silinecek.`
          }
        >
          <View style={{ gap: spacing.sm }}>
            {!firms.length && (
              <Button
                title="Kalıcı olarak sil"
                icon="trash-outline"
                onPress={() => {
                  actions.deleteMembers([existing.id]);
                  setConfirm(false);
                  router.replace('/team');
                }}
              />
            )}
            <Button title={firms.length ? 'Tamam' : 'Vazgeç'} variant="outline" onPress={() => setConfirm(false)} />
          </View>
        </BottomSheet>
      )}
    </Screen>
  );
}
