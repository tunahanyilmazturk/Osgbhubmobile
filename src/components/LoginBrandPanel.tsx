import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/BrandMark';
import type { IconName } from '@/components/ui/kit';
import { colors, font, radius, spacing } from '@/theme';

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'business', title: 'Firma ve personel', text: 'Tehlike sınıfı, sözleşme ve çalışan takibi' },
  { icon: 'school', title: 'Eğitim ve sertifika', text: 'Atama, yoklama, onay ve geçerlilik takibi' },
  { icon: 'finger-print', title: 'E-imza', text: 'Sertifika ve belgeleri toplu imzalama' },
  { icon: 'sync', title: 'İSG-KATİP', text: 'Sözleşme ve görevlendirme uyum kontrolü' },
];

/** Bilgisayar görünümünde giriş sayfasının sol paneli */
export function LoginBrandPanel() {
  return (
    <LinearGradient
      colors={[colors.panelA, colors.panelB, colors.bg]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.root}
    >
      {/* İş güvenliği şeridi motifi */}
      <View pointerEvents="none" style={styles.stripes}>
        {Array.from({ length: 9 }).map((_, i) => (
          <View key={i} style={styles.stripe} />
        ))}
      </View>

      <BrandMark />

      <View style={{ gap: spacing.xxl, maxWidth: 520 }}>
        <View style={{ gap: spacing.md }}>
          <Text style={styles.headline}>
            İSG süreçleriniz{'\n'}
            <Text style={{ color: colors.amber }}>tek panelde.</Text>
          </Text>
          <Text style={styles.lead}>
            Firmalar, eğitimler, e-imzalı sertifikalar ve İSG-KATİP uyumu için modern operasyon merkezi.
          </Text>
        </View>
        <View style={{ gap: spacing.sm + 2 }}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={20} color={colors.amber} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <View style={styles.badges}>
          {['6331 Sayılı Kanun', 'İSG-KATİP', '5070 E-İmza'].map((b) => (
            <View key={b} style={styles.badge}>
              <View style={styles.badgeDot} />
              <Text style={styles.badgeText}>{b}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.copy}>© {new Date().getFullYear()} OSGB Hub</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1.1,
    justifyContent: 'space-between',
    padding: 56,
    overflow: 'hidden',
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  stripes: {
    position: 'absolute',
    right: -120,
    bottom: -60,
    flexDirection: 'row',
    gap: 22,
    opacity: 0.06,
    transform: [{ rotate: '-35deg' }],
  },
  stripe: { width: 22, height: 520, backgroundColor: colors.amber, borderRadius: 2 },
  headline: { color: colors.white, fontSize: 48, lineHeight: 54, fontWeight: font.heavy, letterSpacing: -1.6 },
  lead: { color: colors.textMuted, fontSize: 15.5, lineHeight: 23, maxWidth: 440 },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: colors.amberBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: { color: colors.white, fontSize: 15, fontWeight: font.bold },
  featureText: { color: colors.textMuted, fontSize: 13.5, marginTop: 2 },
  footer: { gap: spacing.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.amber },
  badgeText: { color: colors.textMuted, fontSize: 11.5, fontWeight: font.semibold },
  copy: { color: colors.textDim, fontSize: 12.5 },
});
