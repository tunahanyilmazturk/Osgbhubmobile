import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { hydrateStore, useHydrated } from '@/data/store';
import { SessionProvider, useSession } from '@/lib/session';
import { colors } from '@/theme';

export default function RootLayout() {
  useEffect(() => {
    hydrateStore();
  }, []);

  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="light" />
        <RootNavigator />
      </SessionProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { user, ready } = useSession();
  const hydrated = useHydrated();

  // Kayıtlı veri ve oturum yüklenene kadar bekle (yanlış ekrana yönlenmesin)
  if (!ready || !hydrated) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.amber} />
      </View>
    );
  }

  const participant = user?.role === 'participant';

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" />
      </Stack.Protected>
      {/* OSGB personeli: yönetim paneli */}
      <Stack.Protected guard={!!user && !participant}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      {/* Firma çalışanı: online eğitim portalı */}
      <Stack.Protected guard={participant}>
        <Stack.Screen name="(portal)" />
      </Stack.Protected>
    </Stack>
  );
}
