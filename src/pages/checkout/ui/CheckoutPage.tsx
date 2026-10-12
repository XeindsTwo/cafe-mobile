import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { fontFamily, Text } from '../../../shared/ui/typography';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { OrderCreate } from '../../../shared/api/serverContract';
import { formatDeliveryDate, getDemoDay } from '../../../entities/meal/model/demoDay';
import { AppModal } from '../../../shared/ui/modal/AppModal';
import { colors } from '../../../shared/ui/theme';
import { useSession } from '../../../widgets/app-shell/model/Session';

const demoSlots = ['12:00', '13:00', '18:00'];
export function CheckoutPage() {
  const router = useRouter();
  const { cart, deliveryDate, placeOrder } = useSession();
  const [step, setStep] = useState<'cart' | 'delivery'>('cart');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [apartment, setApartment] = useState('');
  const [comment, setComment] = useState('');
  const [slot, setSlot] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [orderError, setOrderError] = useState('');
  const day = getDemoDay(deliveryDate);
  const validAddress = city.trim().length > 0 && street.trim().length > 0 && house.trim().length > 0;
  const canConfirm = validAddress && !!slot && cart.count > 0 && day.state === 'ready';
  const openConfirm = () => { setShowErrors(true); if (canConfirm) setConfirmOpen(true); };
  const submit = () => {
    if (!slot || !canConfirm) return;
    const request: OrderCreate = {
      delivery_date: deliveryDate,
      delivery_time: `${slot}:00`,
      address_id: 1, // Только локальный демо-id. При API-интеграции создаётся/выбирается настоящий адрес пользователя.
      items: cart.items.map(item => ({ menu_item_id: item.meal.menuItemId, quantity: item.quantity })),
      comment: comment.trim() || null,
    };
    if (request.items.length === 0) { setOrderError('Корзина пуста'); setConfirmOpen(false); return; }
    placeOrder(request, `${city.trim()}, ${street.trim()}, ${house.trim()}${apartment.trim() ? `, кв. ${apartment.trim()}` : ''}`);
    setConfirmOpen(false);
    router.replace('/orders');
  };

  return <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.header}><Pressable onPress={() => step === 'delivery' ? setStep('cart') : router.back()} accessibilityRole="button" accessibilityLabel="Назад" style={styles.back}><Ionicons name="arrow-back" size={22} color={colors.ink} /></Pressable><Text style={styles.headerTitle}>{step === 'cart' ? 'Корзина' : 'Оформление'}</Text>{step === 'cart' ? <Pressable onPress={() => setClearOpen(true)} accessibilityRole="button" style={styles.clear}><Text style={styles.clearText}>Очистить</Text></Pressable> : <View style={styles.back} />}</View>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {step === 'delivery' && <View style={styles.progress}><View style={[styles.progressPart, styles.progressActive]} /><View style={[styles.progressPart, styles.progressActive]} /></View>}
      {step === 'cart' ? <>
        <View style={styles.dateCard}><Ionicons name="calendar-outline" size={23} color={colors.primary} /><View><Text style={styles.muted}>Доставка</Text><Text style={styles.dateText}>{formatDeliveryDate(deliveryDate)}</Text></View></View>
        {cart.items.length ? cart.items.map(item => <View key={item.meal.menuItemId} style={styles.cartRow}><Image source={item.meal.image} style={styles.food} /><View style={styles.cartText}><Text style={styles.itemName}>{item.meal.name}</Text><Text style={styles.muted}>{item.meal.weight}</Text><Text style={styles.itemPrice}>{item.meal.price * item.quantity} ₽</Text></View><View style={styles.counter}><Pressable onPress={() => cart.decrease(item.meal)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Уменьшить ${item.meal.name}`} style={styles.counterButton}><Ionicons name="remove" size={17} color={colors.primary} /></Pressable><Text style={styles.count}>{item.quantity}</Text><Pressable onPress={() => cart.add(item.meal)} hitSlop={8} accessibilityRole="button" accessibilityLabel={`Увеличить ${item.meal.name}`} style={styles.counterButton}><Ionicons name="add" size={17} color={colors.primary} /></Pressable></View></View>) : <View style={styles.empty}><Ionicons name="basket-outline" size={35} color={colors.primary} /><Text style={styles.emptyTitle}>Корзина пуста</Text><Text style={styles.muted}>Добавьте комплекс или блюда из меню.</Text><Pressable onPress={() => router.replace('/menu')} style={styles.emptyLink}><Text style={styles.emptyLinkText}>Перейти в меню</Text></Pressable></View>}
        {!!cart.count && <><Text style={styles.commentTitle}>Комментарий к заказу</Text><TextInput multiline value={comment} onChangeText={setComment} maxLength={2000} placeholder="Например, как найти вход" placeholderTextColor={colors.muted} style={[styles.comment, { fontFamily: fontFamily.regular }]} accessibilityLabel="Комментарий к заказу" /></>}
      </> : <>
        <Text style={styles.demo}>Демо-оформление: заказ не отправляется в столовую.</Text>
        <Text style={styles.sectionTitle}>Куда доставить?</Text><Text style={styles.helper}>Адрес нужен для настоящего заказа. Сейчас он используется только в демо.</Text>
        <View style={styles.form}><Field label="Город" value={city} onChange={setCity} placeholder="Например, Москва" error={showErrors && !city.trim()} /><Field label="Улица" value={street} onChange={setStreet} placeholder="Название улицы" error={showErrors && !street.trim()} /><View style={styles.formRow}><View style={styles.fieldHalf}><Field label="Дом" value={house} onChange={setHouse} placeholder="12" error={showErrors && !house.trim()} /></View><View style={styles.fieldHalf}><Field label="Квартира" value={apartment} onChange={setApartment} placeholder="Необязательно" /></View></View></View>
        <Text style={styles.sectionTitle}>Время доставки</Text><Text style={styles.helper}>Доступные интервалы здесь демонстрационные.</Text><View style={styles.slots}>{day.state === 'ready' ? demoSlots.map(value => <Pressable key={value} onPress={() => setSlot(value)} accessibilityRole="button" accessibilityState={{ selected: slot === value }} style={[styles.slot, slot === value && styles.slotActive]}><Text style={[styles.slotText, slot === value && styles.slotTextActive]}>{value}</Text></Pressable>) : <Text style={styles.error}>На эту дату нет доступных слотов. Выберите другой день в меню.</Text>}</View>{showErrors && !slot && day.state === 'ready' && <Text style={styles.error}>Выберите время доставки</Text>}
        <View style={styles.summary}><Text style={styles.muted}>{cart.count} позиций · {formatDeliveryDate(deliveryDate)}</Text><Text style={styles.total}>{cart.total} ₽</Text></View>
        {!!orderError && <Text style={styles.error}>{orderError}</Text>}
      </>}
    </ScrollView>
    {cart.count > 0 && <View style={styles.footer}>{step === 'cart' && <View style={styles.totalRow}><Text style={styles.totalLabel}>Итого</Text><Text style={styles.total}>{cart.total} ₽</Text></View>}<Pressable onPress={() => step === 'cart' ? setStep('delivery') : openConfirm()} style={styles.primary} accessibilityRole="button"><Text style={styles.primaryText}>{step === 'cart' ? 'Оформить заказ' : 'Проверить заказ'}</Text><Ionicons name="arrow-forward" size={19} color="white" /></Pressable></View>}
    <AppModal visible={clearOpen} onClose={() => setClearOpen(false)} variant="dialog"><View style={styles.confirm}><Ionicons name="trash-outline" size={32} color={colors.primary} /><Text style={styles.confirmTitle}>Очистить корзину?</Text><Text style={styles.confirmHint}>Все добавленные блюда будут удалены.</Text><Pressable onPress={() => { cart.clear(); setClearOpen(false); }} style={styles.primary}><Text style={styles.primaryText}>Очистить</Text></Pressable><Pressable onPress={() => setClearOpen(false)} style={styles.cancel}><Text style={styles.cancelText}>Оставить заказ</Text></Pressable></View></AppModal>
    <AppModal visible={confirmOpen} onClose={() => setConfirmOpen(false)} variant="dialog"><View style={styles.confirm}><Ionicons name="checkmark-circle-outline" size={34} color={colors.primary} /><Text style={styles.confirmTitle}>Всё верно?</Text><Text style={styles.confirmBody}>{formatDeliveryDate(deliveryDate)}, {slot}{'\n'}{city}, {street}, {house}{'\n'}{cart.count} позиций · {cart.total} ₽</Text><Text style={styles.confirmHint}>Это демо-заказ. Он не отправится на сервер.</Text><Pressable onPress={submit} style={styles.primary}><Text style={styles.primaryText}>Создать демо-заказ</Text></Pressable><Pressable onPress={() => setConfirmOpen(false)} style={styles.cancel}><Text style={styles.cancelText}>Вернуться к оформлению</Text></Pressable></View></AppModal>
  </KeyboardAvoidingView>;
}

function Field({ label, value, onChange, placeholder, error = false }: { label: string; value: string; onChange: (value: string) => void; placeholder: string; error?: boolean }) {
  return <View style={styles.field}><Text style={styles.fieldLabel}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={colors.muted} style={[styles.input, error && styles.inputError, { fontFamily: fontFamily.regular }]} accessibilityLabel={label} />{error && <Text style={styles.error}>Обязательное поле</Text>}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas }, header: { height: 56, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, headerTitle: { color: colors.ink, fontSize: 18, fontWeight: '800' }, clear: { minWidth: 54, minHeight: 44, justifyContent: 'center', alignItems: 'flex-end' }, clearText: { color: colors.primary, fontSize: 12, fontWeight: '800' }, content: { paddingHorizontal: 20, paddingBottom: 35 }, progress: { flexDirection: 'row', gap: 7, marginTop: 8, marginBottom: 12 }, progressPart: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.line }, progressActive: { backgroundColor: colors.primary }, demo: { color: colors.muted, fontSize: 12, lineHeight: 17, marginBottom: 18 },
  dateCard: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, backgroundColor: colors.surface, borderRadius: 17 }, dateText: { color: colors.ink, fontSize: 15, fontWeight: '700', textTransform: 'capitalize' }, sectionTitle: { color: colors.ink, fontSize: 21, fontWeight: '800', marginTop: 22, marginBottom: 12 }, muted: { color: colors.muted, fontSize: 13, lineHeight: 18 }, helper: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: -5, marginBottom: 12 },
  cartRow: { minHeight: 108, backgroundColor: colors.surface, borderRadius: 17, padding: 10, flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 9, borderWidth: 1, borderColor: colors.line }, food: { width: 75, height: 75, borderRadius: 12 }, cartText: { flex: 1 }, itemName: { color: colors.ink, fontSize: 13, fontWeight: '800' }, itemPrice: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 5 }, counter: { flexDirection: 'row', alignItems: 'center', gap: 2 }, counterButton: { width: 32, height: 36, backgroundColor: colors.accentSoft, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, count: { color: colors.ink, minWidth: 15, textAlign: 'center', fontWeight: '800', fontSize: 12 }, totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }, totalLabel: { color: colors.ink, fontSize: 17, fontWeight: '800' }, total: { color: colors.ink, fontSize: 22, fontWeight: '800' },
  empty: { padding: 28, backgroundColor: colors.accentSoft, borderRadius: 18, alignItems: 'center' }, emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 10, marginBottom: 4 }, emptyLink: { minHeight: 44, justifyContent: 'center', marginTop: 12 }, emptyLinkText: { color: colors.primary, fontWeight: '700' },
  form: { gap: 12 }, formRow: { flexDirection: 'row', gap: 10 }, fieldHalf: { flex: 1 }, field: { gap: 6 }, fieldLabel: { color: colors.ink, fontSize: 13, fontWeight: '700' }, input: { height: 52, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 13, paddingHorizontal: 14, color: colors.ink, fontSize: 15 }, inputError: { borderColor: '#B54A4A' }, error: { color: '#B54A4A', fontSize: 12, marginTop: 4 }, slots: { flexDirection: 'row', gap: 9 }, slot: { minWidth: 80, minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }, slotActive: { borderColor: colors.primary, backgroundColor: colors.accentSoft }, slotText: { color: colors.ink, fontWeight: '700' }, slotTextActive: { color: colors.primary }, commentTitle: { color: colors.ink, fontSize: 14, fontWeight: '800', marginTop: 27, marginBottom: 10 }, comment: { minHeight: 56, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 13, padding: 14, textAlignVertical: 'top', color: colors.ink, fontSize: 14 }, summary: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, gap: 10 },
  footer: { padding: 16, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line }, primary: { minHeight: 54, backgroundColor: colors.primary, borderRadius: 15, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, primaryText: { color: 'white', fontSize: 15, fontWeight: '800' }, confirm: { padding: 23 }, confirmTitle: { color: colors.ink, fontSize: 23, fontWeight: '800', marginTop: 10 }, confirmBody: { color: colors.ink, fontSize: 15, lineHeight: 24, marginTop: 12, textTransform: 'capitalize' }, confirmHint: { color: colors.muted, fontSize: 12, marginVertical: 16 }, cancel: { minHeight: 48, alignItems: 'center', justifyContent: 'center' }, cancelText: { color: colors.primary, fontWeight: '700' },
});
