import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Share, StyleSheet, Text, View } from 'react-native';

import { CertificateCard } from '@/components/CertificateCard';
import { CertPill } from '@/components/domain';
import { Button } from '@/components/ui/Button';
import { Card, EmptyState, Screen, ScreenHeader, SectionHeader } from '@/components/ui/kit';
import { actions, certHealth, useAppState, useLookups } from '@/data/store';
import { formatDate, remainingText } from '@/lib/format';
import { displayName, useSession } from '@/lib/session';
import { colors, font, spacing } from '@/theme';

export default function CertificateDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useAppState();
  const L = useLookups();
  const { user } = useSession();
  const c = s.certificates.find((x) => x.id === id);

  if (!c) {
    return (
      <Screen header={<ScreenHeader title="Sertifika" />}>
        <EmptyState icon="ribbon" title="Sertifika bulunamadı" />
      </Screen>
    );
  }

  const p = L.participant(c.participantId);
  const t = L.training(c.trainingId);
  const health = certHealth(c);
  const me = user ? displayName(user.name) : 'Kullanıcı';

  const steps = [
    { label: 'Eğitim tamamlandı', sub: formatDate(c.issueDate), done: true },
    {
      label: c.status === 'rejected' ? 'Reddedildi' : 'Onaylandı',
      sub:
        c.status === 'rejected'
          ? c.rejectReason
          : c.approvedBy
            ? `${c.approvedBy} · ${formatDate(c.approvedAt!)}`
            : 'Onay bekliyor',
      done: c.status !== 'pending',
      error: c.status === 'rejected',
    },
    {
      label: 'E-imzalandı',
      sub: c.signedBy ? `${c.signedBy} · ${formatDate(c.signedAt!)}` : 'İmza bekliyor',
      done: c.status === 'signed',
    },
  ];

  return (
    <Screen header={<ScreenHeader title="Sertifika" subtitle={c.no} />}>
      <CertificateCard cert={c} />

      <View style={styles.statusRow}>
        <CertPill cert={c} />
        {(health === 'valid' || health === 'expiring' || health === 'expired') && (
          <Text style={styles.dim}>{remainingText(c.expiryDate)}</Text>
        )}
      </View>

      {/* Süreç */}
      <SectionHeader title="Süreç" />
      <Card style={{ gap: 0 }}>
        {steps.map((st, i) => (
          <View key={st.label} style={styles.step}>
            <View style={{ alignItems: 'center' }}>
              <View
                style={[
                  styles.node,
                  st.done && { backgroundColor: colors.amber, borderColor: colors.amber },
                  st.error && { backgroundColor: colors.danger, borderColor: colors.danger },
                ]}
              >
                {st.done && (
                  <Ionicons name={st.error ? 'close' : 'checkmark'} size={12} color={colors.onAmber} />
                )}
              </View>
              {i < steps.length - 1 && (
                <View style={[styles.rail, st.done && !st.error && { backgroundColor: colors.amberDeep }]} />
              )}
            </View>
            <View style={{ flex: 1, paddingBottom: i < steps.length - 1 ? spacing.lg : 0 }}>
              <Text style={[styles.stepLabel, !st.done && { color: colors.textMuted }]}>{st.label}</Text>
              <Text style={styles.dim}>{st.sub}</Text>
            </View>
          </View>
        ))}
      </Card>

      {c.enrollmentId && (
        <Button
          title="Online eğitimi incele (sınavlar, ilerleme)"
          variant="outline"
          icon="analytics-outline"
          onPress={() => router.push(`/enrollment/${c.enrollmentId}`)}
        />
      )}
      {c.status === 'pending' && (
        <View style={{ gap: spacing.sm }}>
          <Button
            title="Onayla"
            icon="checkmark-done"
            onPress={() => actions.approveCertificates([c.id], me)}
          />
          <Button
            title="Onay ekranına git"
            variant="outline"
            icon="list"
            onPress={() => router.push('/approvals')}
          />
        </View>
      )}
      {c.status === 'approved' && (
        <Button title="E-imza ile imzala" icon="finger-print" onPress={() => router.push('/e-signature')} />
      )}
      {c.status === 'signed' && (
        <Button
          title="Paylaş"
          variant="outline"
          icon="share-outline"
          onPress={() =>
            Share.share({
              message: `${p?.name} — ${t?.title} sertifikası (${c.no}), geçerlilik: ${formatDate(c.expiryDate)}`,
            })
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dim: { color: colors.textDim, fontSize: 12.5, marginTop: 1 },
  step: { flexDirection: 'row', gap: spacing.md },
  node: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rail: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
  stepLabel: { color: colors.text, fontSize: 14.5, fontWeight: font.semibold },
});
