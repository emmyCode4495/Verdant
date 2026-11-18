import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from './store';
import { LiveDot } from './ui';
import { colors, fonts, motion, shadow } from './theme';

/** Live event toast — tasks completing, irrigation finishing, drone status. */
export function Toast() {
  const ev = useStore((s) => s.event);
  const insets = useSafeAreaInsets();
  const y = useSharedValue(-160);

  useEffect(() => {
    if (!ev) return;
    y.value = withSequence(withSpring(0, motion.spring.fluid), withDelay(2400, withTiming(-160, { duration: 260 })));
  }, [ev?.id]);

  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View pointerEvents="none" style={[styles.wrap, { top: insets.top + 8 }, st]}>
      <View style={[styles.card, shadow.float]}>
        <LiveDot color={colors.lime} />
        <Text style={styles.text} numberOfLines={2}>{ev?.text}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 20, right: 20, zIndex: 100 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.forestDeep, paddingVertical: 14, paddingHorizontal: 18, borderRadius: 22 },
  text: { flex: 1, color: '#fff', fontFamily: fonts.bodyMed, fontSize: 14 },
});
