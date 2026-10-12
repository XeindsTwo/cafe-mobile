import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { SessionProvider } from '../widgets/app-shell/model/Session';
import { OnboardingPage } from '../pages/onboarding/ui/OnboardingPage';
import { colors } from '../shared/ui/theme';

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('../../assets/fonts/Inter-Regular.ttf'),
    'Inter-Medium': require('../../assets/fonts/Inter-Medium.ttf'),
    'Inter-SemiBold': require('../../assets/fonts/Inter-SemiBold.ttf'),
    'Inter-Bold': require('../../assets/fonts/Inter-Bold.ttf'),
  });
  const [ready, setReady] = useState(false);
  const [seen, setSeen] = useState(false);
  useEffect(() => { AsyncStorage.getItem('cafe:onboarding:v2').then(value => setSeen(value === 'done')).catch(() => setSeen(false)).finally(() => setReady(true)); }, []);
  const finish = () => { setSeen(true); void AsyncStorage.setItem('cafe:onboarding:v2', 'done'); };
  const resetAllData = async () => {
    await AsyncStorage.clear();
    setSeen(false);
  };
  if (fontError) throw fontError;
  return <SafeAreaProvider>
    {!ready || !fontsLoaded ? <View style={{ flex: 1, backgroundColor: colors.canvas }} /> : !seen ? <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}><OnboardingPage onFinish={finish} /></SafeAreaView> : <SessionProvider resetAllData={resetAllData}><Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 280 }} /></SessionProvider>}
  </SafeAreaProvider>;
}
