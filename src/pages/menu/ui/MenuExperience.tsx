import { useEffect, useState } from 'react';
import { Image, ImageSourcePropType, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { fontFamily, Text } from '../../../shared/ui/typography';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, interpolateColor, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { Category, Meal } from '../../../entities/meal/model/types';
import { MealCard } from '../../../entities/meal/ui/MealCard';
import { SetPhoto } from '../../../entities/meal/ui/SetPhoto';
import { categories, demoDates, formatDeliveryDate, getDemoDay } from '../../../entities/meal/model/demoDay';
import { AppModal } from '../../../shared/ui/modal/AppModal';
import { MenuSkeleton } from '../../../shared/ui/skeleton/ContentSkeleton';
import { colors } from '../../../shared/ui/theme';
import { hasLoadedContent, markContentLoaded } from '../../../shared/lib/contentCache';
import { useSession } from '../../../widgets/app-shell/model/Session';

type Props = { onOpen: (meal: Meal) => void; onOpenSet: (id: number) => void; onAdd: (meal: Meal) => void; onAddSet: (image: ImageSourcePropType) => void; onProfile: () => void };
const shortDay = (value: string) => new Intl.DateTimeFormat('ru-RU', { weekday: 'short' }).format(new Date(`${value}T12:00:00`));

export function MenuExperience({ onOpen, onOpenSet, onAdd, onAddSet, onProfile }: Props) {
  const { width } = useWindowDimensions();
  const { cart, deliveryDate, setDeliveryDate, menuView, setMenuView } = useSession();
  const [category, setCategory] = useState<Category>('Все');
  const [pendingDate, setPendingDate] = useState<string | null>(null);
  const day = getDemoDay(deliveryDate);
  const availableCategories = categories.filter(item => item === 'Все' || day.meals.some(meal => meal.category === item));
  const activeCategory = availableCategories.includes(category) ? category : 'Все';
  const filtered = day.meals.filter(meal => activeCategory === 'Все' || meal.category === activeCategory);
  const sets = day.sets.filter(set => set.available);
  const cardWidth = (width - 50) / 2;
  const dayWidth = (width - 40 - 5 * 6) / 6;
  const contentKey = `menu:${deliveryDate}:${activeCategory}:${menuView}`;
  const [loading, setLoading] = useState(() => !hasLoadedContent(contentKey));
  useEffect(() => {
    if (hasLoadedContent(contentKey)) { setLoading(false); return; }
    setLoading(true);
    const timer = setTimeout(() => { markContentLoaded(contentKey); setLoading(false); }, 480);
    return () => clearTimeout(timer);
  }, [contentKey]);
  const selectDate = (date: string) => {
    if (date === deliveryDate || getDemoDay(date).state === 'unavailable') return;
    if (cart.count) { setPendingDate(date); return; }
    setCategory('Все');
    setDeliveryDate(date);
  };
  const confirmDate = () => { if (!pendingDate) return; cart.clear(); setCategory('Все'); setDeliveryDate(pendingDate); setPendingDate(null); };
  const addSet = (ids: string[]) => {
    const contents = ids.map(id => day.meals.find(meal => meal.id === id)).filter((meal): meal is Meal => !!meal);
    if (contents.length === ids.length) { cart.addMany(contents); if (contents[0]) onAddSet(contents[0].image); }
  };
  const chooseCategory = (value: Category) => { const nextView = value === 'Все' ? 'sets' : 'dishes'; if (value === activeCategory && menuView === nextView) return; setCategory(value); setMenuView(nextView); };
  const showDishes = () => { setMenuView('dishes'); };

  return <View style={styles.root}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}><View><Text style={styles.title}>Меню</Text><View style={styles.dateCaption}><Ionicons name="calendar-outline" size={15} color={colors.primary} /><Text style={styles.dateCaptionText}>{formatDeliveryDate(deliveryDate)}</Text></View></View><Pressable onPress={onProfile} accessibilityRole="button" accessibilityLabel="Открыть профиль" style={styles.profile}><Ionicons name="person-outline" size={21} color={colors.ink} /></Pressable></View>
      <View style={styles.dateStrip}>{demoDates().map(date => <DateChip key={date} date={date} width={dayWidth} active={date === deliveryDate} disabled={getDemoDay(date).state === 'unavailable'} onPress={() => selectDate(date)} />)}</View>
      <View style={styles.sundayNote}><Ionicons name="time-outline" size={15} color={colors.muted} /><Text style={styles.sundayText}>Воскресенье — выходной у столовой</Text></View>
      {loading && day.state === 'ready' ? <MenuSkeleton categories={availableCategories.length} sets={sets.length} meals={filtered.length} showSets={menuView === 'sets'} cardWidth={cardWidth} /> : <Animated.View key={deliveryDate} entering={FadeIn.duration(260)}>
      {day.state === 'ready' && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{availableCategories.map(item => <CategoryChip key={item} item={item} photo={day.meals.find(meal => meal.category === item)?.image} active={item === activeCategory} onPress={() => chooseCategory(item)} />)}</ScrollView>}
      <Animated.View key={`${deliveryDate}:${activeCategory}:${menuView}`} entering={FadeInDown.duration(250)}>
      {day.state !== 'ready' ? <View style={styles.empty}><Ionicons name="calendar-outline" size={31} color={colors.primary} /><Text style={styles.emptyTitle}>{day.state === 'empty' ? 'Меню ещё не опубликовано' : 'Дата недоступна'}</Text><Text style={styles.emptyBody}>{day.state === 'empty' ? 'Для этого дня пока нет блюд и комплексов.' : 'На этот день доставка в демо-сценарии недоступна.'} Выберите другой день.</Text></View> : <>
        {menuView === 'sets' && <><View style={styles.sectionHead}><Text style={styles.sectionTitle}>Готовые комплексы</Text><Pressable onPress={showDishes} style={styles.sectionLink} accessibilityRole="button"><Text style={styles.sectionLinkText}>Все блюда</Text></Pressable></View>{sets.length ? <View style={styles.setGrid}>{sets.map((set, index) => <Animated.View key={set.id} entering={FadeInDown.delay(index * 65).duration(300)} style={[styles.setCard, { width: cardWidth }]}><Pressable onPress={() => onOpenSet(set.id)} accessibilityRole="button" accessibilityLabel={`Подробнее: ${set.name}`}><SetPhoto meals={set.mealIds.map(id => day.meals.find(meal => meal.id === id)).filter((meal): meal is Meal => !!meal)} height={135} /><View style={styles.setCopy}><Text style={styles.setName} numberOfLines={1}>{set.name}</Text><Text style={styles.setDescription} numberOfLines={2}>{set.description}</Text><Text style={styles.setMeta}>{set.mealIds.length} позиции</Text><Text style={styles.setPrice}>{set.total} ₽</Text></View></Pressable><Pressable onPress={() => addSet(set.mealIds)} accessibilityRole="button" accessibilityLabel={`Добавить ${set.name} в корзину`} style={styles.setButton}><Ionicons name="basket-outline" size={17} color="white" /><Text style={styles.setButtonText}>В корзину</Text></Pressable></Animated.View>)}</View> : <View style={styles.emptyCompact}><Text style={styles.emptyTitle}>Комплексов пока нет</Text><Text style={styles.emptyBody}>Соберите заказ из отдельных блюд этого дня.</Text></View>}</>}
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{activeCategory}</Text>{activeCategory !== 'Все' && <Pressable onPress={() => chooseCategory('Все')} style={styles.sectionLink} accessibilityRole="button"><Text style={styles.sectionLinkText}>Сбросить</Text></Pressable>}</View>
        {filtered.length ? <View style={styles.dishes}>{filtered.map((meal, index) => <MealCard key={meal.id} meal={meal} index={index} onOpen={() => onOpen(meal)} onAdd={() => onAdd(meal)} />)}</View> : <View style={styles.emptyCompact}><Text style={styles.emptyTitle}>В категории пусто</Text><Text style={styles.emptyBody}>На выбранную дату здесь нет доступных блюд.</Text></View>}
      </>}
      </Animated.View>
      </Animated.View>}
      <Text style={styles.demo}>Демо-меню · Доступность уточнит сервер после подключения</Text>
    </ScrollView>
    <AppModal visible={!!pendingDate} onClose={() => setPendingDate(null)} variant="dialog"><View style={styles.dialog}><Ionicons name="calendar-outline" size={30} color={colors.primary} /><Text style={styles.emptyTitle}>Сменить дату?</Text><Text style={styles.emptyBody}>Блюда в корзине привязаны к текущему меню. При смене даты корзина очистится.</Text><Pressable onPress={confirmDate} style={styles.confirmButton}><Text style={styles.confirmText}>Сменить и очистить корзину</Text></Pressable><Pressable onPress={() => setPendingDate(null)} style={styles.cancelButton}><Text style={styles.cancelText}>Оставить текущую дату</Text></Pressable></View></AppModal>
  </View>;
}

