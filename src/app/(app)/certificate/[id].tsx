import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Share, StyleSheet, Text, View } from 'react-native';

import { CertPill } from '@/components/domain';
import { Button } from '@/components/ui/Button';
import { Card, EmptyState, Screen, ScreenHeader, SectionHeader } from '@/components/ui/kit';
import { actions, certHealth, useAppState, useLookups } from '@/data/store';
import { formatDate, remainingText } from '@/lib/format';
import { displayName, useSession } from '@/lib/session';
import { colors, font, radius, spacing } from '@/theme';

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
  const firm = L.firm(c.firmId);
  const trainer = L.member(c.trainerId);
  const health = certHealth(c);
  const me = user ? displayName(user.name) : 'Kullanıcı';

  const steps = [
    { label: 'Eğitim tamamlandı', sub: formatDate(c.issueDate), done: true },
    {
      label: c.status === 'rejected' ? 'Reddedildi' : 'Onaylandı',
      sub: c.status === 'rejected' ? c.rejectReason : c.approvedBy ? `${c.approvedBy} · ${formatDate(c.approvedAt!)}` : 'Onay bekliyor',
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
      {/* Sertifika görseli */}
      <LinearGradient
        colors={['#1C1810', '#121214', '#0E0E10']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cert}
      >
        <View style={styles.certInner}>
          <View style={styles.certHead}>
            <View style={styles.seal}>
              <Ionicons name="shield-checkmark" size={20} color={colors.onAmber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.certBrand}>
                OSGB<Text style={{ color: colors.amber }}>Hub</Text>
              </Text>
              <Text style={styles.certKicker}>EĞİTİM SERTİFİKASI</Text>
            </View>
            <Ionicons name="qr-code" size={40} color={colors.textMuted} accessibilityLabel="Doğrulama QR kodu" />
          </View>

          <Text style={styles.certSmall}>Bu belge</Text>
          <Text style={styles.certName}>{p?.name}</Text>
          <Text style={styles.certSmall}>
            adlı katılımcının {firm?.name} bünyesinde aşağıdaki eğitimi başarıyla tamamladığını gösterir.
          </Text>

          <View style={styles.certTraining}>
            <Text style={styles.certTrainingTitle}>{t?.title}</Text>
            <Text style={styles.certSmall}>
              {t?.hours} saat · {t?.mode}
            </Text>
          </View>

          <View style={styles.certGrid}>
            <Field label="Düzenlenme" value={formatDate(c.issueDate)} />
            <Field label="Geçerlilik" value={formatDate(c.expiryDate)} />
            <Field label="Eğitmen" value={trainer?.name ?? '-'} />
            <Field label="Sertifika no" value={c.no} />
          </View>

          {c.status === 'signed' ? (
            <View style={styles.signed}>
              <Ionicons name="finger-print" size={16} color={colors.amber} />
              <Text style={styles.signedText}>
                E-imzalı · {c.signedBy} · {formatDate(c.signedAt!)}
              </Text>
            </View>
          ) : (
            <View style={[styles.signed, { borderColor: colors.border }]}>
              <Ionicons name="time-outline" size={16} color={colors.textDim} />
              <Text style={[styles.signedText, { color: colors.textDim }]}>Henüz imzalanmadı — taslak</Text>
            </View>
          )}
        </View>
      </LinearGradient>

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
                {st.done && <Ionicons name={st.error ? 'close' : 'checkmark'} size={12} color={colors.onAmber} />}
              </View>
              {i < steps.length - 1 && <View style={[styles.rail, st.done && !st.error && { backgroundColor: colors.amberDeep }]} />}
            </View>
            <View style={{ flex: 1, paddingBottom: i < steps.length - 1 ? spacing.lg : 0 }}>
              <Text style={[styles.stepLabel, !st.done && { color: colors.textMuted }]}>{st.label}</Text>
              <Text style={styles.dim}>{st.sub}</Text>
            </View>
          </View>
        ))}
      </Card>

      {c.status === 'pending' && (
        <View style={{ gap: spacing.sm }}>
          <Button title="Onayla" icon="checkmark-done" onPress={() => actions.approveCertificates([c.id], me)} />
          <Button title="Onay ekranına git" variant="outline" icon="list" onPress={() => router.push('/approvals')} />
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

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: '50%', paddingVertical: 6, paddingRight: 8 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cert: { borderRadius: radius.xl, padding: 6, borderWidth: 1, borderColor: 'rgba(255,176,32,0.4)' },
  certInner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,176,32,0.18)',
    padding: spacing.xl,
    gap: spacing.sm,
  },
  certHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  seal: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certBrand: { color: colors.white, fontSize: 16, fontWeight: font.heavy },
  certKicker: { color: colors.amber, fontSize: 10.5, fontWeight: font.bold, letterSpacing: 1.6 },
  certSmall: { color: colors.textMuted, fontSize: 12.5, lineHeight: 18 },
  certName: { color: colors.white, fontSize: 26, fontWeight: font.heavy, letterSpacing: -0.6 },
  certTraining: {
    marginVertical: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  certTrainingTitle: { color: colors.amber, fontSize: 17, fontWeight: font.bold },
  certGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  fieldLabel: { color: colors.textDim, fontSize: 11, fontWeight: font.semibold, letterSpacing: 0.3 },
  fieldValue: { color: colors.text, fontSize: 13.5, fontWeight: font.semibold, marginTop: 2 },
  signed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,176,32,0.35)',
  },
  signedText: { flex: 1, color: colors.amber, fontSize: 12.5, fontWeight: font.semibold },
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
