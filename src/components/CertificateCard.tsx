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
        {/* Resmi belge köşebentleri */}
        <View pointerEvents="none" style={[styles.corner, styles.cTL]} />
        <View pointerEvents="none" style={[styles.corner, styles.cTR]} />
        <View pointerEvents="none" style={[styles.corner, styles.cBL]} />
        <View pointerEvents="none" style={[styles.corner, styles.cBR]} />

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
          <View style={styles.qrBox}>
            <Ionicons
              name="qr-code"
              size={34}
              color={colors.text}
              accessibilityLabel="Doğrulama QR kodu"
            />
          </View>
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
  cert: {
    borderRadius: radius.xl,
    padding: 7,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    shadowColor: colors.amber,
    shadowOpacity: 0.14,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
  },
  certInner: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.amberSoft,
    padding: spacing.xl + 2,
    gap: spacing.sm,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderColor: colors.amber,
    opacity: 0.65,
  },
  cTL: { top: 8, left: 8, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 5 },
  cTR: { top: 8, right: 8, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 5 },
  cBL: { bottom: 8, left: 8, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 5 },
  cBR: { bottom: 8, right: 8, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 5 },
  certHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  seal: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certBrand: { color: colors.white, fontSize: 16, fontWeight: font.heavy },
  certKicker: { color: colors.amber, fontSize: 10.5, fontWeight: font.bold, letterSpacing: 1.6 },
  certSmall: { color: colors.textMuted, fontSize: 12.5, lineHeight: 18 },
  certName: { color: colors.white, fontSize: 27, fontWeight: font.heavy, letterSpacing: -0.7 },
  certTraining: {
    marginVertical: spacing.sm,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    gap: 3,
  },
  certTrainingTitle: { color: colors.amber, fontSize: 17.5, fontWeight: font.bold, letterSpacing: -0.2 },
  certGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  fieldLabel: { color: colors.textDim, fontSize: 11, fontWeight: font.semibold, letterSpacing: 0.4, textTransform: 'uppercase' },
  fieldValue: { color: colors.text, fontSize: 13.5, fontWeight: font.semibold, marginTop: 3, fontVariant: ['tabular-nums'] },
  signed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: colors.amberBorder,
  },
  signedText: { flex: 1, color: colors.amber, fontSize: 12.5, fontWeight: font.semibold },
});
