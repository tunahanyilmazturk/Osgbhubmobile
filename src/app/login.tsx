import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
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
  useWindowDimensions,
  type TextInputInstance,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/BrandMark';
import { LoginBrandPanel } from '@/components/LoginBrandPanel';
import { Button } from '@/components/ui/Button';
import { SegmentedControl, type Segment } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/ui/TextField';
import { useLayout } from '@/lib/responsive';
import { useSession } from '@/lib/session';
import { DEMO_PARTICIPANT } from '@/data/seed';
import { AuthError, signIn, signInParticipant, validateLogin } from '@/lib/auth';
import { colors, font, radius, spacing } from '@/theme';

type Mode = 'staff' | 'participant';

const MODES: Segment<Mode>[] = [
  { value: 'staff', label: 'OSGB personeli', icon: 'briefcase-outline' },
  { value: 'participant', label: 'Katılımcı', icon: 'school-outline' },
];

const DEMO_STAFF = { email: 'demo@osgbhub.com', password: 'demo1234' };

const haptic = (type: 'light' | 'success' | 'error') => {
  if (Platform.OS === 'web') return;
  if (type === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  else
    Haptics.notificationAsync(
      type === 'success' ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error,
    );
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  // Dar ekranlarda (≤ 390pt) başlık tek satıra sığsın
  const { width, height } = useWindowDimensions();
  const compact = width < 400;
  // Kısa ekranlarda (eski iPhone'lar, Safari araç çubukları açık) boşlukları daralt
  const short = height < 700;
  // Bilgisayar: solda marka paneli, sağda form
  const { isDesktop } = useLayout();
  const passwordRef = useRef<TextInputInstance>(null);

  const [mode, setMode] = useState<Mode>('staff');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'form' | Mode | null>(null);
  const { setUser } = useSession();

  // Giriş animasyonu
  const enter = useState(() => new Animated.Value(0))[0];
  const glow = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    const enterAnim = Animated.timing(enter, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 3200, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 3200, useNativeDriver: true }),
      ]),
    );
    enterAnim.start();
    glowAnim.start();
    return () => {
      enterAnim.stop();
      glowAnim.stop();
    };
  }, [enter, glow]);

  const rise = (offset: number) => ({
    opacity: enter,
    transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [offset, 0] }) }],
  });

  const login = async (input: { email: string; password: string }, as: Mode, source: 'form' | Mode) => {
    setFormError(null);
    setLoading(source);
    try {
      if (as === 'participant') {
        const p = await signInParticipant(input.email, input.password);
        haptic('success');
        setUser({ name: p.name, email: p.account!.email, role: 'participant', participantId: p.id }, remember);
        router.replace('/my-trainings');
      } else {
        const user = await signIn({ ...input, email: input.email.trim(), role: 'admin', remember });
        haptic('success');
        setUser({ name: user.name, email: input.email.trim(), role: user.role }, remember);
        router.replace('/dashboard');
      }
    } catch (e) {
      haptic('error');
      setFormError(e instanceof AuthError ? e.message : 'Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setLoading(null);
    }
  };

  const onSubmit = () => {
    const v = validateLogin({ email, password });
    setErrors(v);
    if (v.email || v.password) {
      haptic('error');
      return;
    }
    login({ email, password }, mode, 'form');
  };

  /** Demo hesapları: alanları doldurur ve doğrudan giriş yapar */
  const onDemo = (as: Mode) => {
    haptic('light');
    const demo = as === 'staff' ? DEMO_STAFF : DEMO_PARTICIPANT;
    setErrors({});
    setMode(as);
    setEmail(demo.email);
    setPassword(demo.password);
    login(demo, as, as);
  };

  return (
    <View style={[styles.root, isDesktop && { flexDirection: 'row' }]}>
      {isDesktop && <LoginBrandPanel />}

      {/* Arka plan ışımaları (telefon) */}
      {!isDesktop && (
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
      )}
      {!isDesktop && (
        <View pointerEvents="none" style={styles.stripes}>
          {Array.from({ length: 7 }).map((_, i) => (
            <View key={i} style={styles.stripe} />
          ))}
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.lg },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.container,
              short && { gap: spacing.lg },
              isDesktop && { justifyContent: 'center', maxWidth: 420 },
            ]}
          >
            {!isDesktop && (
              <Animated.View style={rise(-12)}>
                <BrandMark />
              </Animated.View>
            )}

            <Animated.View style={[styles.hero, rise(16)]}>
              <Text style={[styles.title, compact && { fontSize: 27, lineHeight: 32 }]}>
                Tekrar hoş geldiniz<Text style={{ color: colors.amber }}>.</Text>
              </Text>
              {!short && <Text style={styles.subtitle}>Firmalar, eğitimler ve sertifikalar tek yerde.</Text>}
            </Animated.View>

            <Animated.View style={[styles.card, short && { gap: spacing.md, padding: spacing.lg }, rise(28)]}>
              <>
                <View style={{ gap: spacing.sm }}>
                  <Text style={styles.sectionLabel}>Giriş türü</Text>
                  <SegmentedControl
                    segments={MODES}
                    value={mode}
                    onChange={(m) => {
                      haptic('light');
                      setFormError(null);
                      setMode(m);
                    }}
                  />
                </View>

                <TextField
                  label="E-posta"
                  icon="mail-outline"
                  placeholder={mode === 'staff' ? 'ornek@osgb.com.tr' : 'ad.soyad@firma.com.tr'}
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

                <View style={{ gap: spacing.md }}>
                  <Button
                    title="Giriş yap"
                    icon="arrow-forward"
                    loading={loading === 'form'}
                    disabled={!!loading && loading !== 'form'}
                    onPress={onSubmit}
                  />
                  <View style={styles.demoRow}>
                    <View style={{ flex: 1 }}>
                      <Button
                        title="Demo yönetici"
                        variant="outline"
                        compact
                        icon="briefcase-outline"
                        loading={loading === 'staff'}
                        disabled={!!loading && loading !== 'staff'}
                        onPress={() => onDemo('staff')}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        title="Demo katılımcı"
                        variant="outline"
                        compact
                        icon="school-outline"
                        loading={loading === 'participant'}
                        disabled={!!loading && loading !== 'participant'}
                        onPress={() => onDemo('participant')}
                      />
                    </View>
                  </View>
                </View>
              </>
            </Animated.View>

            <Animated.View style={[styles.footer, isDesktop && { marginTop: 0 }, rise(36)]}>
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
    gap: spacing.xl,
  },

  hero: { gap: 6 },
  title: {
    color: colors.white,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: font.heavy,
    letterSpacing: -1.2,
  },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 21 },

  card: {
    gap: spacing.lg,
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
  demoRow: { flexDirection: 'row', gap: spacing.sm },
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

  footer: { alignItems: 'center', marginTop: 'auto' },
  secure: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  secureText: { color: colors.textDim, fontSize: 12, letterSpacing: 0.3 },
});
