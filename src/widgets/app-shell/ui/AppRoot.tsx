import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Animated, Image, ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../shared/ui/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Meal } from '../../../entities/meal/model/types';
import { MenuExperience } from '../../../pages/menu/ui/MenuExperience';
import { HomePage } from '../../../pages/home/ui/HomePage';
import { ProfilePage } from '../../../pages/profile/ui/ProfilePage';
import { OrdersPage } from '../../../pages/orders/ui/OrdersPage';
import { DetailPage } from '../../../pages/detail/ui/DetailPage';
import { AppModal } from '../../../shared/ui/modal/AppModal';
import { colors } from '../../../shared/ui/theme';
import { useSession } from '../model/Session';

type Tab = 'home' | 'menu' | 'orders' | 'profile';
type ToastItem = { id: number; image: ImageSourcePropType };
export function AppRoot({ tab }: { tab: Tab }) {
  const router = useRouter();
  const { cart, setMenuView } = useSession();
  const toastId = useRef(0);
  const toastTimers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [selected, setSelected] = useState<{ kind: 'meal' | 'set'; id: string } | null>(null);
  const [detailVisible, setDetailVisible] = useState(false);

  useEffect(() => () => { toastTimers.current.forEach(timer => clearTimeout(timer)); }, []);

  const removeToast = (id: number) => {
    const timer = toastTimers.current.get(id);
    if (timer) clearTimeout(timer);
    toastTimers.current.delete(id);
    setToasts(current => current.filter(item => item.id !== id));
  };
  const showAdded = (image: ImageSourcePropType) => {
    const id = ++toastId.current;
    setToasts(current => [...current, { id, image }].slice(-3));
    toastTimers.current.set(id, setTimeout(() => removeToast(id), 3000));
  };

  const add = (meal: Meal) => {
    cart.add(meal);
    showAdded(meal.image);
  };
  const openMeal = (meal: Meal) => { setSelected({ kind: 'meal', id: meal.id }); setDetailVisible(true); };
  const openSet = (id: number) => { setSelected({ kind: 'set', id: String(id) }); setDetailVisible(true); };
  const openMenu = (view: 'sets' | 'dishes') => { setMenuView(view); router.replace('/menu'); };

  return <SafeAreaView style={styles.safe}>
    <View style={styles.main}>
      {tab === 'home' && <HomePage onOpen={openMeal} onAdd={add} onProfile={() => router.replace('/profile')} onMenu={() => openMenu('dishes')} onSets={() => openMenu('sets')} />}
      {tab === 'menu' && <MenuExperience onOpen={openMeal} onOpenSet={openSet} onAdd={add} onAddSet={showAdded} onProfile={() => router.replace('/profile')} />}
      {tab === 'orders' && <OrdersPage />}
      {tab === 'profile' && <ProfilePage />}
    </View>
    <View style={styles.nav}>{([['home', 'home-outline', 'Главная'], ['menu', 'restaurant-outline', 'Меню'], ['cart', 'basket-outline', 'Корзина'], ['orders', 'receipt-outline', 'Заказы'], ['profile', 'person-outline', 'Профиль']] as const).map(([key, icon, label]) => <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: tab === key }} onPress={() => { if (key === 'cart') router.push('/checkout'); else if (tab !== key) router.replace(key === 'home' ? '/' : `/${key}`); }} style={styles.navItem}><View><Ionicons name={tab === key && key === 'home' ? 'home' : icon} size={21} color={tab === key ? colors.primary : colors.muted} />{key === 'cart' && cart.count > 0 && <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{Math.min(cart.count, 99)}</Text></View>}</View><Text style={[styles.navLabel, tab === key && styles.navActive]}>{label}</Text></Pressable>)}</View>
    {tab === 'home' && cart.count > 0 && !detailVisible && <View style={styles.cartPanel}><View style={styles.cartPanelIcon}><Ionicons name="basket-outline" size={20} color={colors.primary} /></View><Pressable onPress={() => router.push('/checkout')} accessibilityRole="button" accessibilityLabel="Открыть корзину" style={styles.cartPanelButton}><Text style={styles.cartPanelButtonText}>В корзину</Text><Ionicons name="arrow-forward" size={15} color="white" /></Pressable></View>}
    {toasts.length > 0 && <View pointerEvents="box-none" style={styles.toastLayer}><View style={styles.toastStack}>{toasts.map(item => <ToastNotice key={item.id} image={item.image} onPress={() => { removeToast(item.id); router.push('/checkout'); }} />)}</View></View>}
    <AppModal visible={detailVisible} onClose={() => setDetailVisible(false)} handleOverlay>{selected && <DetailPage key={`${selected.kind}:${selected.id}`} {...selected} onClose={() => setDetailVisible(false)} onAdded={image => setTimeout(() => showAdded(image), 400)} />}</AppModal>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas }, main: { flex: 1 },
  nav: { height: 68, flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.line, paddingBottom: 5 }, navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }, navLabel: { fontSize: 10, fontWeight: '700', color: colors.muted }, navActive: { color: colors.primary },
  cartBadge: { position: 'absolute', top: -7, right: -10, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 3, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }, cartBadgeText: { color: 'white', fontSize: 9, fontWeight: '800' },
  cartPanel: { position: 'absolute', bottom: 77, left: 20, right: 20, height: 54, borderRadius: 18, paddingHorizontal: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', elevation: 8, shadowColor: '#173929', shadowOpacity: .12, shadowRadius: 14, shadowOffset: { width: 0, height: 6 } }, cartPanelIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, cartPanelButton: { height: 38, borderRadius: 12, paddingHorizontal: 14, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', gap: 6 }, cartPanelButtonText: { color: 'white', fontSize: 12, fontWeight: '800' },
  toastLayer: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', zIndex: 10 }, toastStack: { alignItems: 'center', gap: 8 }, toast: { minWidth: 238, height: 86, borderRadius: 43, backgroundColor: 'rgba(255,255,255,.97)', flexDirection: 'row', alignItems: 'center', padding: 9, paddingRight: 30, gap: 17, elevation: 12, shadowColor: '#173929', shadowOpacity: .2, shadowRadius: 22, shadowOffset: { width: 0, height: 9 } }, toastImage: { width: 68, height: 68, borderRadius: 34 }, toastText: { color: colors.ink, fontSize: 16, lineHeight: 20, fontWeight: '600' },
});

function ToastNotice({ image, onPress }: { image: ImageSourcePropType; onPress: () => void }) {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.spring(progress, { toValue: 1, useNativeDriver: true, damping: 16, stiffness: 180 }).start(); }, [progress]);
  return <Animated.View style={{ opacity: progress, transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }) }, { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [.94, 1] }) }] }}><Pressable accessibilityRole="button" accessibilityLabel="Добавлено в корзину. Открыть корзину" onPress={onPress} style={styles.toast}><Image source={image} style={styles.toastImage} /><Text style={styles.toastText}>Добавлено{`\n`}в корзину</Text></Pressable></Animated.View>;
}
