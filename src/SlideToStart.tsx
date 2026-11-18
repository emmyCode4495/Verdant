import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SharedValue, Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming, Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, motion } from './theme';

const THUMB = 52;
const PAD = 6;

function Chevron({ i, phase }: { i: number; phase: SharedValue<number> }) {
  const st = useAnimatedStyle(() => ({ opacity: 0.25 + 0.75 * Math.max(0, 1 - Math.abs(phase.value * 3 - i)) }));
  return (
    <Animated.View style={st}>
      <Ionicons name="chevron-forward" size={18} color={colors.forest} style={{ marginLeft: -7 }} />
    </Animated.View>
  );
}

/** Signature interaction: drag the sprout-arrow across the pill to begin. */
export function SlideToStart({ onComplete, label = 'Get Started', width }: { onComplete: () => void; label?: string; width: number }) {
  const maxX = width - THUMB - PAD * 2;
  const x = useSharedValue(0);
  const phase = useSharedValue(0);

  React.useEffect(() => {
    phase.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.linear }), -1);
  }, [phase]);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      x.value = Math.min(Math.max(e.translationX, 0), maxX);
    })
    .onEnd(() => {
      if (x.value > maxX * 0.75) {
        x.value = withSpring(maxX, motion.spring.snappy, (done) => {
          if (done) runOnJS(onComplete)();
        });
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
      } else {
        x.value = withSpring(0, motion.spring.fluid);
      }
    });

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const fill = useAnimatedStyle(() => ({ width: x.value + THUMB + PAD * 2 }));
  const text = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, maxX * 0.45], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(x.value, [0, maxX], [0, 30], Extrapolation.CLAMP) }],
  }));
  const trail = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, maxX * 0.4], [1, 0], Extrapolation.CLAMP) }));

  return (
    <View style={[styles.track, { width }]}>
      <Animated.View style={[styles.fill, fill]} />
      <Animated.Text style={[styles.label, text]}>{label}</Animated.Text>
      <Animated.View style={[styles.chevrons, trail]}>
        {[0, 1, 2].map((i) => <Chevron key={i} i={i} phase={phase} />)}
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.thumb, thumb]}>
          <Ionicons name="arrow-forward" size={22} color="#fff" />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: THUMB + PAD * 2, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.lime, borderRadius: 40 },
  thumb: { position: 'absolute', left: PAD, width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  label: { textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  chevrons: { position: 'absolute', right: 22, flexDirection: 'row' },
});
