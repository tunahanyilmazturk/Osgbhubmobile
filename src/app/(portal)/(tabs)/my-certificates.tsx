import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { CertPill } from '@/components/domain';
import { EmptyState, IconTile, Row, Screen, ScreenHeader, type IconName } from '@/components/ui/kit';
import { certHealth, useLookups } from '@/data/store';
import { formatDate, remainingText } from '@/lib/format';
import { useParticipant } from '@/lib/portal';
import { colors, spacing } from '@/theme';

export default function MyCertificates() {
  const { certificates } = useParticipant();
  const L = useLookups();

  return (
    <Screen tabBar header={<ScreenHeader title="Sertifikalarım" subtitle={`${certificates.length} sertifika`} back={false} large />}>
      {certificates.length === 0 ? (
        <EmptyState icon="ribbon" title="Henüz sertifikanız yok" text="Eğitimlerinizi tamamladığınızda sertifikalarınız burada görünür." />
      ) : (
        certificates.map((c) => {
          const t = L.training(c.trainingId);
          const h = certHealth(c);
          const dateText =
            h === 'valid' || h === 'expiring' || h === 'expired'
              ? `Geçerlilik: ${formatDate(c.expiryDate)} (${remainingText(c.expiryDate)})`
              : `Tamamlandı: ${formatDate(c.issueDate)}`;
          return (
            <Row
              key={c.id}
              onPress={() => router.push(`/my-certificate/${c.id}`)}
              left={<IconTile icon={(t?.icon as IconName) ?? 'ribbon'} tone="amber" size={44} />}
              title={t?.title ?? ''}
              subtitle={c.no}
              meta={
                <View style={{ gap: 4, marginTop: 4 }}>
                  <CertPill cert={c} />
                  <Text style={{ color: colors.textDim, fontSize: 12 }}>{dateText}</Text>
                </View>
              }
            />
          );
        })
      )}
      <View style={{ height: spacing.sm }} />
    </Screen>
  );
}