function DateChip({ date, width, active, disabled, onPress }: { date: string; width: number; active: boolean; disabled: boolean; onPress: () => void }) {
  const progress = useSharedValue(active ? 1 : 0);
  useEffect(() => { progress.value = withTiming(active ? 1 : 0, { duration: 230 }); }, [active, progress]);
  const animatedStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(progress.value, [0, 1], [colors.surface, colors.primary]), borderColor: interpolateColor(progress.value, [0, 1], [colors.line, colors.primary]), transform: [{ scale: 1 + progress.value * .03 }] }));
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={`Дата ${formatDeliveryDate(date)}`} accessibilityState={{ selected: active, disabled }} style={[styles.dayPress, { width }, disabled && styles.dayDisabled]}><Animated.View style={[styles.day, animatedStyle]}><Text style={[styles.weekday, active && styles.dayTextActive]}>{shortDay(date)}</Text><Text style={[styles.dayNumber, active && styles.dayTextActive]}>{Number(date.slice(-2))}</Text></Animated.View></Pressable>;
}

function CategoryChip({ item, photo, active, onPress }: { item: Category; photo?: ImageSourcePropType; active: boolean; onPress: () => void }) {
  const progress = useSharedValue(active ? 1 : 0);
  useEffect(() => { progress.value = withTiming(active ? 1 : 0, { duration: 250 }); }, [active, progress]);
  const labelColor = useAnimatedStyle(() => ({ color: interpolateColor(progress.value, [0, 1], [colors.muted, colors.primary]) }));
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }} style={styles.category}><View style={styles.categoryImage}>{photo ? <Image source={photo} style={styles.categoryPhoto} /> : <Ionicons name="grid-outline" size={20} color={active ? colors.primary : '#7F9F8A'} />}</View><Animated.Text style={[styles.categoryText, labelColor, { fontFamily: fontFamily.semiBold, fontWeight: 'normal' }]}>{item}</Animated.Text></Pressable>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas }, content: { paddingTop: 20, paddingBottom: 125 },
  header: { paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, title: { color: colors.ink, fontSize: 31, fontWeight: '800', letterSpacing: -.8 }, dateCaption: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 }, dateCaptionText: { color: colors.ink, fontSize: 13, fontWeight: '600', textTransform: 'capitalize' }, profile: { width: 44, height: 44, borderRadius: 15, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  dateStrip: { paddingHorizontal: 20, gap: 6, paddingTop: 19, flexDirection: 'row' }, dayPress: { height: 66 }, dayDisabled: { opacity: .4 }, day: { flex: 1, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line }, weekday: { color: colors.muted, fontSize: 10, textTransform: 'capitalize' }, dayNumber: { color: colors.ink, fontSize: 20, fontWeight: '800', marginTop: 2 }, dayTextActive: { color: 'white' }, sundayNote: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, marginTop: 11, marginBottom: 19 }, sundayText: { color: colors.muted, fontSize: 11 },
  categories: { paddingHorizontal: 20, gap: 14, paddingVertical: 6 }, category: { minWidth: 59, alignItems: 'center', gap: 6 }, categoryImage: { width: 58, height: 58, borderRadius: 29, backgroundColor: colors.accentSoft, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }, categoryPhoto: { width: '100%', height: '100%', borderRadius: 29 }, categoryText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 20, marginTop: 24, marginBottom: 12 }, sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', letterSpacing: -.3 }, sectionLink: { minHeight: 36, justifyContent: 'center' }, sectionLinkText: { color: colors.primary, fontSize: 12, fontWeight: '800' }, setGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 }, setCard: { backgroundColor: colors.surface, borderRadius: 17, overflow: 'hidden', borderWidth: 1, borderColor: colors.line, paddingBottom: 9 }, setCopy: { paddingHorizontal: 10, paddingTop: 10, minHeight: 105 }, setName: { color: colors.ink, fontSize: 14, fontWeight: '800' }, setDescription: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 4, height: 30 }, setMeta: { color: colors.muted, fontSize: 10, marginTop: 6 }, setPrice: { color: colors.ink, fontSize: 17, fontWeight: '800', marginTop: 3 }, setButton: { height: 43, marginHorizontal: 8, backgroundColor: colors.primary, borderRadius: 12, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center' }, setButtonText: { color: 'white', fontSize: 12, fontWeight: '800' }, dishes: { paddingHorizontal: 20 },
  empty: { margin: 20, padding: 30, borderRadius: 20, backgroundColor: colors.accentSoft, alignItems: 'center' }, emptyCompact: { marginHorizontal: 20, padding: 22, borderRadius: 17, backgroundColor: colors.accentSoft, alignItems: 'center' }, emptyTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: 7, textAlign: 'center' }, emptyBody: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7 }, demo: { color: colors.muted, fontSize: 11, textAlign: 'center', marginTop: 20, paddingHorizontal: 20 }, dialog: { padding: 24, alignItems: 'center' }, confirmButton: { minHeight: 52, width: '100%', borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginTop: 22 }, confirmText: { color: 'white', fontSize: 15, fontWeight: '700' }, cancelButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 5 }, cancelText: { color: colors.primary, fontWeight: '700' },
});
