import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../features/auth/model/AuthProvider';
import { Text } from '../../../shared/ui/typography';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../../shared/ui/theme';
import { AppModal } from '../../../shared/ui/modal/AppModal';
import { useSession } from '../../../widgets/app-shell/model/Session';

export function ProfilePage() {
  const router = useRouter();
  const { state, signOut } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState(false);
  const { resetAllData } = useSession();
  const logout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError(false);
    try { await signOut(); }
    catch { setLogoutError(true); }
    finally { setLoggingOut(false); }
  };

  const confirmReset = async () => {
    if (resetting) return;
    setResetting(true);
    setResetError(false);
    try { await signOut(); await resetAllData(); } catch { setResetError(true); setResetting(false); }
  };

  return <View style={styles.root}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><Text style={styles.title}>Профиль</Text></View>
      <Animated.View entering={FadeInDown.duration(320)} style={styles.hero}>
        <View style={styles.heroCopy}>
          {state.status === 'ready' ? <>
            <Text accessibilityRole="header" style={styles.heroTitle}>{[state.account.first_name, state.account.last_name].filter(Boolean).join(' ')}</Text>
            <Text style={styles.heroBody}>{state.account.phone}</Text>
          </> : <>
            <Text accessibilityRole="header" style={styles.heroTitle}>Ваш аккаунт</Text>
            <Text style={styles.heroBody}>Войдите через Telegram с подтверждённым номером телефона.</Text>
          </>}
        </View>
        <View style={styles.heroArt}><Ionicons name={state.status === 'ready' ? 'person-circle' : 'leaf'} size={58} color={colors.primary} /></View>
      </Animated.View>

      {state.status === 'loading' ? <ActivityIndicator style={styles.loader} color={colors.primary} accessibilityLabel="Проверяем вход" />
        : state.status === 'ready' ? <Pressable onPress={() => void logout()} disabled={loggingOut} accessibilityRole="button"
          accessibilityState={{ disabled: loggingOut, busy: loggingOut }} style={styles.guestButton}>
          <Ionicons name="log-out-outline" size={21} color={colors.primary} />
          <Text style={styles.guestText}>{loggingOut ? 'Выходим…' : 'Выйти из аккаунта'}</Text>
        </Pressable> : <Pressable onPress={() => router.push('/sign-in')} accessibilityRole="button" style={styles.button}>
          <Text style={styles.buttonText}>{state.status === 'error' ? 'Восстановить вход' : 'Войти или создать аккаунт'}</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </Pressable>}
      {logoutError && <Text accessibilityRole="alert" style={styles.resetError}>Не удалось выйти. Попробуйте снова.</Text>}
      <Pressable accessibilityRole="button" onPress={() => setResetOpen(true)} style={styles.resetRow}><Ionicons name="refresh-circle-outline" size={23} color="#A33636" /><Text style={styles.resetLabel}>Сбросить все данные</Text><Ionicons name="chevron-forward" size={19} color="#A33636" /></Pressable>
    </ScrollView>
    <AppModal visible={resetOpen} onClose={() => { if (!resetting) setResetOpen(false); }} variant="dialog" dismissible={!resetting}>
      <View style={styles.resetDialog}><View style={styles.resetIcon}><Ionicons name="trash-outline" size={27} color="#A33636" /></View><Text style={styles.resetTitle}>Сбросить данные?</Text><Text style={styles.resetBody}>Вы выйдете из аккаунта. Корзина, тестовые заказы и настройки на этом устройстве очистятся. При следующем входе откроется онбординг.</Text>{resetError && <Text style={styles.resetError}>Не удалось очистить данные. Попробуйте ещё раз.</Text>}<Pressable accessibilityRole="button" disabled={resetting} onPress={confirmReset} style={styles.resetConfirm}><Text style={styles.resetConfirmText}>{resetting ? 'Сбрасываем…' : 'Сбросить всё'}</Text></Pressable><Pressable accessibilityRole="button" disabled={resetting} onPress={() => setResetOpen(false)} style={styles.resetCancel}><Text style={styles.resetCancelText}>Отмена</Text></Pressable></View>
    </AppModal>
  </View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas }, content: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 48, flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.ink, fontSize: 35, lineHeight: 39, fontWeight: '800', letterSpacing: -1.2 },
  hero: { marginTop: 24, minHeight: 148, borderRadius: 24, backgroundColor: colors.sage, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroCopy: { flex: 1 }, heroTitle: { color: colors.ink, fontSize: 27, lineHeight: 33, fontWeight: '800' },
  heroBody: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 9 },
  heroArt: { width: 62, alignItems: 'center', justifyContent: 'center' },
  loader: { marginTop: 24 },
  button: { backgroundColor: colors.primary, borderRadius: 14, minHeight: 56, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 14 },
  buttonText: { color: 'white', fontSize: 15, fontWeight: '700', flex: 1 },
  guestButton: { minHeight: 56, borderRadius: 15, borderWidth: 1, borderColor: colors.line, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  guestText: { color: colors.primary, fontSize: 15, fontWeight: '700' },
  resetRow: { minHeight: 56, marginTop: 27, paddingHorizontal: 14, borderWidth: 1, borderColor: '#F2D9D9', borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF9F9' }, resetLabel: { flex: 1, color: '#A33636', fontSize: 15, fontWeight: '700' },
  resetDialog: { padding: 24 }, resetIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF1F1', alignItems: 'center', justifyContent: 'center' }, resetTitle: { color: colors.ink, fontSize: 23, fontWeight: '800', marginTop: 16 }, resetBody: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10 }, resetError: { color: '#A33636', fontSize: 13, marginTop: 12 }, resetConfirm: { minHeight: 52, marginTop: 22, backgroundColor: '#A33636', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, resetConfirmText: { color: 'white', fontSize: 15, fontWeight: '700' }, resetCancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 5 }, resetCancelText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
});
