import type { OrderCreate } from '../../../shared/api/serverContract';

export type DeliveryDraft = { city: string; street: string; house: string; apartment: string; entrance: string; floor: string; slot: string; comment: string };
export const emptyDelivery: DeliveryDraft = { city: '', street: '', house: '', apartment: '', entrance: '', floor: '', slot: '', comment: '' };
export const deliverySlots = ['12:00', '13:00', '18:00'];
export function deliveryErrors(draft: DeliveryDraft) {
  const errors: Partial<Record<keyof DeliveryDraft, string>> = {};
  for (const key of ['city', 'street', 'house'] as const) if (!draft[key].trim()) errors[key] = 'Заполните это поле';
  for (const [key, max] of [['city', 100], ['street', 200], ['house', 30], ['apartment', 30], ['entrance', 30], ['floor', 30], ['comment', 2000]] as const) {
    if (draft[key].trim().length > max) errors[key] = `Не больше ${max} символов`;
  }
  if (!deliverySlots.includes(draft.slot)) errors.slot = 'Выберите время доставки';
  return errors;
}
export function addressText(draft: DeliveryDraft) {
  return [draft.city.trim(), `ул. ${draft.street.trim()}`, `д. ${draft.house.trim()}`,
    draft.apartment.trim() && `кв. ${draft.apartment.trim()}`, draft.entrance.trim() && `подъезд ${draft.entrance.trim()}`,
    draft.floor.trim() && `этаж ${draft.floor.trim()}`].filter(Boolean).join(', ');
}
export function orderRequest(date: string, draft: DeliveryDraft, items: { meal: { menuItemId: number }; quantity: number }[]): OrderCreate {
  if (Object.keys(deliveryErrors(draft)).length) throw new Error('Проверьте адрес и время доставки.');
  if (!items.length) throw new Error('Добавьте блюда в корзину.');
  const ids = new Set<number>();
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || !Number.isInteger(item.meal.menuItemId) || item.meal.menuItemId < 1 || ids.has(item.meal.menuItemId)) throw new Error('Состав корзины изменился. Вернитесь в корзину.');
    ids.add(item.meal.menuItemId);
  }
  return { delivery_date: date, delivery_time: `${draft.slot}:00`, address_id: 1,
    // Local adapter only. API integration must create/select an owned address first.
    items: items.map(item => ({ menu_item_id: item.meal.menuItemId, quantity: item.quantity })), comment: draft.comment.trim() || null };
}
