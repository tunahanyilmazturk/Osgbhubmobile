import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/TabBar';
import { useLayout } from '@/lib/responsive';
import { colors } from '@/theme';

export default function PortalTabsLayout() {
  const { isDesktop } = useLayout();
  return (
    <Tabs
      tabBar={(props) => (isDesktop ? null : <TabBar {...props} />)}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.bg },
        animation: isDesktop ? 'none' : 'shift',
      }}
    >
      <Tabs.Screen name="my-trainings" />
      <Tabs.Screen name="my-certificates" />
      <Tabs.Screen name="account" />
    </Tabs>
  );
}
