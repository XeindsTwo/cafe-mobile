import { createContext, ReactNode, useContext, useState } from 'react';
import { useCart } from '../../../features/cart/model/useCart';
import { OrderCreate } from '../../../shared/api/serverContract';
import { firstDeliveryDate } from '../../../entities/meal/model/demoDay';

export type LocalOrder = { id: string; total: number; count: number; createdAt: string; request: OrderCreate; addressText: string; items: { name: string; quantity: number; price: number }[] };
type Session = { cart: ReturnType<typeof useCart>; orders: LocalOrder[]; placeOrder: (request: OrderCreate, addressText: string) => void; deliveryDate: string; setDeliveryDate: (date: string) => void; resetAllData: () => Promise<void>; menuView: 'sets' | 'dishes'; setMenuView: (view: 'sets' | 'dishes') => void };
const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children, resetAllData }: { children: ReactNode; resetAllData: () => Promise<void> }) {
  const cart = useCart();
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [menuView, setMenuView] = useState<'sets' | 'dishes'>('sets');
  const [deliveryDate, setDeliveryDate] = useState(firstDeliveryDate);
  const placeOrder = (request: OrderCreate, addressText: string) => {
    if (!cart.count) return;
    setOrders(current => [{ id: `${Date.now()}`, total: cart.total, count: cart.count, createdAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), request, addressText, items: cart.items.map(item => ({ name: item.meal.name, quantity: item.quantity, price: item.meal.price })) }, ...current]);
    cart.clear();
  };
  return <SessionContext.Provider value={{ cart, orders, placeOrder, deliveryDate, setDeliveryDate, resetAllData, menuView, setMenuView }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('SessionProvider is missing');
  return session;
}
