import { router } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { DateField, FormActions, FormError, SelectField } from '@/components/ui/forms';
import { Card, Screen, ScreenHeader } from '@/components/ui/kit';
import { ROLE_LABEL, actions, useAppState } from '@/data/store';
import { daysFromNow } from '@/lib/format';
import { colors, spacing } from '@/theme';

/** Sistem dışında verilmiş bir eğitimin sertifikasını kaydetme */
export function CertificateForm() {
  const s = useAppState();
  const [participantId, setParticipantId] = useState<string>();
  const [trainingId, setTrainingId] = useState<string>();
  const [trainerId, setTrainerId] = useState<string>();
  const [issueDate, setIssueDate] = useState<string | null>(daysFromNow(0));
  const [error, setError] = useState<string | null>(null);
  const firmName = new Map(s.firms.map((f) => [f.id, f.name]));

  const save = () => {
    if (!participantId) return setError('Katılımcı seçin.');
    if (!trainingId) return setError('Eğitim seçin.');
    if (!trainerId) return setError('Eğitmeni seçin.');
    if (!issueDate) return setError('Eğitim tarihini GG.AA.YYYY biçiminde girin.');
    if (issueDate > daysFromNow(0)) return setError('Eğitim tarihi ileri bir tarih olamaz.');
    const id = actions.createCertificate({ participantId, trainingId, trainerId, issueDate });
    router.replace(`/certificate/${id}`);
  };

  return (
    <Screen header={<ScreenHeader title="Yeni sertifika" subtitle="Sistem dışında verilmiş eğitim" />}>
      <Card style={{ gap: spacing.lg }}>
        <SelectField
          label="Katılımcı *"
          value={participantId}
          options={s.participants.map((p) => ({ value: p.id, label: p.name, hint: `${firmName.get(p.firmId)} · ${p.title}` }))}
          onChange={setParticipantId}
        />
        <SelectField
          label="Eğitim *"
          value={trainingId}
          options={s.trainings.map((t) => ({ value: t.id, label: t.title, hint: `${t.hours} saat · ${t.validityMonths} ay geçerli` }))}
          onChange={setTrainingId}
        />
        <SelectField
          label="Eğitmen *"
          value={trainerId}
          options={s.team.filter((m) => m.role !== 'dsp').map((m) => ({ value: m.id, label: m.name, hint: ROLE_LABEL[m.role] }))}
          onChange={setTrainerId}
        />
        <DateField label="Eğitim tarihi *" value={issueDate ?? undefined} onChange={(iso) => setIssueDate(iso)} />
        <Text style={{ color: colors.textDim, fontSize: 12.5, lineHeight: 18 }}>
          Geçerlilik süresi eğitimin ayarından hesaplanır. Kayıt, diğer sertifikalar gibi onay ve e-imza sürecinden geçer.
        </Text>
      </Card>
      <FormError message={error} />
      <FormActions saveLabel="Sertifikayı kaydet" onSave={save} />
    </Screen>
  );
}
