import type { OrderCreate } from '../../../shared/api/serverContract';
export type LocalOrder = { id: string; total: number; count: number; createdAt: string; request: OrderCreate; addressText: string; items: { name: string; quantity: number; price: number }[] };
export const ordersStorageKey = 'cafe:orders:v1';
export function readLocalOrders(value: string | null): LocalOrder[] {
  if (!value) return [];
  const data: unknown = JSON.parse(value);
  if (!Array.isArray(data) || !data.every(order => order && typeof order.id === 'string' && typeof order.total === 'number' && typeof order.addressText === 'string' && typeof order.createdAt === 'string' && order.request && typeof order.request.delivery_date === 'string' && typeof order.request.delivery_time === 'string' && Array.isArray(order.items) && order.items.every((item: LocalOrder['items'][number]) => item && typeof item.name === 'string' && typeof item.quantity === 'number' && typeof item.price === 'number'))) throw new Error('Не удалось прочитать историю заказов.');
  return data;
}
