import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalOrder, ordersStorageKey, readLocalOrders } from '../../../entities/order/model/localOrder';
import { DeliveryDraft, emptyDelivery } from '../../../features/checkout/model/checkout';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { useCart } from '../../../features/cart/model/useCart';
import { OrderCreate } from '../../../shared/api/serverContract';
import { firstDeliveryDate } from '../../../entities/meal/model/demoDay';

type Session = { cart: ReturnType<typeof useCart>; orders: LocalOrder[]; placeOrder: (request: OrderCreate, addressText: string) => Promise<LocalOrder>; ordersReady: boolean; ordersError: string; retryOrders: () => Promise<void>; deliveryDraft: DeliveryDraft; setDeliveryDraft: (draft: DeliveryDraft) => void; deliveryDate: string; setDeliveryDate: (date: string) => void; resetAllData: () => Promise<void>; menuView: 'sets' | 'dishes'; setMenuView: (view: 'sets' | 'dishes') => void };
const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children, resetAllData }: { children: ReactNode; resetAllData: () => Promise<void> }) {
  const cart = useCart();
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [ordersReady, setOrdersReady] = useState(false);
  const [ordersError, setOrdersError] = useState('');
  const [deliveryDraft, setDeliveryDraft] = useState<DeliveryDraft>(emptyDelivery);
  const saving = useRef(false);
  const retryOrders = () => AsyncStorage.getItem(ordersStorageKey)
    .then(raw => { setOrders(readLocalOrders(raw)); setOrdersReady(true); setOrdersError(''); })
    .catch(() => { setOrdersError('Не удалось загрузить историю. Попробуйте ещё раз.'); });
  useEffect(() => { void retryOrders(); }, []);
  const [menuView, setMenuView] = useState<'sets' | 'dishes'>('sets');
  const [deliveryDate, setDeliveryDate] = useState(firstDeliveryDate);
  const placeOrder = async (request: OrderCreate, addressText: string) => {
    if (saving.current) throw new Error('Заказ уже сохраняется.');
    if (!ordersReady) throw new Error('История ещё не загружена. Попробуйте ещё раз.');
    if (!cart.count) throw new Error('Корзина пуста.');
    if (request.delivery_date !== deliveryDate || request.items.length !== cart.items.length || request.items.some(item => !cart.items.some(row => row.meal.menuItemId === item.menu_item_id && row.quantity === item.quantity))) throw new Error('Корзина изменилась. Проверьте заказ ещё раз.');
    saving.current = true;
    try {
      const order: LocalOrder = { id: `${Math.max(Date.now(), Number(orders[0]?.id ?? 0) + 1)}`, total: cart.total, count: cart.count, createdAt: new Date().toISOString(), request, addressText, items: cart.items.map(item => ({ name: item.meal.name, quantity: item.quantity, price: item.meal.price })) };
      const updated = [order, ...orders];
      try { await AsyncStorage.setItem(ordersStorageKey, JSON.stringify(updated)); }
      catch { throw new Error('Не удалось сохранить заказ на устройстве. Корзина сохранена — попробуйте ещё раз.'); }
      setOrders(updated);
      cart.clear();
      setDeliveryDraft(current => ({ ...current, comment: '', slot: '' }));
      return order;
    } finally { saving.current = false; }
  };
  return <SessionContext.Provider value={{ cart, orders, placeOrder, ordersReady, ordersError, retryOrders, deliveryDraft, setDeliveryDraft, deliveryDate, setDeliveryDate, resetAllData, menuView, setMenuView }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('SessionProvider is missing');
  return session;
}
