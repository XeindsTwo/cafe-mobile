import { Text as NativeText, StyleSheet, type TextProps, type TextStyle } from 'react-native';

export const fontFamily = {
  regular: 'Inter-Regular',
  medium: 'Inter-Medium',
  semiBold: 'Inter-SemiBold',
  bold: 'Inter-Bold',
} as const;

function familyForWeight(weight: TextStyle['fontWeight']) {
  const numeric = Number(weight);
  if (weight === 'bold' || numeric >= 700) return fontFamily.bold;
  if (numeric >= 600) return fontFamily.semiBold;
  if (weight === 'medium' || numeric >= 500) return fontFamily.medium;
  return fontFamily.regular;
}

export function Text({ style, ...props }: TextProps) {
  const flattened = StyleSheet.flatten(style);
  return <NativeText {...props} style={[style, { fontFamily: flattened?.fontFamily ?? familyForWeight(flattened?.fontWeight), fontWeight: 'normal' }]} />;
}
