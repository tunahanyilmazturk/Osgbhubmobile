import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Share, StyleSheet, Text } from 'react-native';

import { CertificateCard } from '@/components/CertificateCard';
import { CertPill } from '@/components/domain';
import { Button } from '@/components/ui/Button';
import { Card, EmptyState, Screen, ScreenHeader } from '@/components/ui/kit';
import { useLookups } from '@/data/store';
import { formatDate } from '@/lib/format';
import { useParticipant } from '@/lib/portal';
import { colors, spacing } from '@/theme';

const STATUS_TEXT = {
  pending: 'Eğitiminizi tamamladınız. Sertifikanız eğitim sorumlunuzun onayını bekliyor.',
  approved: 'Sertifikanız onaylandı. E-imza ile imzalandıktan sonra geçerli olacak.',
  signed: 'Sertifikanız e-imzalı ve geçerlidir.',
  rejected: 'Sertifikanız reddedildi.',
} as const;

export default function MyCertificate() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { certificates } = useParticipant();
  const L = useLookups();
  const c = certificates.find((x) => x.id === id);

  if (!c) {
    return (
      <Screen header={<ScreenHeader title="Sertifika" />}>
        <EmptyState icon="ribbon" title="Sertifika bulunamadı" />
      </Screen>
    );
  }
  const t = L.training(c.trainingId);

  return (
    <Screen header={<ScreenHeader title="Sertifika" subtitle={c.no} />}>
      <CertificateCard cert={c} />
      <CertPill cert={c} />
      <Card style={styles.info}>
        <Ionicons name={c.status === 'signed' ? 'shield-checkmark' : 'time-outline'} size={20} color={colors.amber} />
        <Text style={styles.text}>{STATUS_TEXT[c.status]}</Text>
      </Card>
      {c.status === 'signed' && (
        <Button
          title="Paylaş"
          variant="outline"
          icon="share-outline"
          onPress={() =>
            Share.share({ message: `${t?.title} sertifikası (${c.no}), geçerlilik: ${formatDate(c.expiryDate)}` })
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  info: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  text: { flex: 1, color: colors.text, fontSize: 14, lineHeight: 20 },
});
