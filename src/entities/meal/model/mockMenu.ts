import { Category, Meal } from './types';

export const categories: Category[] = ['Все', 'Завтраки', 'Горячее', 'Салаты', 'Напитки'];
// Локальные демо-позиции дневного меню. menuItemId — не id блюда из каталога.
export const meals: Meal[] = [
  { id: '1', menuItemId: 101, name: 'Тост с яйцом', description: 'Хрустящий тост с мягким яйцом и авокадо. Лёгкий и сытный завтрак.', ingredients: ['Цельнозерновой хлеб', 'Яйцо', 'Авокадо'], category: 'Завтраки', price: 240, weight: '220 г', image: require('../../../../assets/meals/toast.jpg'), available: true, featured: true },
  { id: '2', menuItemId: 102, name: 'Боул с рыбой', description: 'Сбалансированный боул с рыбой, крупой и свежими овощами.', ingredients: ['Рыба', 'Крупа', 'Стручковая фасоль', 'Свежие овощи'], category: 'Горячее', price: 390, weight: '350 г', image: require('../../../../assets/meals/bowl.jpg'), available: true },
  { id: '3', menuItemId: 103, name: 'Курица с овощами', description: 'Запечённое куриное филе с овощами и душистыми травами.', ingredients: ['Куриное филе', 'Овощи', 'Травы'], category: 'Горячее', price: 390, weight: '320 г', image: require('../../../../assets/meals/chicken.jpg'), available: true },
  { id: '4', menuItemId: 104, name: 'Салат с авокадо', description: 'Свежий овощной салат с нутом и мягким авокадо.', ingredients: ['Салатные листья', 'Томаты', 'Нут', 'Авокадо'], category: 'Салаты', price: 250, weight: '180 г', image: require('../../../../assets/meals/salad.jpg'), available: true },
  { id: '5', menuItemId: 105, name: 'Капучино', description: 'Эспрессо с нежной молочной пеной.', ingredients: ['Эспрессо', 'Молоко'], category: 'Напитки', price: 170, weight: '250 мл', image: require('../../../../assets/meals/coffee.jpg'), available: true },
];
