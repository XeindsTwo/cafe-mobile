import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { fontFamily, Text } from '../../../shared/ui/typography';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors } from '../../../shared/ui/theme';
import { AppModal } from '../../../shared/ui/modal/AppModal';
import { useSession } from '../../../widgets/app-shell/model/Session';

export function ProfilePage() {
  const [phone, setPhone] = useState('');
  const [showNotice, setShowNotice] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState(false);
  const { resetAllData } = useSession();
  const digits = phone.replace(/\D/g, '');
  const canContinue = digits.length >= 10;

  const confirmReset = async () => {
    if (resetting) return;
    setResetting(true);
    setResetError(false);
    try { await resetAllData(); } catch { setResetError(true); setResetting(false); }
  };

  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Animated.View entering={FadeInDown.duration(420)}>
        <View style={styles.header}><Text style={styles.title}>Профиль</Text><Ionicons name="settings-outline" size={28} color={colors.muted} /></View>
        <View style={styles.hero}><View style={styles.heroCopy}><Text style={styles.heroTitle}>Войдите{`\n`}в аккаунт</Text><Text style={styles.heroBody}>Сохраняйте блюда, отслеживайте заказы и получайте персональные предложения.</Text></View><View style={styles.heroArt}><Ionicons name="leaf" size={74} color={colors.accent} /><Ionicons name="heart" size={30} color={colors.primary} /></View></View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(420)} style={styles.authCard}>
        <Text style={styles.cardTitle}>Вход по телефону</Text>
        <Text style={styles.cardBody}>Один номер — и всё под рукой.</Text>
        <Text style={styles.label}>Номер телефона</Text>
        <View style={styles.inputWrap}><Text style={styles.prefix}>+7</Text><View style={styles.separator} /><TextInput value={phone} onChangeText={value => { setPhone(value.replace(/[^\d\s()\-]/g, '').slice(0, 18)); setShowNotice(false); }} keyboardType="phone-pad" textContentType="telephoneNumber" autoComplete="tel" placeholder="(999) 123-45-67" placeholderTextColor="#A5A79E" style={[styles.input, { fontFamily: fontFamily.regular }]} accessibilityLabel="Номер телефона" /></View>
        <Pressable onPress={() => setShowNotice(true)} disabled={!canContinue} style={[styles.button, !canContinue && styles.buttonDisabled]}><Text style={styles.buttonText}>Продолжить  →</Text></Pressable>
        {showNotice && <View style={styles.notice}><Text style={styles.noticeText}>Вход по коду уже есть на сервере. Подключение к мобильному приложению ещё в работе; номер сейчас никуда не отправляется.</Text></View>}
      </Animated.View>

      <Pressable style={styles.guestButton}><Text style={styles.guestText}>Продолжить как гость</Text><Ionicons name="arrow-forward" size={21} color={colors.primary} /></Pressable>
      <Animated.View entering={FadeInDown.delay(180).duration(420)}><Text style={styles.sectionTitle}>После входа будет доступно</Text><View style={styles.benefits}>{[['receipt-outline','История заказов','Все ваши заказы в одном месте'],['heart-outline','Избранные блюда','Сохраняйте любимые позиции'],['notifications-outline','Уведомления','Следите за статусом заказа'],['repeat-outline','Быстрый повтор','Любимые блюда в пару кликов']].map(([icon,title,body]) => <View key={title} style={styles.benefit}><View style={styles.iconCircle}><Ionicons name={icon as any} size={23} color={colors.primary} /></View><View style={styles.benefitCopy}><Text style={styles.benefitTitle}>{title}</Text><Text style={styles.benefitBody}>{body}</Text></View></View>)}</View></Animated.View>
      <View style={styles.guestSection}><Text style={styles.sectionTitle}>Доступно без регистрации</Text>{[['help-circle-outline','Помощь'],['information-circle-outline','О приложении'],['shield-checkmark-outline','Политика конфиденциальности'],['moon-outline','Тема оформления']].map(([icon,label]) => <Pressable key={label} style={styles.linkRow}><Ionicons name={icon as any} size={22} color={colors.muted} /><Text style={styles.linkText}>{label}</Text><Ionicons name="chevron-forward" size={19} color={colors.muted} /></Pressable>)}</View>
      <Pressable accessibilityRole="button" onPress={() => setResetOpen(true)} style={styles.resetRow}><Ionicons name="refresh-circle-outline" size={23} color="#A33636" /><Text style={styles.resetLabel}>Сбросить все данные</Text><Ionicons name="chevron-forward" size={19} color="#A33636" /></Pressable>
    </ScrollView>
    <AppModal visible={resetOpen} onClose={() => { if (!resetting) setResetOpen(false); }} variant="dialog" dismissible={!resetting}>
      <View style={styles.resetDialog}><View style={styles.resetIcon}><Ionicons name="trash-outline" size={27} color="#A33636" /></View><Text style={styles.resetTitle}>Сбросить данные?</Text><Text style={styles.resetBody}>Очистятся корзина, демо-заказы, выбранная дата и сохранённые данные приложения. Онбординг появится снова.</Text>{resetError && <Text style={styles.resetError}>Не удалось очистить данные. Попробуйте ещё раз.</Text>}<Pressable accessibilityRole="button" disabled={resetting} onPress={confirmReset} style={styles.resetConfirm}><Text style={styles.resetConfirmText}>{resetting ? 'Сбрасываем…' : 'Сбросить всё'}</Text></Pressable><Pressable accessibilityRole="button" disabled={resetting} onPress={() => setResetOpen(false)} style={styles.resetCancel}><Text style={styles.resetCancelText}>Отмена</Text></Pressable></View>
    </AppModal>
  </KeyboardAvoidingView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas }, content: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 48, flexGrow: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  eyebrow: { color: colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  title: { color: colors.ink, fontSize: 35, lineHeight: 39, fontWeight: '800', letterSpacing: -1.2 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 17, maxWidth: 310 },
  hero: { marginTop: 28, minHeight: 210, borderRadius: 26, backgroundColor: colors.sage, padding: 22, overflow: 'hidden', flexDirection: 'row' }, heroCopy: { flex: 1 }, heroTitle: { color: colors.ink, fontSize: 32, lineHeight: 34, fontWeight: '800' }, heroBody: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 14 }, heroArt: { width: 92, alignItems: 'center', justifyContent: 'center', gap: 14 },
  authCard: { marginTop: 16, padding: 22, backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.line },
  stamp: { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  stampText: { color: colors.accent, fontSize: 34, lineHeight: 40 },
  cardTitle: { color: colors.ink, fontSize: 23, fontWeight: '800', marginTop: 22 }, cardBody: { color: colors.muted, fontSize: 14, marginTop: 7 },
  label: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: 31, marginBottom: 10 },
  inputWrap: { height: 58, borderWidth: 1, borderColor: colors.line, borderRadius: 14, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: colors.canvas },
  prefix: { fontSize: 17, fontWeight: '700', color: colors.ink }, separator: { height: 22, width: 1, backgroundColor: colors.line, marginHorizontal: 12 },
  input: { flex: 1, color: colors.ink, fontSize: 17, paddingVertical: 0 },
  button: { backgroundColor: colors.primary, borderRadius: 14, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 14 }, buttonDisabled: { backgroundColor: '#B7C8BD' }, buttonText: { color: 'white', fontSize: 15, fontWeight: '800' },
  notice: { backgroundColor: colors.sage, borderRadius: 12, padding: 14, marginTop: 14 }, noticeText: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  guestButton: { height: 56, borderRadius: 15, borderWidth: 1, borderColor: colors.primary, marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }, guestText: { color: colors.primary, fontSize: 15, fontWeight: '800' }, sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '800', marginTop: 28, marginBottom: 14 }, benefits: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, benefit: { width: '48%', minHeight: 108, backgroundColor: colors.surface, borderRadius: 18, padding: 13, flexDirection: 'row', gap: 9 }, iconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, benefitCopy: { flex: 1 }, benefitTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', lineHeight: 17 }, benefitBody: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 4 }, guestSection: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.line }, linkRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 14, borderBottomWidth: 1, borderBottomColor: colors.line }, linkText: { flex: 1, color: colors.ink, fontSize: 15 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 13, marginTop: 31 }, footerLine: { width: 24, height: 1, backgroundColor: colors.accent }, footerText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 18 },
  resetRow: { minHeight: 56, marginTop: 27, paddingHorizontal: 14, borderWidth: 1, borderColor: '#F2D9D9', borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFF9F9' }, resetLabel: { flex: 1, color: '#A33636', fontSize: 15, fontWeight: '700' },
  resetDialog: { padding: 24 }, resetIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#FFF1F1', alignItems: 'center', justifyContent: 'center' }, resetTitle: { color: colors.ink, fontSize: 23, fontWeight: '800', marginTop: 16 }, resetBody: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 10 }, resetError: { color: '#A33636', fontSize: 13, marginTop: 12 }, resetConfirm: { minHeight: 52, marginTop: 22, backgroundColor: '#A33636', borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, resetConfirmText: { color: 'white', fontSize: 15, fontWeight: '700' }, resetCancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 5 }, resetCancelText: { color: colors.ink, fontSize: 15, fontWeight: '700' },
});
