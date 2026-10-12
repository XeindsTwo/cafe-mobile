import { useRef, useState } from 'react';
import { ImageBackground, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Text } from '../../../shared/ui/typography';
import Animated, { FadeInDown, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { colors } from '../../../shared/ui/theme';

const slides = [
  { image: require('../../../../assets/meals/toast.jpg'), title: 'Еда, которую\nхочется выбрать', body: 'Меню на сегодня всегда под рукой. Листайте, находите своё и собирайте обед.' },
  { image: require('../../../../assets/meals/bowl.jpg'), title: 'Блюда на\nкаждый день', body: 'Состав, вес и цена — всё видно заранее. Выбирайте без спешки.' },
  { image: require('../../../../assets/meals/chicken.jpg'), title: 'Заказ —\nпара касаний', body: 'Добавьте блюда в корзину и оформите доставку к удобному времени.' },
];

export function OnboardingPage({ onFinish }: { onFinish: () => void }) {
  const { width, height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const progress = useSharedValue(0);
  const list = useRef<Animated.FlatList<(typeof slides)[number]>>(null);
  const onScroll = useAnimatedScrollHandler({ onScroll: event => { progress.value = event.contentOffset.x; } });
  const next = () => index === slides.length - 1 ? onFinish() : list.current?.scrollToIndex({ index: index + 1, animated: true });
  const imageHeight = Math.max(230, Math.min(height * .44, 430));

  return <View style={styles.root}>
    <View style={styles.header}><View style={styles.brand}><View style={styles.brandDot} /><Text style={styles.brandText}>Столовая</Text></View><Pressable onPress={onFinish} hitSlop={12}><Text style={styles.skip}>Пропустить</Text></Pressable></View>
    <Animated.FlatList ref={list} data={slides} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16} keyExtractor={(_, slideIndex) => String(slideIndex)} onMomentumScrollEnd={event => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))} renderItem={({ item, index: slideIndex }) =>
      <View style={[styles.slide, { width }]}>
        <View style={[styles.imageWrap, { height: imageHeight }]}><ImageBackground source={item.image} resizeMode="cover" style={styles.image} imageStyle={styles.imageInner}><View style={styles.photoTag}><Text style={styles.photoTagText}>0{slideIndex + 1} / 0{slides.length}</Text></View></ImageBackground></View>
        <Animated.View entering={FadeInDown.duration(450)} style={styles.copy}><Text style={styles.title}>{item.title}</Text><Text style={styles.body}>{item.body}</Text></Animated.View>
      </View>
    } />
    <View style={styles.bottom}><View style={styles.dots}>{slides.map((_, dotIndex) => <Dot key={dotIndex} index={dotIndex} progress={progress} width={width} />)}</View><Pressable accessibilityRole="button" onPress={next} style={styles.button}><Text style={styles.buttonText}>{index === slides.length - 1 ? 'Открыть меню' : 'Далее'}</Text><Text style={styles.arrow}>→</Text></Pressable></View>
  </View>;
}

function Dot({ index, progress, width }: { index: number; progress: SharedValue<number>; width: number }) {
  const style = useAnimatedStyle(() => { const distance = Math.min(1, Math.abs(progress.value / width - index)); return { width: interpolate(distance, [0, 1], [26, 7]), opacity: interpolate(distance, [0, 1], [1, .32]) }; });
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: { height: 66, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 }, brandDot: { width: 13, height: 13, borderRadius: 5, backgroundColor: colors.accent }, brandText: { color: colors.ink, fontSize: 18, fontWeight: '800' }, skip: { color: colors.muted, fontWeight: '600', fontSize: 14 },
  slide: { flex: 1, paddingHorizontal: 20 }, imageWrap: { width: '100%', borderRadius: 28, overflow: 'hidden', backgroundColor: colors.sage }, image: { flex: 1, justifyContent: 'flex-end' }, imageInner: { borderRadius: 28 }, photoTag: { alignSelf: 'flex-start', margin: 18, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.92)' }, photoTagText: { color: colors.ink, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  copy: { paddingHorizontal: 7, paddingTop: 22, alignItems: 'center' }, title: { color: colors.ink, fontSize: 35, lineHeight: 39, letterSpacing: -1.3, fontWeight: '800', textAlign: 'center' }, body: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 13, maxWidth: 340, textAlign: 'center' },
  bottom: { paddingHorizontal: 24, paddingTop: 10, paddingBottom: 22 }, dots: { height: 25, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 15 }, dot: { height: 7, borderRadius: 4, backgroundColor: colors.primary }, button: { height: 58, borderRadius: 17, backgroundColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 13 }, buttonText: { color: 'white', fontSize: 16, fontWeight: '800' }, arrow: { color: 'white', fontSize: 20 },
});
