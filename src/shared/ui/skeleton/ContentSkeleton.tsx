import { useEffect, useState, type ReactNode } from 'react';
import { Animated, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

function Pulse({ children }: { children: ReactNode }) {
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: .48, duration: 850, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 850, useNativeDriver: true }),
    ]));
    animation.start();
    return () => animation.stop();
  }, [opacity]);
  return <Animated.View style={{ opacity }} accessibilityLabel="Загрузка содержимого">{children}</Animated.View>;
}

function Block({ style }: { style: StyleProp<ViewStyle> }) {
  return <LinearGradient colors={['#E6EAE7', '#FAFBFA', '#E6EAE7']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.block, style]} />;
}

export function MenuSkeleton({ categories, sets, meals, showSets, cardWidth }: { categories: number; sets: number; meals: number; showSets: boolean; cardWidth: number }) {
  return <Pulse>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories} scrollEnabled={false}>{Array.from({ length: categories }, (_, index) => <View key={index} style={styles.category}><Block style={styles.categoryImage} /><Block style={styles.categoryLabel} /></View>)}</ScrollView>
    {showSets && <><View style={styles.heading}><Block style={{ width: 168, height: 21 }} /></View>{sets ? <View style={styles.sets}>{Array.from({ length: sets }, (_, index) => <View key={index} style={[styles.setCard, { width: cardWidth }]}><Block style={{ width: '100%', height: 135, borderRadius: 0 }} /><View style={styles.setCopy}><Block style={{ width: '82%', height: 15 }} /><Block style={{ width: '95%', height: 11, marginTop: 9 }} /><Block style={{ width: '70%', height: 11, marginTop: 5 }} /><Block style={{ width: '45%', height: 17, marginTop: 23 }} /></View><Block style={styles.setButton} /></View>)}</View> : <View style={styles.emptyCard}><Block style={{ width: 148, height: 18 }} /><Block style={{ width: 230, height: 13, marginTop: 9 }} /></View>}</>}
    <View style={styles.heading}><Block style={{ width: 115, height: 21 }} /></View>
    {meals ? <View style={styles.meals}>{Array.from({ length: meals }, (_, index) => <View key={index} style={styles.mealCard}><Block style={{ width: 76, height: 74, borderRadius: 13 }} /><View style={styles.mealCopy}><Block style={{ width: '82%', height: 15 }} /><Block style={{ width: '61%', height: 11, marginTop: 7 }} /><Block style={{ width: '36%', height: 15, marginTop: 9 }} /></View><Block style={{ width: 42, height: 42, borderRadius: 14 }} /></View>)}</View> : <View style={styles.emptyCard}><Block style={{ width: 148, height: 18 }} /><Block style={{ width: 230, height: 13, marginTop: 9 }} /></View>}
  </Pulse>;
}

export function HomeMealsSkeleton({ count, cardWidth = 126 }: { count: number; cardWidth?: number }) {
  return <Pulse><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.homeMeals} scrollEnabled={false}>{Array.from({ length: count }, (_, index) => <View key={index} style={[styles.homeCard, { width: cardWidth }]}><Block style={{ width: '100%', height: 90, borderRadius: 0 }} /><View style={styles.homeCopy}><Block style={{ width: '82%', height: 13 }} /><Block style={{ width: '51%', height: 10, marginTop: 7 }} /><View style={styles.homeBottom}><Block style={{ width: '45%', height: 14 }} /><Block style={{ width: 32, height: 32, borderRadius: 11 }} /></View></View></View>)}</ScrollView></Pulse>;
}

export function DetailSkeleton({ height }: { height: number }) {
  return <Pulse><View style={[styles.detail, { height }]}><Block style={{ width: '100%', height: 268, borderRadius: 0 }} /><View style={styles.detailInfo}><View style={styles.detailHeading}><Block style={{ width: '67%', height: 28 }} /><Block style={{ width: 69, height: 24 }} /></View><Block style={{ width: 75, height: 13, marginTop: 11 }} /><Block style={{ width: '68%', height: 15, marginTop: 22 }} /><Block style={{ width: '61%', height: 15, marginTop: 7 }} /><Block style={{ width: 88, height: 19, marginTop: 28 }} /><View style={styles.detailIngredients}><Block style={{ width: 96, height: 42, borderRadius: 13 }} /><Block style={{ width: 112, height: 42, borderRadius: 13 }} /></View></View><View style={styles.detailFooter}><Block style={{ width: 150, height: 42, borderRadius: 14, alignSelf: 'center' }} /><Block style={{ width: '100%', height: 55, borderRadius: 15, marginTop: 13 }} /></View></View></Pulse>;
}

const styles = StyleSheet.create({
  block: { backgroundColor: '#EDF0ED', borderRadius: 8 },
  categories: { paddingHorizontal: 20, gap: 14, paddingVertical: 6 }, category: { minWidth: 59, alignItems: 'center', gap: 6 }, categoryImage: { width: 58, height: 58, borderRadius: 29 }, categoryLabel: { width: 45, height: 12 },
  heading: { height: 36, marginHorizontal: 20, marginTop: 24, marginBottom: 12, justifyContent: 'center' },
  sets: { flexDirection: 'row', gap: 10, paddingHorizontal: 20 }, setCard: { height: 294, borderRadius: 17, borderWidth: 1, borderColor: '#E7ECE8', overflow: 'hidden', backgroundColor: 'white' }, setCopy: { height: 105, paddingHorizontal: 10, paddingTop: 10 }, setButton: { height: 43, marginHorizontal: 8, borderRadius: 12 }, emptyCard: { height: 108, marginHorizontal: 20, borderRadius: 17, backgroundColor: '#F0F7F1', alignItems: 'center', justifyContent: 'center' },
  meals: { paddingHorizontal: 20 }, mealCard: { height: 92, marginBottom: 9, borderRadius: 17, borderWidth: 1, borderColor: '#E7ECE8', padding: 9, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'white' }, mealCopy: { flex: 1 },
  homeMeals: { flexDirection: 'row', gap: 9, paddingHorizontal: 20 }, homeCard: { height: 176, borderRadius: 15, borderWidth: 1, borderColor: '#E7ECE8', overflow: 'hidden', backgroundColor: 'white' }, homeCopy: { paddingHorizontal: 8, paddingTop: 7 }, homeBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  detail: { backgroundColor: 'white' }, detailInfo: { flex: 1, paddingHorizontal: 22, paddingTop: 20 }, detailHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, detailIngredients: { flexDirection: 'row', gap: 8, marginTop: 13 }, detailFooter: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 8, borderTopWidth: 1, borderTopColor: '#E7ECE8' },
});
