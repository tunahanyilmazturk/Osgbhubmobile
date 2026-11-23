import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Fragment, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { QuickActionsSheet } from '@/components/QuickActionsSheet';
import { colors, font, radius } from '@/theme';

type IconName = keyof typeof Ionicons.glyphMap;

const TABS: Record<string, { label: string; icon: IconName; iconActive: IconName }> = {
  dashboard: { label: 'Panel', icon: 'grid-outline', iconActive: 'grid' },
  firms: { label: 'Firmalar', icon: 'business-outline', iconActive: 'business' },
  trainings: { label: 'Eğitimler', icon: 'school-outline', iconActive: 'school' },
  more: { label: 'Menü', icon: 'apps-outline', iconActive: 'apps' },
  // Katılımcı portalı
  'my-trainings': { label: 'Eğitimlerim', icon: 'school-outline', iconActive: 'school' },
  'my-certificates': { label: 'Sertifikalarım', icon: 'ribbon-outline', iconActive: 'ribbon' },
  account: { label: 'Hesabım', icon: 'person-outline', iconActive: 'person' },
};

/** Ortadaki hızlı işlem butonu bu sekmeden sonra yer alır */
const CENTER_AFTER = 'firms';

const tick = () => {
  if (Platform.OS !== 'web') Haptics.selectionAsync();
};

export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const [sheet, setSheet] = useState(false);

  return (
    <>
      <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.bar}>
          {state.routes.map((route, index) => {
            const meta = TABS[route.name];
            if (!meta) return null;
            const focused = state.index === index;

            const onPress = () => {
              tick();
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigateToTab(route.key);
            };

            return (
              <Fragment key={route.key}>
                <Pressable
                  onPress={onPress}
                  style={styles.tab}
                  accessibilityRole="tab"
                  accessibilityLabel={meta.label}
                  accessibilityState={{ selected: focused }}
                >
                  <View style={[styles.tabPill, focused && styles.tabPillActive]}>
                    <Ionicons
                      name={focused ? meta.iconActive : meta.icon}
                      size={21}
                      color={focused ? colors.amber : colors.textDim}
                    />
                  </View>
                  <Text style={[styles.label, { color: focused ? colors.amber : colors.textDim }]}>
                    {meta.label}
                  </Text>
                </Pressable>

                {route.name === CENTER_AFTER && (
                  <Pressable
                    onPress={() => {
                      tick();
                      setSheet(true);
                    }}
                    style={styles.centerSlot}
                    accessibilityRole="button"
                    accessibilityLabel="Hızlı işlemler"
                  >
                    <View style={styles.centerShadow}>
                      <LinearGradient
                        colors={[colors.amberLight, colors.amber, colors.amberDark]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.centerBtn}
                      >
                        <Ionicons name="flash" size={26} color={colors.onAmber} />
                      </LinearGradient>
                    </View>
                  </Pressable>
                )}
              </Fragment>
            );
          })}
        </View>
      </View>
      <QuickActionsSheet visible={sheet} onClose={() => setSheet(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 70,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    borderRadius: radius.xl,
    backgroundColor: colors.tabBarBg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
    ...(Platform.OS === 'web' ? { backdropFilter: 'blur(16px)' } : {}),
  } as object,
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, height: '100%' },
  tabPill: {
    width: 44,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabPillActive: {
    backgroundColor: colors.amberSoft,
  },
  label: { fontSize: 11, fontWeight: font.semibold },
  centerSlot: { flex: 1, alignItems: 'center' },
  centerShadow: {
    marginTop: -30,
    borderRadius: 30,
    shadowColor: colors.amber,
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  centerBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.bg,
  },
});
