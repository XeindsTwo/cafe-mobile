import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { fontFamily, Text } from '../../../shared/ui/typography';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { formatDeliveryDate, getDemoDay } from '../../../entities/meal/model/demoDay';
import { useAuth } from '../../../features/auth/model/AuthProvider';
import { LocalOrder } from '../../../entities/order/model/localOrder';
import { addressText, DeliveryDraft, deliveryErrors, deliverySlots, orderRequest } from '../../../features/checkout/model/checkout';
import { AppModal } from '../../../shared/ui/modal/AppModal';
import { colors } from '../../../shared/ui/theme';
import { useSession } from '../../../widgets/app-shell/model/Session';

type Step = 'cart' | 'delivery' | 'review';
const money = (value: number) => `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(value)} ₽`;
export function CheckoutPage() {
  const router = useRouter();
  const { state: auth } = useAuth();
  const { cart, deliveryDate, placeOrder, deliveryDraft: draft, setDeliveryDraft, ordersReady, ordersError, retryOrders } = useSession();
  const [step, setStep] = useState<Step>('cart');
  const [clearOpen, setClearOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [saving, setSaving] = useState(false);
  const submitLock = useRef(false);
  const scroll = useRef<ScrollView>(null);
  const [completed, setCompleted] = useState<LocalOrder | null>(null);
  const day = getDemoDay(deliveryDate);
  const available = day.state === 'ready' && cart.items.every(item => day.meals.some(meal => meal.menuItemId === item.meal.menuItemId));
  const errors = deliveryErrors(draft);
  const change = (key: keyof DeliveryDraft, value: string) => setDeliveryDraft({ ...draft, [key]: value });
  const go = (value: Step) => { Keyboard.dismiss(); setStep(value); setOrderError(''); scroll.current?.scrollTo({ y: 0, animated: false }); };
  const leave = useCallback(() => {
    if (saving) return;
    if (completed) router.dismissTo('/orders');
    else if (step === 'review') setStep('delivery');
    else if (step === 'delivery') setStep('cart');
    else if (router.canGoBack()) router.back();
    else router.replace('/menu');
  }, [saving, completed, step, router]);
  useFocusEffect(useCallback(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => { leave(); return true; });
    return () => subscription.remove();
  }, [leave]));
  const review = () => {
    setShowErrors(true);
    if (Object.keys(errors).length) { scroll.current?.scrollTo({ y: 0, animated: true }); return; }
    if (!available) { setOrderError('Меню изменилось. Вернитесь в корзину и выберите доступные блюда.'); return; }
    go('review');
  };
  const submit = async () => {
    if (submitLock.current) return;
    submitLock.current = true;
    setSaving(true); setOrderError('');
    try {
      if (getDemoDay(deliveryDate).state !== 'ready' || !available) throw new Error('Доставка на эту дату недоступна. Выберите другую дату в меню.');
      const request = orderRequest(deliveryDate, draft, cart.items);
      const result = await placeOrder(request, addressText(draft));
      setCompleted(result);
    } catch (error) { setOrderError(error instanceof Error ? error.message : 'Не удалось сохранить заказ. Корзина сохранена — попробуйте ещё раз.'); }
    finally { submitLock.current = false; setSaving(false); }
  };

  if (completed) return <View style={styles.root}>
    <Stack.Screen options={{ gestureEnabled: false }} />
    <ScrollView contentContainerStyle={extra.successContent}>
      <Animated.View entering={FadeInDown.duration(280)} style={extra.successHero}>
        <View style={extra.successIcon}><Ionicons name="checkmark" size={42} color={colors.primary} /></View>
        <Text style={extra.successTitle}>Заказ сохранён</Text>
        <Text style={extra.orderNumber}>№ {completed.id}</Text>
        <Text style={extra.centered}>Он уже в истории заказов. Все детали — ниже.</Text>
      </Animated.View>
      <View style={extra.notice}><Ionicons name="information-circle-outline" size={21} color={colors.primary} /><Text style={extra.noticeText}>Тестовый заказ: столовая его не получила, оплата не списывалась.</Text></View>
      <View style={extra.summaryCard}><Fact icon="calendar-outline" title="Дата доставки" value={formatDeliveryDate(completed.request.delivery_date)} /><Fact icon="time-outline" title="Время" value={completed.request.delivery_time.slice(0, 5)} /><Fact icon="location-outline" title="Адрес" value={completed.addressText} />{!!completed.request.comment && <Fact icon="chatbubble-outline" title="Комментарий" value={completed.request.comment} />}</View>
      <View style={extra.summaryCard}><Text style={extra.blockTitle}>Состав заказа</Text>{completed.items.map((item, index) => <View key={index} style={extra.reviewRow}><Text style={extra.reviewName}>{item.name} × {item.quantity}</Text><Text style={extra.reviewPrice}>{money(item.price * item.quantity)}</Text></View>)}<View style={extra.divider} /><View style={extra.reviewRow}><Text style={styles.totalLabel}>Итого</Text><Text style={styles.total}>{money(completed.total)}</Text></View></View>
    </ScrollView>
    <View style={styles.footer}><Pressable onPress={() => router.dismissTo('/orders')} accessibilityRole="button" style={styles.primary}><Text style={styles.primaryText}>Мои заказы</Text><Ionicons name="arrow-forward" size={20} color="white" /></Pressable><Pressable onPress={() => router.dismissTo('/menu')} accessibilityRole="button" style={styles.cancel}><Text style={styles.cancelText}>Вернуться в меню</Text></Pressable></View>
  </View>;

  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <Stack.Screen options={{ gestureEnabled: step === 'cart' && !saving }} />
    <View style={styles.header}><Pressable onPress={leave} disabled={saving} accessibilityRole="button" accessibilityLabel="Назад" style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><Text style={styles.headerTitle}>{step === 'cart' ? 'Корзина' : step === 'delivery' ? 'Доставка' : 'Проверка заказа'}</Text>{step === 'cart' && cart.count > 0 ? <Pressable onPress={() => setClearOpen(true)} accessibilityRole="button" style={styles.clear}><Text style={styles.clearText}>Очистить</Text></Pressable> : <View style={styles.back} />}</View>
    {!!cart.count && <View style={extra.steps}>{(['Корзина', 'Доставка', 'Проверка'] as const).map((label, index) => <View key={label} style={extra.step}><View style={[extra.stepLine, index <= ['cart', 'delivery', 'review'].indexOf(step) && styles.progressActive]} /><Text style={[extra.stepText, index === ['cart', 'delivery', 'review'].indexOf(step) && extra.stepSelected]}>{label}</Text></View>)}</View>}
    <ScrollView ref={scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {!cart.count ? <View style={extra.empty}><View style={extra.successIcon}><Ionicons name="basket-outline" size={36} color={colors.primary} /></View><Text style={styles.emptyTitle}>Пока ничего не выбрали</Text><Text style={extra.centered}>Соберите обед из любимых блюд или выберите готовый комплекс.</Text><Pressable onPress={() => router.dismissTo('/menu')} accessibilityRole="button" style={[styles.primary, extra.fullButton]}><Text style={styles.primaryText}>Открыть меню</Text><Ionicons name="arrow-forward" size={19} color="white" /></Pressable></View> : <>
      {step === 'cart' && <>
        <View style={[styles.dateCard, extra.dateMargin]}><Ionicons name="calendar-outline" size={23} color={colors.primary} /><View style={extra.flex}><Text style={styles.muted}>Доставка</Text><Text style={styles.dateText}>{formatDeliveryDate(deliveryDate)}</Text></View></View>
        {!available && <View style={extra.notice}><Text style={styles.error}>Некоторые блюда или дата больше недоступны. Выберите меню на другую дату.</Text><Pressable onPress={() => router.dismissTo('/menu')} style={styles.cancel}><Text style={styles.cancelText}>В меню</Text></Pressable></View>}
        {cart.items.map(item => <View key={item.meal.menuItemId} style={extra.cartCard}>
          <View style={extra.cartTop}><Image source={item.meal.image} style={styles.food} /><View style={extra.flex}><Text style={styles.itemName}>{item.meal.name}</Text><Text style={styles.muted}>{item.meal.weight}</Text><Text style={styles.muted}>{money(item.meal.price)} / шт.</Text></View></View>
          <View style={extra.cartBottom}><Text style={extra.lineTotal}>{money(item.meal.price * item.quantity)}</Text><View style={extra.counter}>
            <Pressable onPress={() => cart.decrease(item.meal)} accessibilityRole="button" accessibilityLabel={item.quantity === 1 ? `Удалить ${item.meal.name}` : `Уменьшить ${item.meal.name}`} style={extra.counterButton}><Ionicons name={item.quantity === 1 ? 'trash-outline' : 'remove'} size={19} color={colors.primary} /></Pressable>
            <Text style={styles.count} accessibilityLiveRegion="polite">{item.quantity}</Text>
            <Pressable onPress={() => cart.add(item.meal)} disabled={item.quantity >= 10} accessibilityRole="button" accessibilityLabel={`Увеличить ${item.meal.name}`} accessibilityState={{ disabled: item.quantity >= 10 }} style={[extra.counterButton, item.quantity >= 10 && extra.disabled]}><Ionicons name="add" size={19} color={colors.primary} /></Pressable>
          </View></View>
        </View>)}
        <Pressable onPress={() => router.dismissTo('/menu')} accessibilityRole="button" style={styles.cancel}><Text style={styles.cancelText}>+ Добавить ещё блюда</Text></Pressable>
        <Text style={styles.commentTitle}>Комментарий к заказу</Text><TextInput multiline value={draft.comment} onChangeText={value => change('comment', value)} maxLength={2000} placeholder="Например, как найти вход" placeholderTextColor={colors.muted} style={[styles.comment, { fontFamily: fontFamily.regular }]} accessibilityLabel="Комментарий к заказу" />
      </>}
      {step === 'delivery' && <>
        <View style={extra.summaryCard}>
          {auth.status === 'ready'
            ? <Fact icon="person-outline" title="Аккаунт" value={auth.account.first_name} />
            : <Pressable onPress={() => { Keyboard.dismiss(); router.push('/sign-in'); }}
              accessibilityRole="button" style={extra.fact}>
              <View style={extra.factIcon}><Ionicons name="person-outline" size={21} color={colors.primary} /></View>
              <Text style={[extra.factValue, extra.flex]}>Войти или создать аккаунт</Text>
              <Ionicons name="chevron-forward" size={19} color={colors.primary} />
            </Pressable>}
        </View>
        <Text style={styles.sectionTitle}>Куда привезти обед?</Text><Text style={styles.helper}>Город, улица и дом — обязательные поля.</Text>
        <View style={styles.form}><Field label="Город" value={draft.city} onChange={value => change('city', value)} placeholder="Город доставки" maxLength={100} error={showErrors ? errors.city : undefined} /><Field label="Улица" value={draft.street} onChange={value => change('street', value)} placeholder="Название улицы" maxLength={200} error={showErrors ? errors.street : undefined} />
          <View style={styles.formRow}><View style={styles.fieldHalf}><Field label="Дом" value={draft.house} onChange={value => change('house', value)} placeholder="12А" error={showErrors ? errors.house : undefined} /></View><View style={styles.fieldHalf}><Field label="Квартира / офис" value={draft.apartment} onChange={value => change('apartment', value)} placeholder="Необязательно" /></View></View>
          <View style={styles.formRow}><View style={styles.fieldHalf}><Field label="Подъезд" value={draft.entrance} onChange={value => change('entrance', value)} placeholder="Необязательно" /></View><View style={styles.fieldHalf}><Field label="Этаж" value={draft.floor} onChange={value => change('floor', value)} placeholder="Необязательно" /></View></View>
        </View>
        <Text style={styles.sectionTitle}>Когда доставить?</Text><Text style={styles.helper}>{formatDeliveryDate(deliveryDate)}</Text><View style={styles.slots}>{deliverySlots.map(value => <Pressable key={value} onPress={() => change('slot', value)} accessibilityRole="button" accessibilityState={{ selected: draft.slot === value }} style={[styles.slot, extra.flex, draft.slot === value && styles.slotActive]}><Text style={[styles.slotText, draft.slot === value && styles.slotTextActive]}>{value}</Text></Pressable>)}</View>{showErrors && errors.slot && <Text accessibilityRole="alert" style={styles.error}>{errors.slot}</Text>}
      </>}
      {step === 'review' && <>
        <View style={extra.sectionHeading}><Text style={extra.blockTitle}>Доставка</Text><Pressable disabled={saving} onPress={() => go('delivery')} style={styles.cancel}><Text style={styles.cancelText}>Изменить</Text></Pressable></View>
        <View style={extra.summaryCard}><Fact icon="calendar-outline" title="Дата и время" value={`${formatDeliveryDate(deliveryDate)}, ${draft.slot}`} /><Fact icon="location-outline" title="Адрес" value={addressText(draft)} />{!!draft.comment.trim() && <Fact icon="chatbubble-outline" title="Комментарий" value={draft.comment.trim()} />}</View>
        <View style={extra.sectionHeading}><Text style={extra.blockTitle}>Ваш заказ</Text><Pressable disabled={saving} onPress={() => go('cart')} style={styles.cancel}><Text style={styles.cancelText}>Изменить</Text></Pressable></View>
        <View style={extra.summaryCard}>{cart.items.map(item => <View key={item.meal.menuItemId} style={extra.reviewRow}><Image source={item.meal.image} style={extra.reviewImage} /><View style={extra.flex}><Text style={styles.itemName}>{item.meal.name}</Text><Text style={styles.muted}>{item.quantity} × {money(item.meal.price)}</Text></View><Text style={extra.reviewPrice}>{money(item.quantity * item.meal.price)}</Text></View>)}<View style={extra.divider} /><View style={extra.reviewRow}><Text style={styles.totalLabel}>Итого</Text><Text style={styles.total}>{money(cart.total)}</Text></View></View>
        <View style={extra.notice}><Ionicons name="information-circle-outline" size={22} color={colors.primary} /><Text style={extra.noticeText}>Тестовый режим. Сохраним заказ на этом устройстве. В столовую он не отправится, оплаты не будет.</Text></View>
      </>}
      {!!orderError && <Text accessibilityRole="alert" style={extra.errorBox}>{orderError}</Text>}
      {!!ordersError && <View style={extra.notice}><Text style={styles.error}>{ordersError}</Text><Pressable onPress={() => void retryOrders()} style={styles.cancel}><Text style={styles.cancelText}>Повторить загрузку</Text></Pressable></View>}
      </>}
    </ScrollView>
    {cart.count > 0 && <View style={styles.footer}><View style={styles.totalRow}><Text style={styles.totalLabel}>Итого</Text><Text style={styles.total}>{money(cart.total)}</Text></View><Pressable disabled={saving || !available || (step === 'review' && !ordersReady)} accessibilityRole="button" accessibilityState={{ disabled: saving || !available || (step === 'review' && !ordersReady), busy: saving }} onPress={() => step === 'cart' ? go('delivery') : step === 'delivery' ? review() : void submit()} style={[styles.primary, (saving || !available || (step === 'review' && !ordersReady)) && extra.disabled]}><Text style={styles.primaryText}>{saving ? 'Сохраняем заказ…' : step === 'cart' ? 'К оформлению' : step === 'delivery' ? 'Проверить заказ' : 'Подтвердить заказ'}</Text>{saving ? <ActivityIndicator color="white" /> : <Ionicons name="arrow-forward" size={19} color="white" />}</Pressable></View>}
    <AppModal visible={clearOpen} onClose={() => setClearOpen(false)} variant="dialog"><View style={styles.confirm}><Ionicons name="trash-outline" size={32} color={colors.primary} /><Text style={styles.confirmTitle}>Очистить корзину?</Text><Text style={styles.confirmHint}>Все добавленные блюда будут удалены.</Text><Pressable onPress={() => { cart.clear(); setClearOpen(false); }} accessibilityRole="button" style={styles.primary}><Text style={styles.primaryText}>Очистить корзину</Text></Pressable><Pressable onPress={() => setClearOpen(false)} accessibilityRole="button" style={styles.cancel}><Text style={styles.cancelText}>Оставить блюда</Text></Pressable></View></AppModal>
  </KeyboardAvoidingView>;
}
function Field({ label, value, onChange, placeholder, error, maxLength = 30 }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; error?: string; maxLength?: number }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} maxLength={maxLength} placeholderTextColor={colors.muted} style={[styles.input, !!error && styles.inputError, { fontFamily: fontFamily.regular }]} accessibilityLabel={label} />{!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}</View>;
}
function Fact({ icon, title, value }: { icon: keyof typeof Ionicons.glyphMap; title: string; value: string }) {
  return <View style={extra.fact}><View style={extra.factIcon}><Ionicons name={icon} size={21} color={colors.primary} /></View><View style={extra.flex}><Text style={styles.muted}>{title}</Text><Text style={extra.factValue}>{value}</Text></View></View>;
}
const extra = StyleSheet.create({
  flex: { flex: 1 }, disabled: { opacity: .45 }, dateMargin: { marginBottom: 16 },
  steps: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, paddingTop: 8, paddingBottom: 20 }, step: { flex: 1, gap: 7 }, stepLine: { height: 3, borderRadius: 2, backgroundColor: colors.line }, stepText: { fontSize: 11, color: colors.muted }, stepSelected: { color: colors.primary, fontWeight: '700' },
  cartCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: colors.line }, cartTop: { flexDirection: 'row', gap: 14, alignItems: 'center' }, cartBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }, lineTotal: { fontSize: 18, fontWeight: '700', color: colors.ink }, counter: { flexDirection: 'row', alignItems: 'center', gap: 12 }, counterButton: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }, blockTitle: { color: colors.ink, fontSize: 18, fontWeight: '700' }, summaryCard: { backgroundColor: colors.surface, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: colors.line }, fact: { flexDirection: 'row', gap: 12, paddingVertical: 9, alignItems: 'center' }, factIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, factValue: { color: colors.ink, fontSize: 14, lineHeight: 21, marginTop: 3, fontWeight: '600' }, reviewRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 10 }, reviewImage: { width: 48, height: 48, borderRadius: 12 }, reviewName: { flex: 1, fontSize: 14, color: colors.ink, lineHeight: 21 }, reviewPrice: { fontSize: 14, fontWeight: '700', color: colors.ink }, divider: { height: 1, backgroundColor: colors.line, marginVertical: 8 },
  notice: { padding: 15, borderRadius: 16, backgroundColor: colors.accentSoft, flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' }, noticeText: { flex: 1, fontSize: 12, lineHeight: 18, color: colors.primary }, errorBox: { color: '#B54A4A', padding: 14, backgroundColor: '#FFF1EF', borderRadius: 12, marginVertical: 12, lineHeight: 20 },
  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 }, fullButton: { alignSelf: 'stretch', marginTop: 12 }, centered: { color: colors.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' }, successContent: { padding: 20, paddingBottom: 30 }, successHero: { alignItems: 'center', paddingVertical: 25, gap: 10 }, successIcon: { width: 84, height: 84, borderRadius: 42, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }, successTitle: { fontSize: 29, fontWeight: '700', color: colors.ink, textAlign: 'center' }, orderNumber: { fontSize: 14, color: colors.primary, fontWeight: '600' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas }, header: { height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' }, clear: { minWidth: 54, minHeight: 44, justifyContent: 'center', alignItems: 'flex-end' }, clearText: { color: colors.primary, fontSize: 12, fontWeight: '800' }, content: { paddingHorizontal: 20, paddingBottom: 35 }, progress: { flexDirection: 'row', gap: 7, marginTop: 8, marginBottom: 12 }, progressPart: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.line }, progressActive: { backgroundColor: colors.primary }, demo: { color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: 18 },
  dateCard: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, backgroundColor: colors.surface, borderRadius: 17 }, dateText: { color: colors.ink, fontSize: 15, fontWeight: '700', textTransform: 'capitalize' }, sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '800', marginTop: 22, marginBottom: 12 }, muted: { color: colors.muted, fontSize: 13, lineHeight: 18 }, helper: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: -5, marginBottom: 12 },
  cartRow: { minHeight: 108, backgroundColor: colors.surface, borderRadius: 17, padding: 10, flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 9, borderWidth: 1, borderColor: colors.line }, food: { width: 75, height: 75, borderRadius: 12 }, cartText: { flex: 1 }, itemName: { color: colors.ink, fontSize: 13, fontWeight: '800' }, itemPrice: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 5 }, counter: { flexDirection: 'row', alignItems: 'center', gap: 2 }, counterButton: { width: 32, height: 36, backgroundColor: colors.accentSoft, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, count: { color: colors.ink, minWidth: 15, textAlign: 'center', fontWeight: '800', fontSize: 12 }, totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, totalLabel: { color: colors.ink, fontSize: 17, fontWeight: '800' }, total: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  empty: { padding: 28, backgroundColor: colors.accentSoft, borderRadius: 18, alignItems: 'center' }, emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 10, marginBottom: 4 }, emptyLink: { minHeight: 44, justifyContent: 'center', marginTop: 12 }, emptyLinkText: { color: colors.primary, fontWeight: '700' },
  form: { gap: 12 }, formRow: { flexDirection: 'row', gap: 10 }, fieldHalf: { flex: 1 }, field: { gap: 6 }, fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '700' }, input: { height: 52, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 14, color: colors.ink, fontSize: 15 }, inputError: { borderColor: '#B54A4A' }, error: { color: '#B54A4A', fontSize: 12, marginTop: 4 }, slots: { flexDirection: 'row', gap: 9 }, slot: { minWidth: 80, minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, slotActive: { borderColor: colors.primary, backgroundColor: colors.accentSoft }, slotText: { color: colors.ink, fontWeight: '700' }, slotTextActive: { color: colors.primary }, commentTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 27, marginBottom: 10 }, comment: { minHeight: 56, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 13, padding: 14, textAlignVertical: 'top', color: colors.ink, fontSize: 14 }, summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, gap: 10 },
  footer: { padding: 16, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line }, primary: { minHeight: 54, backgroundColor: colors.primary, borderRadius: 15, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, primaryText: { color: 'white', fontSize: 15, fontWeight: '800' }, confirm: { padding: 23 }, confirmTitle: { color: colors.ink, fontSize: 23, fontWeight: '800', marginTop: 10 }, confirmBody: { color: colors.ink, fontSize: 15, lineHeight: 24, marginTop: 12, textTransform: 'capitalize' }, confirmHint: { color: colors.muted, fontSize: 12, marginVertical: 16 }, cancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, cancelText: { color: colors.primary, fontWeight: '700' },
});
