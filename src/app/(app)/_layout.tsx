import { Stack } from 'expo-router';
import { View } from 'react-native';

import { Sidebar } from '@/components/Sidebar';
import { useLayout } from '@/lib/responsive';
import { colors } from '@/theme';

export default function AppLayout() {
  const { isDesktop } = useLayout();

  // Ağaç yapısı her genişlikte aynı kalır; pencere boyutu değişince ekranlar yeniden kurulmaz
  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: colors.bg }}>
      {isDesktop && <Sidebar />}
      <View style={{ flex: 1 }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: isDesktop ? 'fade' : 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen
            name="assignment/new"
            options={{
              presentation: isDesktop ? 'card' : 'modal',
              animation: isDesktop ? 'fade' : 'slide_from_bottom',
            }}
          />
        </Stack>
      </View>
    </View>
  );
}
