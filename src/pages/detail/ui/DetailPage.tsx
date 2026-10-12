import { useEffect, useState } from 'react';
import { Image, ImageSourcePropType, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../../shared/ui/typography';
import { Ionicons } from '@expo/vector-icons';
import { getDemoDay } from '../../../entities/meal/model/demoDay';
import { Meal } from '../../../entities/meal/model/types';
import { SetPhoto } from '../../../entities/meal/ui/SetPhoto';
import { colors } from '../../../shared/ui/theme';
import { DetailSkeleton } from '../../../shared/ui/skeleton/ContentSkeleton';
import { useSession } from '../../../widgets/app-shell/model/Session';

export function DetailPage({ kind, id, onClose, onAdded }: { kind: 'meal' | 'set'; id: string; onClose: () => void; onAdded: (image: ImageSourcePropType) => void }) {
  const { height, width } = useWindowDimensions();
  const { cart, deliveryDate } = useSession();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  useEffect(() => { const timer = setTimeout(() => setLoading(false), 360); return () => clearTimeout(timer); }, []);
  const day = getDemoDay(deliveryDate);
  const meal = kind === 'meal' ? day.meals.find(item => item.id === id) : undefined;
  const set = kind === 'set' ? day.sets.find(item => String(item.id) === id && item.available) : undefined;
  const parts = set?.mealIds.map(itemId => day.meals.find(item => item.id === itemId)).filter((item): item is Meal => !!item) ?? [];
  const product = meal ?? set;
  const add = () => {
    if (meal) cart.addMany(Array.from({ length: quantity }, () => meal));
    if (set) cart.addMany(Array.from({ length: quantity }, () => parts).flat());
    if (meal || parts[0]) onAdded((meal ?? parts[0]).image);
    onClose();
  };

  const sheetHeight = Math.min(height * .83, 740);
  if (loading) return <DetailSkeleton height={sheetHeight} />;
  return <View style={[styles.root, { height: sheetHeight }]}>
    {!product ? <View style={styles.missing}><Text style={styles.title}>Позиция недоступна</Text><Text style={styles.body}>Вернитесь в меню и выберите блюдо на текущую дату.</Text><Pressable onPress={onClose} style={styles.action}><Text style={styles.actionText}>Вернуться в меню</Text></Pressable></View> : <>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>{meal ? <Image source={meal.image} style={styles.heroImage} resizeMode="cover" /> : <SetPhoto meals={parts} height={268} />}<View style={styles.heroShade} /><Pressable onPress={onClose} style={styles.back} accessibilityRole="button" accessibilityLabel="Закрыть детали"><Ionicons name="close" size={22} color={colors.ink} /></Pressable><View style={styles.heroBadge}><Ionicons name={meal ? 'restaurant-outline' : 'grid-outline'} size={14} color={colors.primary} /><Text style={styles.heroBadgeText}>{meal ? meal.category : 'Готовый комплекс'}</Text></View></View>
        <View style={styles.info}><View style={styles.heading}><Text style={styles.title}>{product.name}</Text><Text style={styles.price}>{meal ? meal.price : set!.total} ₽</Text></View><Text style={styles.meta}>{meal ? meal.weight : `${parts.length} блюда в наборе`}</Text><Text style={[styles.body, meal && { maxWidth: width * .68 }]}>{product.description}</Text>
          {meal ? <><Text style={styles.sectionTitle}>Состав</Text><View style={styles.ingredients}>{meal.ingredients.map(ingredient => <View key={ingredient} style={styles.ingredient}><Ionicons name="leaf-outline" size={16} color={colors.primary} /><Text style={styles.ingredientText}>{ingredient}</Text></View>)}</View></> : <><Text style={styles.sectionTitle}>Внутри комплекса</Text>{parts.map(part => <View key={part.id} style={styles.part}><Image source={part.image} style={styles.partImage} /><View style={styles.partCopy}><Text style={styles.partName}>{part.name}</Text><Text style={styles.partMeta}>{part.weight} · {part.category}</Text></View><Ionicons name="checkmark-circle" size={20} color={colors.primary} /></View>)}<Text style={styles.setNote}>Состав набора фиксирован. Другие блюда можно добавить отдельно в меню.</Text></>}
        </View>
      </ScrollView>
      <View style={styles.footer}><View style={styles.quantity}><Pressable onPress={() => setQuantity(value => Math.max(1, value - 1))} disabled={quantity === 1} accessibilityState={{ disabled: quantity === 1 }} style={[styles.quantityButton, quantity === 1 && styles.quantityDisabled]} accessibilityRole="button" accessibilityLabel="Уменьшить количество"><Ionicons name="remove" size={21} color={quantity === 1 ? colors.muted : colors.primary} /></Pressable><Text style={styles.quantityValue}>{quantity}</Text><Pressable onPress={() => setQuantity(value => Math.min(10, value + 1))} disabled={quantity === 10} accessibilityState={{ disabled: quantity === 10 }} style={[styles.quantityButton, quantity === 10 && styles.quantityDisabled]} accessibilityRole="button" accessibilityLabel="Увеличить количество"><Ionicons name="add" size={21} color={quantity === 10 ? colors.muted : colors.primary} /></Pressable></View><Pressable onPress={add} style={styles.action} accessibilityRole="button"><Ionicons name="basket-outline" size={19} color="white" /><Text style={styles.actionText}>В корзину</Text><Text style={styles.actionPrice}>{(meal ? meal.price : set!.total) * quantity} ₽</Text><Ionicons name="arrow-forward" size={17} color="white" /></Pressable></View>
    </>}
  </View>;
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.surface }, content: { paddingBottom: 30 }, hero: { height: 268, backgroundColor: colors.sage }, heroImage: { width: '100%', height: '100%' }, heroShade: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(5,28,17,.07)' }, back: { position: 'absolute', top: 18, right: 18, width: 44, height: 44, borderRadius: 14, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' }, heroBadge: { position: 'absolute', bottom: 15, left: 20, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 10, backgroundColor: 'white' }, heroBadgeText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  info: { paddingHorizontal: 22, paddingTop: 20 }, heading: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, justifyContent: 'space-between' }, title: { flex: 1, color: colors.ink, fontSize: 26, lineHeight: 31, fontWeight: '800', letterSpacing: -.6 }, price: { color: colors.ink, fontSize: 22, fontWeight: '800' }, meta: { color: colors.muted, fontSize: 13, marginTop: 5 }, body: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 17 }, sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 25, marginBottom: 13 }, ingredients: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, ingredient: { minHeight: 42, paddingHorizontal: 11, borderRadius: 13, backgroundColor: colors.sage, flexDirection: 'row', alignItems: 'center', gap: 6 }, ingredientText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  part: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.line }, partImage: { width: 58, height: 58, borderRadius: 12 }, partCopy: { flex: 1 }, partName: { color: colors.ink, fontSize: 14, fontWeight: '700' }, partMeta: { color: colors.muted, fontSize: 12, marginTop: 5 }, setNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 16 },
  footer: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 8, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: 'white', gap: 13 }, quantity: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 }, quantityButton: { width: 42, height: 42, backgroundColor: colors.accentSoft, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, quantityDisabled: { backgroundColor: '#F0F2F0', opacity: .55 }, quantityValue: { color: colors.ink, fontSize: 17, fontWeight: '800', minWidth: 20, textAlign: 'center' }, action: { height: 55, backgroundColor: colors.primary, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, gap: 8 }, actionText: { color: 'white', fontSize: 15, fontWeight: '800' }, actionPrice: { color: 'white', fontSize: 15, fontWeight: '800', marginLeft: 'auto' }, missing: { flex: 1, justifyContent: 'center', padding: 24 },
});
