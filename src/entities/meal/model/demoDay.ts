import { PublicMenu } from '../../../shared/api/serverContract';
import { meals, categories } from './mockMenu';
import { Category, Meal } from './types';

export { categories };
export type DemoSet = { id: number; name: string; description: string; mealIds: string[]; image: Meal['image']; available: boolean; total: number };
export type DemoDay = { date: string; state: 'ready' | 'empty' | 'unavailable'; menu: PublicMenu | null; meals: Meal[]; sets: DemoSet[] };

const dayOffset = (date: string) => {
  const today = new Date(); today.setHours(12, 0, 0, 0);
  const selected = new Date(`${date}T12:00:00`);
  return Math.round((selected.getTime() - today.getTime()) / 86400000);
};

export const demoDates = () => {
  const first = new Date(); first.setHours(12, 0, 0, 0); first.setDate(first.getDate() + 1);
  if (first.getDay() === 0) first.setDate(first.getDate() + 1);
  if (first.getDay() === 6) first.setDate(first.getDate() + 2);
  first.setDate(first.getDate() - (first.getDay() - 1));
  return Array.from({ length: 6 }, (_, index) => {
    const day = new Date(first); day.setDate(first.getDate() + index);
    return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
  });
};
export const firstDeliveryDate = () => demoDates().find(date => dayOffset(date) > 0 && getDemoDay(date).state === 'ready') ?? demoDates()[0];

export const formatDeliveryDate = (date: string) => new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date(`${date}T12:00:00`));
export const formatShortDate = (date: string) => new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric' }).format(new Date(`${date}T12:00:00`));

export function getDemoDay(date: string): DemoDay {
  const offset = dayOffset(date);
  const weekday = new Date(`${date}T12:00:00`).getDay();
  const state: DemoDay['state'] = offset < 1 || weekday === 0 ? 'unavailable' : weekday === 6 ? 'empty' : 'ready';
  // Friday has dishes but no complete set, so this state can be reviewed.
  const availableMeals = state !== 'ready' ? [] : weekday === 5 ? meals.filter(meal => meal.id === '1' || meal.id === '5') : meals;
  const menu: PublicMenu | null = state === 'unavailable' ? null : {
    id: Number(date.replaceAll('-', '')),
    menu_date: date,
    items: availableMeals.map(meal => ({
      id: meal.menuItemId,
      price: meal.price.toFixed(2),
      dish: {
        id: Number(meal.id), category_id: categories.indexOf(meal.category as Category), name: meal.name,
        description: meal.description, composition: meal.ingredients.join(', '), weight_grams: Number.parseInt(meal.weight, 10),
        base_price: meal.price.toFixed(2), calories_kcal: null, proteins_g: null, fats_g: null, carbohydrates_g: null,
        images: [],
      },
    })),
  };
  const templates = [
    { id: 1, name: 'Обеденный набор', description: 'Курица с овощами, салат и напиток', mealIds: ['3', '4', '5'], image: meals[2].image },
    { id: 2, name: 'Лёгкий обед', description: 'Боул с рыбой и салат', mealIds: ['2', '4'], image: meals[1].image },
  ];
  const sets = templates.map(template => {
    const parts = template.mealIds.map(id => availableMeals.find(meal => meal.id === id));
    return { ...template, available: parts.every(Boolean), total: parts.reduce((sum, meal) => sum + (meal?.price ?? 0), 0) };
  });
  return { date, state, menu, meals: availableMeals, sets };
}
