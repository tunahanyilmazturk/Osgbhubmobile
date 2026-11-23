import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { useLookups } from '@/data/store';
import type { Certificate } from '@/data/types';
import { formatDate } from '@/lib/format';
import { colors, font, radius, spacing } from '@/theme';

/** Sertifika görseli: yönetici ve katılımcı ekranlarında ortak */
export function CertificateCard({ cert: c }: { cert: Certificate }) {
  const L = useLookups();
  const p = L.participant(c.participantId);
  const t = L.training(c.trainingId);
  const firm = L.firm(c.firmId);
  const trainer = L.member(c.trainerId);
  return (
    <LinearGradient
      colors={[colors.certA, colors.certB, colors.certC]}
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
          <Ionicons
            name="qr-code"
            size={40}
            color={colors.textMuted}
            accessibilityLabel="Doğrulama QR kodu"
          />
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
});
