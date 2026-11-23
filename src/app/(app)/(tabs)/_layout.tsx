import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { useLayout } from '@/lib/responsive';
import { colors } from '@/theme';

export default function TabsLayout() {
  const { isDesktop } = useLayout();
  return (
    <Tabs
      // Bilgisayarda gezinme kenar menüden yapılır
      tabBar={(props) => (isDesktop ? null : <TabBar {...props} />)}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        animation: isDesktop ? 'none' : 'shift',
      }}
    >
      <Tabs.Screen name="dashboard" />
      <Tabs.Screen name="firms" />
      <Tabs.Screen name="trainings" />
      <Tabs.Screen name="more" />
    </Tabs>
  );
}
