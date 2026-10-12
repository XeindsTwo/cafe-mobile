import { Image, StyleSheet, View } from 'react-native';
import { Meal } from '../model/types';
import { colors } from '../../../shared/ui/theme';

export function SetPhoto({ meals, height }: { meals: Meal[]; height: number }) {
  if (!meals.length) return <View style={{ height, backgroundColor: colors.sage }} />;
  const [main, ...rest] = meals;
  return <View style={[styles.root, { height }]}>
    <Image source={main.image} style={[styles.main, { width: rest.length ? '69%' : '100%' }]} resizeMode="cover" />
    {rest.length > 0 && <View style={styles.side}>{rest.slice(0, 2).map((meal, index) => <Image key={meal.id} source={meal.image} style={[styles.small, index > 0 && styles.second]} resizeMode="cover" />)}</View>}
  </View>;
}

const styles = StyleSheet.create({
  root: { width: '100%', flexDirection: 'row', backgroundColor: colors.sage, overflow: 'hidden' },
  main: { height: '100%' }, side: { width: '31%', height: '100%', paddingLeft: 3 }, small: { flex: 1, width: '100%' }, second: { marginTop: 3 },
});
