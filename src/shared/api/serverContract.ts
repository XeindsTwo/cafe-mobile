// Mirrors the public FastAPI schemas on cafe-server/dev. Kept separate from local demo models.
export type BusinessId = number;
export type DecimalString = string;

export type DishImage = { id: BusinessId; url: string; sort_order: number; is_primary: boolean };
export type Dish = {
  id: BusinessId; category_id: BusinessId; name: string; description: string | null;
  composition: string | null; weight_grams: number | null; base_price: DecimalString;
  calories_kcal: DecimalString | null; proteins_g: DecimalString | null;
  fats_g: DecimalString | null; carbohydrates_g: DecimalString | null; images: DishImage[];
};
export type MenuItem = { id: BusinessId; price: DecimalString; dish: Dish };
export type PublicMenu = { id: BusinessId; menu_date: string; items: MenuItem[] };
export type OrderCreate = {
  delivery_date: string; delivery_time: string; address_id: BusinessId;
  items: { menu_item_id: BusinessId; quantity: number }[]; comment?: string | null;
};
export type OrderStatus = 'NEW' | 'CONFIRMED' | 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
export type OrderListItem = { id: BusinessId; status: OrderStatus; delivery_date: string; delivery_time: string; total: DecimalString; created_at: string };
