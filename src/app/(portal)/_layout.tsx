import { Stack } from 'expo-router';
import { View } from 'react-native';

import { Sidebar } from '@/components/Sidebar';
import { Topbar } from '@/components/Topbar';
import { useLayout } from '@/lib/responsive';
import { colors } from '@/theme';

/** Katılımcı (firma çalışanı) online eğitim portalı */
export default function PortalLayout() {
  const { isDesktop, isWide } = useLayout();
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      {isDesktop && <Sidebar variant="participant" />}
      <View style={{ flex: 1 }}>
        {isWide && <Topbar variant="participant" />}
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: isDesktop ? 'fade' : 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          {/* Sınav ve ders ekranlarında geri kaydırma ile yanlışlıkla çıkılmasın */}
          <Stack.Screen name="exam/[eid]/[kind]" options={{ gestureEnabled: false }} />
        </Stack>
      </View>
    </View>
  );
}
