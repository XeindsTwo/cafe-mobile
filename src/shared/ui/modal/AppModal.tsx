import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Animated, Easing, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  variant?: 'sheet' | 'dialog';
  dismissible?: boolean;
  handleOverlay?: boolean;
};

export function AppModal({ visible, onClose, children, variant = 'sheet', dismissible = true, handleOverlay = false }: Props) {
  const [mounted, setMounted] = useState(visible);
  const [progress] = useState(() => new Animated.Value(0));
  const [drag] = useState(() => new Animated.Value(0));
  const [exitTranslate] = useState(() => new Animated.Value(0));
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => dismissible && variant === 'sheet',
    onMoveShouldSetPanResponder: (_, gesture) => dismissible && gesture.dy > 8 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
    onPanResponderGrant: () => drag.stopAnimation(),
    onPanResponderMove: (_, gesture) => drag.setValue(Math.max(0, gesture.dy)),
    onPanResponderRelease: (_, gesture) => {
      if (gesture.dy > 70 || gesture.vy > 1.2) onClose();
      else Animated.spring(drag, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
    },
    onPanResponderTerminate: () => Animated.spring(drag, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start(),
    onPanResponderTerminationRequest: () => false,
  }), [dismissible, drag, onClose, variant]);

  useEffect(() => {
    if (visible) {
      const frame = requestAnimationFrame(() => {
        drag.setValue(0);
        exitTranslate.setValue(0);
        setMounted(true);
        Animated.timing(progress, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
      });
      return () => cancelAnimationFrame(frame);
    }
    Animated.parallel([
      Animated.timing(progress, { toValue: 0, duration: 390, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
      Animated.timing(exitTranslate, { toValue: variant === 'sheet' ? height : 20, duration: 390, easing: Easing.inOut(Easing.cubic), useNativeDriver: true }),
    ])
      .start(({ finished }) => { if (finished) setMounted(false); });
  }, [visible, progress, drag, exitTranslate, height, variant]);

  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [variant === 'sheet' ? 48 : 20, 0] });
  return <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={() => { if (dismissible) onClose(); }}>
    <KeyboardAvoidingView style={[styles.root, variant === 'dialog' && styles.center]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View pointerEvents="none" style={[styles.backdrop, { opacity: progress }]} />
      {dismissible && <Pressable accessibilityRole="button" accessibilityLabel="Закрыть окно" style={StyleSheet.absoluteFill} onPress={onClose} />}
      <Animated.View {...(variant === 'dialog' ? pan.panHandlers : {})} accessibilityViewIsModal style={[variant === 'sheet' ? styles.sheet : styles.dialog, { opacity: variant === 'dialog' ? progress : 1, transform: [{ translateY: Animated.add(Animated.add(translateY, drag), exitTranslate) }] }, variant === 'sheet' ? { paddingBottom: Math.max(insets.bottom, 16) } : null]}>
        {variant === 'sheet' && <View {...pan.panHandlers} collapsable={false} style={[styles.handleArea, handleOverlay && styles.handleOverlay]} accessibilityLabel="Потяните вниз, чтобы закрыть"><View style={[styles.handle, handleOverlay && styles.handleOnPhoto]} /></View>}
        {children}
      </Animated.View>
    </KeyboardAvoidingView>
  </Modal>;
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  center: { justifyContent: 'center', paddingHorizontal: 22 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(13,35,22,.45)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 26, borderTopRightRadius: 26, maxHeight: '92%', overflow: 'hidden' },
  dialog: { backgroundColor: colors.surface, borderRadius: 22, overflow: 'hidden' },
  handleArea: { height: 44, alignItems: 'center', justifyContent: 'center' },
  handleOverlay: { position: 'absolute', top: 0, alignSelf: 'center', width: 132, zIndex: 2 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: '#CED9D1' },
  handleOnPhoto: { backgroundColor: 'rgba(255,255,255,.95)' },
});
