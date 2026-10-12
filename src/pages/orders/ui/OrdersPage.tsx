import { ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '../../../shared/ui/typography';
import { Ionicons } from '@expo/vector-icons';
import { formatDeliveryDate } from '../../../entities/meal/model/demoDay';
import { colors } from '../../../shared/ui/theme';
import { useSession } from '../../../widgets/app-shell/model/Session';

export function OrdersPage() {
  const { orders } = useSession();
  return <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <Text style={styles.title}>Заказы</Text><Text style={styles.caption}>Демо-заказы хранятся только до закрытия приложения</Text>
    {orders.length ? orders.map(order => <View key={order.id} style={styles.card}>
      <View style={styles.top}><View style={styles.statusIcon}><Ionicons name="checkmark" size={20} color={colors.primary} /></View><View style={styles.topCopy}><Text style={styles.orderName}>Заказ от {order.createdAt}</Text><Text style={styles.status}>Демо-заказ создан</Text></View><Text style={styles.price}>{order.total} ₽</Text></View>
      <View style={styles.line} /><View style={styles.fact}><Ionicons name="calendar-outline" size={20} color={colors.primary} /><Text style={styles.factText}>{formatDeliveryDate(order.request.delivery_date)}, {order.request.delivery_time.slice(0, 5)}</Text></View>
      <View style={styles.fact}><Ionicons name="location-outline" size={20} color={colors.primary} /><Text style={styles.factText}>{order.addressText}</Text></View>
      <Text style={styles.itemsTitle}>Состав заказа</Text>{order.items.map(item => <View key={item.name} style={styles.item}><Text style={styles.itemName}>{item.name} × {item.quantity}</Text><Text style={styles.itemPrice}>{item.price * item.quantity} ₽</Text></View>)}
      {!!order.request.comment && <Text style={styles.comment}>Комментарий: {order.request.comment}</Text>}
    </View>) : <View style={styles.empty}><Ionicons name="receipt-outline" size={35} color={colors.primary} /><Text style={styles.emptyTitle}>Пока нет заказов</Text><Text style={styles.emptyBody}>Выберите блюда или комплекс в меню и оформите демо-заказ.</Text></View>}
  </ScrollView>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas }, content: { padding: 20, paddingBottom: 110 }, title: { color: colors.ink, fontSize: 31, fontWeight: '800' }, caption: { color: colors.muted, fontSize: 13, marginTop: 5, marginBottom: 21 }, card: { backgroundColor: colors.surface, borderRadius: 20, padding: 17, marginBottom: 13, borderWidth: 1, borderColor: colors.line }, top: { flexDirection: 'row', alignItems: 'center', gap: 11 }, statusIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' }, topCopy: { flex: 1 }, orderName: { color: colors.ink, fontSize: 15, fontWeight: '800' }, status: { color: colors.primary, fontSize: 12, marginTop: 3 }, price: { color: colors.primary, fontSize: 17, fontWeight: '800' }, line: { height: 1, backgroundColor: colors.line, marginVertical: 15 }, fact: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }, factText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 19, textTransform: 'capitalize' }, itemsTitle: { color: colors.ink, fontSize: 16, fontWeight: '800', marginTop: 9, marginBottom: 6 }, item: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 6 }, itemName: { color: colors.ink, fontSize: 14, flex: 1 }, itemPrice: { color: colors.ink, fontSize: 14, fontWeight: '700' }, comment: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 12 }, empty: { padding: 27, backgroundColor: colors.accentSoft, borderRadius: 20, alignItems: 'center', marginTop: 30 }, emptyTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', marginTop: 13 }, emptyBody: { color: colors.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 7 },
});
