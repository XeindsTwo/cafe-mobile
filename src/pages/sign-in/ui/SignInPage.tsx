import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../features/auth/model/AuthProvider';
import { telegramSupported } from '../../../features/auth/model/telegram';
import { AuthError } from '../../../features/auth/api/authApi';
import { colors } from '../../../shared/ui/theme';
import { Text } from '../../../shared/ui/typography';

export function SignInPage() {
  const router = useRouter();
  const { state, signIn, restore, signOut } = useAuth();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const leave = () => router.canGoBack() ? router.back() : router.replace('/profile');
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => lock.current);
    return () => subscription.remove();
  }, []));

  const run = async (action: () => Promise<void>) => {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (failure) {
      setError(failure instanceof AuthError ? failure.message : 'Не удалось завершить вход. Попробуйте снова.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  };

  const disabled = busy || state.status === 'loading' || (!telegramSupported && state.status !== 'ready');
  const title = state.status === 'ready' ? 'Вы вошли в аккаунт' : 'Вход в аккаунт';
  const actionLabel = state.status === 'ready' ? 'Продолжить' : state.status === 'error' ? 'Восстановить вход' : 'Продолжить с Telegram';
  const proceed = () => {
    if (state.status === 'ready') leave();
    else if (state.status === 'error') void run(restore);
    else void run(async () => { if (await signIn()) leave(); });
  };
  const notice = error || (state.status === 'error' ? state.message : !telegramSupported && state.status !== 'ready'
    ? 'Вход через Telegram доступен в установленной сборке приложения.' : '');

  return <SafeAreaView style={styles.root}>
    <Stack.Screen options={{ gestureEnabled: !busy }} />
    <View style={styles.header}>
      <Pressable onPress={leave} disabled={busy} accessibilityRole="button" accessibilityLabel="Назад" style={styles.back}>
        <Ionicons name="arrow-back" size={23} color={colors.ink} />
      </Pressable>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.icon}><Ionicons name="person-outline" size={38} color={colors.primary} /></View>
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        <Text style={styles.body}>{state.status === 'ready'
          ? state.account.first_name
          : 'Подтвердите номер телефона в Telegram. При первом входе мы создадим аккаунт.'}</Text>
      </View>
      <Pressable disabled={disabled} onPress={proceed} accessibilityRole="button"
        accessibilityState={{ disabled, busy }} style={[styles.primary, disabled && styles.disabled]}>
        {busy || state.status === 'loading' ? <ActivityIndicator color="white" /> : <Ionicons name="paper-plane-outline" size={21} color="white" />}
        <Text style={styles.primaryText}>{actionLabel}</Text>
      </Pressable>
      {!!notice && <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text>}
      {state.status === 'error' && <Pressable disabled={busy} onPress={() => void run(signOut)} accessibilityRole="button" style={styles.secondary}>
        <Text style={styles.secondaryText}>Войти в другой аккаунт</Text>
      </Pressable>}
      {state.status !== 'ready' && <Pressable disabled={busy} onPress={leave} accessibilityRole="button" style={styles.secondary}>
        <Text style={styles.secondaryText}>Продолжить без входа</Text>
      </Pressable>}
    </ScrollView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: { paddingHorizontal: 16, minHeight: 56, justifyContent: 'center' },
  back: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingBottom: 48 },
  hero: { paddingVertical: 28, paddingHorizontal: 22, borderRadius: 26, backgroundColor: colors.sage, gap: 14 },
  icon: { width: 68, height: 68, borderRadius: 22, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 30, lineHeight: 36, color: colors.ink, fontWeight: '800' },
  body: { fontSize: 15, lineHeight: 23, color: colors.ink },
  primary: { minHeight: 56, borderRadius: 15, backgroundColor: colors.primary, marginTop: 20, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'center' },
  disabled: { opacity: .5 },
  primaryText: { color: 'white', fontSize: 15, fontWeight: '700' },
  secondary: { minHeight: 48, padding: 8, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  secondaryText: { color: colors.primary, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  notice: { color: colors.ink, fontSize: 13, lineHeight: 19, padding: 14, borderRadius: 13, backgroundColor: colors.accentSoft, marginTop: 12 },
});
