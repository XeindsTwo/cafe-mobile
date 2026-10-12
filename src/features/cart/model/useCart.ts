import { useMemo, useState } from 'react';
import { Meal } from '../../../entities/meal/model/types';

export type CartItem = { meal: Meal; quantity: number };
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);
  const add = (meal: Meal) => setItems(current => {
    const existing = current.find(item => item.meal.menuItemId === meal.menuItemId);
    return existing ? current.map(item => item.meal.menuItemId === meal.menuItemId ? { ...item, quantity: item.quantity + 1 } : item) : [...current, { meal, quantity: 1 }];
  });
  const addMany = (newMeals: Meal[]) => setItems(current => newMeals.reduce<CartItem[]>((next, meal) => {
    const existing = next.find(item => item.meal.menuItemId === meal.menuItemId);
    return existing ? next.map(item => item.meal.menuItemId === meal.menuItemId ? { ...item, quantity: item.quantity + 1 } : item) : [...next, { meal, quantity: 1 }];
  }, current));
  const decrease = (meal: Meal) => setItems(current => current.map(item => item.meal.menuItemId === meal.menuItemId ? { ...item, quantity: item.quantity - 1 } : item).filter(item => item.quantity > 0));
  const clear = () => setItems([]);
  const count = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const total = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.meal.price, 0), [items]);
  return { items, add, addMany, decrease, clear, count, total };
}
