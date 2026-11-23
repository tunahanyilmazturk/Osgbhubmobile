import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/BrandMark';
import { Button } from '@/components/ui/Button';
import { SegmentedControl, type Segment } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { AuthError, signIn, validateLogin, type UserRole } from '@/lib/auth';
import { colors, font, radius, spacing } from '@/theme';

const ROLES: Segment<UserRole>[] = [
  { value: 'admin', label: 'Yönetici', icon: 'briefcase-outline' },
  { value: 'specialist', label: 'İSG Uzmanı', icon: 'construct-outline' },
  { value: 'physician', label: 'Hekim', icon: 'medkit-outline' },
];

const haptic = (type: 'light' | 'success' | 'error') => {
  if (Platform.OS === 'web') return;
  if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else
    Haptics.notificationAsync(
      type === 'success'
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Error,
    );
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInputInstance>(null);

  const [role, setRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [welcome, setWelcome] = useState<string | null>(null);

  // Giriş animasyonu
  const enter = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 3200, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 3200, useNativeDriver: true }),
      ]),
    ).start();
  }, [enter, glow]);

  const rise = (offset: number) => ({
    opacity: enter,
    transform: [
      { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) },
    ],
  });

  const onSubmit = async () => {
    setFormError(null);
    const v = validateLogin({ email, password });
    setErrors(v);
    if (v.email || v.password) {
      haptic('error');
      return;
    }
    setLoading(true);
    try {
      const user = await signIn({ email: email.trim(), password, role, remember });
      haptic('success');
      setWelcome(user.name);
    } catch (e) {
      haptic('error');
      setFormError(e instanceof AuthError ? e.message : 'Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Arka plan ışımaları */}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glowTop,
          { opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0.9] }) },
        ]}
      >
        <LinearGradient
          colors={[colors.amberGlow, 'rgba(255,176,32,0.06)', 'transparent']}
          start={{ x: 0.8, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <View pointerEvents="none" style={styles.stripes}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View key={i} style={styles.stripe} />
        ))}
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xxl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Animated.View style={rise(-12)}>
              <BrandMark />
            </Animated.View>

            <Animated.View style={[styles.hero, rise(16)]}>
              <View style={styles.badge}>
                <View style={styles.badgeDot} />
                <Text style={styles.badgeText}>Güvenli giriş</Text>
              </View>
              <Text style={styles.title}>
                Tekrar{'\n'}hoş geldiniz<Text style={{ color: colors.amber }}>.</Text>
              </Text>
              <Text style={styles.subtitle}>
                Firmalarınızı, saha denetimlerini ve sağlık takibini tek yerden yönetin.
              </Text>
            </Animated.View>

            <Animated.View style={[styles.card, rise(28)]}>
              {welcome ? (
                <View style={styles.success}>
                  <View style={styles.successIcon}>
                    <Ionicons name="checkmark" size={34} color={colors.onAmber} />
                  </View>
                  <Text style={styles.successTitle}>Giriş başarılı</Text>
                  <Text style={styles.successText}>
                    Hoş geldiniz, <Text style={{ color: colors.amber }}>{welcome}</Text>. Panel
                    ekranı bir sonraki adımda eklenecek.
                  </Text>
                  <Button
                    title="Geri dön"
                    variant="outline"
                    icon="arrow-back"
                    onPress={() => {
                      setWelcome(null);
                      setPassword('');
                    }}
                  />
                </View>
              ) : (
                <>
                  <View style={{ gap: spacing.sm }}>
                    <Text style={styles.sectionLabel}>Giriş türü</Text>
                    <SegmentedControl
                      segments={ROLES}
                      value={role}
                      onChange={(r) => {
                        haptic('light');
                        setRole(r);
                      }}
                    />
                  </View>

                  <TextField
                    label="E-posta"
                    icon="mail-outline"
                    placeholder="ornek@osgb.com.tr"
                    value={email}
                    onChangeText={(t) => {
                      setEmail(t);
                      if (errors.email) setErrors((e) => ({ ...e, email: undefined }));
                    }}
                    error={errors.email}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    returnKeyType="next"
                    onSubmitEditing={() => passwordRef.current?.focus()}
                    submitBehavior="submit"
                  />

                  <TextField
                    ref={passwordRef}
                    label="Şifre"
                    icon="lock-closed-outline"
                    placeholder="••••••••"
                    value={password}
                    onChangeText={(t) => {
                      setPassword(t);
                      if (errors.password) setErrors((e) => ({ ...e, password: undefined }));
                    }}
                    error={errors.password}
                    secureTextEntry
                    secureToggle
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="go"
                    onSubmitEditing={onSubmit}
                  />

                  <View style={styles.row}>
                    <Pressable
                      style={styles.remember}
                      onPress={() => setRemember((r) => !r)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: remember }}
                      hitSlop={8}
                    >
                      <View style={[styles.checkbox, remember && styles.checkboxOn]}>
                        {remember && <Ionicons name="checkmark" size={14} color={colors.onAmber} />}
                      </View>
                      <Text style={styles.rememberText}>Beni hatırla</Text>
                    </Pressable>
                    <Pressable hitSlop={8} accessibilityRole="link">
                      <Text style={styles.link}>Şifremi unuttum</Text>
                    </Pressable>
                  </View>

                  {formError && (
                    <View style={styles.formError}>
                      <Ionicons name="warning-outline" size={18} color={colors.danger} />
                      <Text style={styles.formErrorText}>{formError}</Text>
                    </View>
                  )}

                  <Button
                    title="Giriş yap"
                    icon="arrow-forward"
                    loading={loading}
                    onPress={onSubmit}
                  />

                  <View style={styles.divider}>
                    <View style={styles.line} />
                    <Text style={styles.dividerText}>veya</Text>
                    <View style={styles.line} />
                  </View>

                  <Button title="Biyometrik ile giriş" variant="outline" icon="finger-print" />
                </>
              )}
            </Animated.View>

            <Animated.View style={[styles.footer, rise(36)]}>
              <Text style={styles.footerText}>
                Hesabınız yok mu? <Text style={styles.link}>Demo talep edin</Text>
              </Text>
              <View style={styles.secure}>
                <Ionicons name="lock-closed" size={12} color={colors.textDim} />
                <Text style={styles.secureText}>256-bit SSL · KVKK uyumlu</Text>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  glowTop: {
    position: 'absolute',
    top: -160,
    right: -140,
    width: 520,
    height: 520,
    borderRadius: 260,
    overflow: 'hidden',
  },
  // İş güvenliği şeridi motifi (sağ üst)
  stripes: {
    position: 'absolute',
    top: 34,
    right: -60,
    flexDirection: 'row',
    gap: 14,
    opacity: 0.07,
    transform: [{ rotate: '-35deg' }],
  },
  stripe: { width: 14, height: 180, backgroundColor: colors.amber, borderRadius: 2 },

  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    gap: spacing.xxl,
  },

  hero: { gap: spacing.md, marginTop: spacing.lg },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.amberSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,176,32,0.25)',
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.amber },
  badgeText: { color: colors.amber, fontSize: 12, fontWeight: font.semibold, letterSpacing: 0.3 },
  title: {
    color: colors.white,
    fontSize: 38,
    lineHeight: 42,
    fontWeight: font.heavy,
    letterSpacing: -1.2,
  },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 22, maxWidth: 340 },

  card: {
    gap: spacing.xl,
    padding: spacing.xl,
    borderRadius: radius.xl,
    backgroundColor: colors.bgElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: font.medium,
    letterSpacing: 0.2,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  remember: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxOn: { backgroundColor: colors.amber, borderColor: colors.amber },
  rememberText: { color: colors.text, fontSize: 14, fontWeight: font.medium },
  link: { color: colors.amber, fontSize: 14, fontWeight: font.semibold },

  formError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: 'rgba(255,90,95,0.3)',
  },
  formErrorText: { flex: 1, color: colors.danger, fontSize: 13.5, fontWeight: font.medium },

  divider: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { color: colors.textDim, fontSize: 12, fontWeight: font.medium },

  success: { alignItems: 'stretch', gap: spacing.lg, paddingVertical: spacing.md },
  successIcon: {
    alignSelf: 'center',
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: font.bold,
    textAlign: 'center',
  },
  successText: { color: colors.textMuted, fontSize: 14.5, lineHeight: 21, textAlign: 'center' },

  footer: { alignItems: 'center', gap: spacing.md, marginTop: 'auto' },
  footerText: { color: colors.textMuted, fontSize: 14 },
  secure: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secureText: { color: colors.textDim, fontSize: 12, letterSpacing: 0.3 },
});
