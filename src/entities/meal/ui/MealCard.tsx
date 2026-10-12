import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../../../shared/ui/typography';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Meal } from '../model/types';
import { colors } from '../../../shared/ui/theme';

type Props = { meal: Meal; index: number; onOpen: () => void; onAdd: () => void };
export function MealCard({ meal, index, onOpen, onAdd }: Props) {
  return <Animated.View entering={FadeInDown.delay(Math.min(index, 4) * 45).duration(280)} style={styles.card}>
    <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`Подробнее: ${meal.name}`} style={styles.body}><Image source={meal.image} style={styles.image} /><View style={styles.copy}><Text style={styles.name} numberOfLines={1}>{meal.name}</Text><Text style={styles.meta}>{meal.weight} · {meal.category}</Text><Text style={styles.price}>{meal.price} ₽</Text></View></Pressable>
    <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel={`Добавить ${meal.name}`} style={styles.add}><Ionicons name="add" size={21} color="white" /></Pressable>
  </Animated.View>;
}

const styles = StyleSheet.create({
  card: { minHeight: 92, marginBottom: 9, backgroundColor: colors.surface, borderRadius: 17, padding: 9, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: 8 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }, image: { width: 76, height: 74, borderRadius: 13, backgroundColor: colors.sage }, copy: { flex: 1 }, name: { color: colors.ink, fontSize: 14, fontWeight: '800' }, meta: { color: colors.muted, fontSize: 11, marginTop: 5 }, price: { color: colors.ink, fontSize: 15, fontWeight: '800', marginTop: 6 }, add: { width: 42, height: 42, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
