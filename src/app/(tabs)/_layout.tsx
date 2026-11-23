import { Tabs } from 'expo-router';

export default function MainTabs() {
  return <Tabs tabBar={() => null} detachInactiveScreens={false} screenOptions={{
    headerShown: false,
    lazy: true,
    animation: 'shift',
    transitionSpec: { animation: 'timing', config: { duration: 260 } },
  }}>
    <Tabs.Screen name="index" />
    <Tabs.Screen name="menu" />
    <Tabs.Screen name="orders" />
    <Tabs.Screen name="profile" />
  </Tabs>;
}
