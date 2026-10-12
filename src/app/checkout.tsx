import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckoutPage } from '../pages/checkout/ui/CheckoutPage';
import { colors } from '../shared/ui/theme';

export default function CheckoutRoute() {
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.canvas }}><CheckoutPage /></SafeAreaView>;
}
