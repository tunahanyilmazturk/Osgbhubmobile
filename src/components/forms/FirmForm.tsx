import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Field } from '@/components/ui/Field';
import { DateField, FormActions, FormError, SelectField, type Option } from '@/components/ui/forms';
import { Card, Chips, Column, Columns, EmptyState, Screen, ScreenHeader, SectionHeader } from '@/components/ui/kit';
import { FULL_TIME_MINUTES, HAZARD_LABEL, actions, classAllowed, memberLoad, useAppState } from '@/data/store';
import type { Firm, HazardClass, TeamRole } from '@/data/types';
import { addMonths, daysFromNow } from '@/lib/format';
import { colors, spacing } from '@/theme';

type Draft = Omit<Firm, 'id' | 'katip'>;

/** Firma ekleme / düzenleme */
export function FirmForm({ id }: { id?: string }) {
  const s = useAppState();
  const existing = id ? s.firms.find((f) => f.id === id) : undefined;
  const [d, setD] = useState<Draft>(
    existing ?? {
      name: '',
      sector: '',
      hazard: 'tehlikeli',
      city: '',
      employees: 0,
      sgkNo: '',
      specialistId: '',
      physicianId: '',
      dspId: undefined,
      contractStart: daysFromNow(0),
      contractEnd: addMonths(daysFromNow(0), 12),
    },
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  if (id && !existing) {
    return (
      <Screen header={<ScreenHeader title="Firma" />}>
        <EmptyState icon="business" title="Firma bulunamadı" />
      </Screen>
    );
  }

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setD((x) => ({ ...x, [k]: v }));
    setErrors((e) => ({ ...e, [k]: '' }));
  };

  const staff = (role: TeamRole): Option[] =>
    s.team
      .filter((m) => m.role === role)
      .map((m) => {
        const load = memberLoad(s, m);
        return {
          value: m.id,
          label: m.name,
          hint: `${m.certClass ? `${m.certClass} sınıfı · ` : ''}Doluluk %${Math.round(load.ratio * 100)} (${load.minutes.toLocaleString('tr-TR')} / ${FULL_TIME_MINUTES.toLocaleString('tr-TR')} dk)`,
          warn:
            role === 'specialist' && !classAllowed(m.certClass, d.hazard)
              ? `${HAZARD_LABEL[d.hazard]} işyerine ${m.certClass} sınıfı uzman atanamaz.`
              : undefined,
        };
      });

  const save = () => {
    const e: Record<string, string> = {};
    if (!d.name.trim()) e.name = 'Firma adı gerekli';
    if (!d.sector.trim()) e.sector = 'Sektör gerekli';
    if (!d.city.trim()) e.city = 'Şehir gerekli';
    if (!d.employees || d.employees < 1) e.employees = 'Çalışan sayısı girin';
    if (!d.specialistId) e.specialistId = 'İSG uzmanı seçin';
    if (!d.physicianId) e.physicianId = 'İşyeri hekimi seçin';
    if (!d.contractStart) e.contractStart = 'Geçerli tarih girin (GG.AA.YYYY)';
    if (!d.contractEnd) e.contractEnd = 'Geçerli tarih girin (GG.AA.YYYY)';
    else if (d.contractStart && d.contractEnd <= d.contractStart) e.contractEnd = 'Bitiş, başlangıçtan sonra olmalı';
    setErrors(e);
    if (Object.values(e).some(Boolean)) return setFormError('Lütfen işaretli alanları düzeltin.');
    const clean = { ...d, name: d.name.trim(), sector: d.sector.trim(), city: d.city.trim(), dspId: d.hazard === 'cok' ? d.dspId : undefined };
    if (existing) {
      actions.updateFirm(existing.id, clean);
      router.replace(`/firm/${existing.id}`);
    } else {
      const newId = actions.createFirm(clean);
      router.replace(`/firm/${newId}`);
    }
  };

  const impact = existing
    ? {
        people: s.participants.filter((p) => p.firmId === existing.id).length,
        asg: s.assignments.filter((a) => a.firmId === existing.id).length,
        certs: s.certificates.filter((c) => c.firmId === existing.id).length,
      }
    : null;

  return (
    <Screen width="wide" header={<ScreenHeader title={existing ? 'Firmayı düzenle' : 'Yeni firma'} subtitle={existing?.name} />}>
      <Columns>
        <Column>
          <SectionHeader title="Firma bilgileri" />
          <Card style={{ gap: spacing.lg }}>
            <Field label="Firma adı *" value={d.name} onChangeText={(v) => set('name', v)} style={errors.name ? { borderColor: colors.danger } : undefined} />
            {!!errors.name && <Err t={errors.name} />}
            <Field label="Sektör *" value={d.sector} onChangeText={(v) => set('sector', v)} placeholder="Ör. Metal işleme" />
            {!!errors.sector && <Err t={errors.sector} />}
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1, gap: 6 }}>
                <Field label="Şehir *" value={d.city} onChangeText={(v) => set('city', v)} />
                {!!errors.city && <Err t={errors.city} />}
              </View>
              <View style={{ flex: 1, gap: 6 }}>
                <Field
                  label="Çalışan sayısı *"
                  value={d.employees ? String(d.employees) : ''}
                  keyboardType="number-pad"
                  onChangeText={(v) => set('employees', parseInt(v.replace(/\D/g, ''), 10) || 0)}
                />
                {!!errors.employees && <Err t={errors.employees} />}
              </View>
            </View>
            <View style={{ gap: 6 }}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>Tehlike sınıfı *</Text>
              <Chips<HazardClass>
                value={d.hazard}
                onChange={(v) => set('hazard', v)}
                options={[
                  { value: 'az', label: 'Az tehlikeli' },
                  { value: 'tehlikeli', label: 'Tehlikeli' },
                  { value: 'cok', label: 'Çok tehlikeli' },
                ]}
              />
            </View>
            <Field label="SGK işyeri sicil no" value={d.sgkNo} onChangeText={(v) => set('sgkNo', v)} placeholder="4.xxxx.01.01.xxxxxxx.xxx.01-xx" />
          </Card>
        </Column>
        <Column>
          <SectionHeader title="İSG hizmeti" />
          <Card style={{ gap: spacing.lg }}>
            <SelectField label="İSG uzmanı *" value={d.specialistId || undefined} options={staff('specialist')} onChange={(v) => set('specialistId', v ?? '')} error={errors.specialistId} />
            <SelectField label="İşyeri hekimi *" value={d.physicianId || undefined} options={staff('physician')} onChange={(v) => set('physicianId', v ?? '')} error={errors.physicianId} />
            {d.hazard === 'cok' && (
              <SelectField label="Diğer sağlık personeli (DSP)" optional value={d.dspId} options={staff('dsp')} onChange={(v) => set('dspId', v)} />
            )}
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <View style={{ flex: 1 }}>
                <DateField label="Sözleşme başlangıcı *" value={d.contractStart} onChange={(iso) => set('contractStart', iso ?? '')} error={errors.contractStart} />
              </View>
              <View style={{ flex: 1 }}>
                <DateField label="Sözleşme bitişi *" value={d.contractEnd} onChange={(iso) => set('contractEnd', iso ?? '')} error={errors.contractEnd} />
              </View>
            </View>
            {!existing && (
              <Text style={{ color: colors.textDim, fontSize: 12.5, lineHeight: 18 }}>
                Kaydedilince İSG-KATİP sözleşme bildirimi “bekliyor” olarak oluşturulur; İSG-KATİP ekranından gönderebilirsiniz.
              </Text>
            )}
          </Card>
          <FormError message={formError} />
          <FormActions saveLabel={existing ? 'Değişiklikleri kaydet' : 'Firmayı oluştur'} onSave={save} onDelete={existing ? () => setConfirm(true) : undefined} deleteLabel="Firmayı sil" />
        </Column>
      </Columns>

      {existing && impact && (
        <BottomSheet
          visible={confirm}
          onClose={() => setConfirm(false)}
          title="Firma silinsin mi?"
          subtitle={`${existing.name} ile birlikte ${impact.people} personel, ${impact.asg} eğitim ataması ve ${impact.certs} sertifika kalıcı olarak silinecek.`}
        >
          <View style={{ gap: spacing.sm }}>
            <Button
              title="Kalıcı olarak sil"
              icon="trash-outline"
              onPress={() => {
                actions.deleteFirms([existing.id]);
                setConfirm(false);
                router.replace('/firms');
              }}
            />
            <Button title="Vazgeç" variant="outline" onPress={() => setConfirm(false)} />
          </View>
        </BottomSheet>
      )}
    </Screen>
  );
}

function Err({ t }: { t: string }) {
  return <Text style={{ color: colors.danger, fontSize: 12.5, marginTop: -8 }}>{t}</Text>;
}
