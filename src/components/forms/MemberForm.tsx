import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { FormActions, FormError } from '@/components/ui/forms';
import { Card, Chips, EmptyState, Screen, ScreenHeader } from '@/components/ui/kit';
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

  if (id && !existing) {
    return (
      <Screen header={<ScreenHeader title="Ekip üyesi" />}>
        <EmptyState icon="people-circle" title="Ekip üyesi bulunamadı" />
      </Screen>
    );
  }

  const firms = existing ? memberFirms(s, existing) : [];
  const assignmentsCount = existing ? s.assignments.filter((a) => a.trainerId === existing.id).length : 0;
  const certsCount = existing ? s.certificates.filter((c) => c.trainerId === existing.id).length : 0;
  const blocked = firms.length > 0 || assignmentsCount > 0 || certsCount > 0;

  const save = () => {
    if (!d.name.trim()) return setError('Ad soyad girin.');
    if (!d.certNo.trim()) return setError('Belge numarası girin.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(d.email.trim())) return setError('Geçerli bir e-posta girin.');
    if (d.phone.replace(/\D/g, '').length < 10) return setError('Geçerli bir telefon girin.');
    if (existing && firms.length && d.role !== existing.role) {
      return setError(`Bu kişi ${firms.length} firmaya atanmış. Görevini değiştirmeden önce firma atamalarını güncelleyin.`);
    }
    const data = {
      ...d,
      name: d.name.trim(),
      email: d.email.trim(),
      certClass: d.role === 'specialist' ? (d.certClass ?? 'C') : undefined,
    };
    if (existing) actions.updateMember(existing.id, data);
    else actions.createMember(data);
    router.replace('/team');
  };

  return (
    <Screen header={<ScreenHeader title={existing ? 'Ekip üyesini düzenle' : 'Yeni ekip üyesi'} subtitle={existing?.name} />}>
      <Card style={{ gap: spacing.lg }}>
        <Field label="Ad soyad *" value={d.name} onChangeText={(v) => set('name', v)} autoCapitalize="words" />
        <View style={{ gap: 6 }}>
          <Text style={{ color: colors.textMuted, fontSize: 13 }}>Görev *</Text>
          <Chips<TeamRole>
            value={d.role}
            onChange={(v) => setD((x) => ({ ...x, role: v, certClass: v === 'specialist' ? (x.certClass ?? 'C') : undefined }))}
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
          title={blocked ? 'Silinemez' : 'Ekip üyesi silinsin mi?'}
          subtitle={
            blocked
              ? `${existing.name} bağlı kayıtlarda kullanılıyor (${[
                  firms.length && `${firms.length} firma`,
                  assignmentsCount && `${assignmentsCount} eğitim ataması`,
                  certsCount && `${certsCount} sertifika`,
                ]
                  .filter(Boolean)
                  .join(', ')}). Önce bağlı kayıtları güncelleyin.`
              : `${existing.name} kalıcı olarak silinecek.`
          }
        >
          <View style={{ gap: spacing.sm }}>
            {!blocked && (
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
            <Button title={blocked ? 'Tamam' : 'Vazgeç'} variant="outline" onPress={() => setConfirm(false)} />
          </View>
        </BottomSheet>
      )}
    </Screen>
  );
}
