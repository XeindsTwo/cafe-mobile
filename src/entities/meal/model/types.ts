import { ImageSourcePropType } from 'react-native';
export type Category = 'Все' | 'Завтраки' | 'Горячее' | 'Салаты' | 'Напитки';
export type Meal = { id: string; menuItemId: number; name: string; description: string; ingredients: string[]; category: Exclude<Category, 'Все'>; price: number; weight: string; image: ImageSourcePropType; available: boolean; featured?: boolean };
