import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SharedValue, Easing, interpolate, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence,
  withSpring, withTiming, Extrapolation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, motion } from './theme';

const THUMB = 52;
const PAD = 6;
const H = THUMB + PAD * 2;

function Chevron({ i, phase }: { i: number; phase: SharedValue<number> }) {
  const st = useAnimatedStyle(() => ({ opacity: 0.25 + 0.75 * Math.max(0, 1 - Math.abs(phase.value * 3 - i)) }));
  return (
    <Animated.View style={st}>
      <Ionicons name="chevron-forward" size={18} color={colors.forest} style={{ marginLeft: -7 }} />
    </Animated.View>
  );
}

/**
 * Signature interaction: drag the thumb across the pill to begin.
 * - idle: shimmer sweep, pulsing halo, and a little "nudge" teasing the drag
 * - dragging: thumb squashes with velocity, haptic ticks every quarter, fill grows
 * - release past 75%: arrow morphs into a leaf, track pops, ripples bloom from the thumb
 */
export function SlideToStart({ onComplete, label = 'Get Started', width }: { onComplete: () => void; label?: string; width: number }) {
  const maxX = width - THUMB - PAD * 2;
  const x = useSharedValue(0);
  const phase = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const halo = useSharedValue(0);
  const nudge = useSharedValue(0);
  const press = useSharedValue(0);
  const vel = useSharedValue(0);
  const done = useSharedValue(0);
  const lastStep = useSharedValue(0);
  const locked = useSharedValue(0);

  React.useEffect(() => {
    phase.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.linear }), -1);
    shimmer.value = withRepeat(
      withSequence(withDelay(900, withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.quad) })), withTiming(0, { duration: 0 })),
      -1,
    );
    halo.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1);
    nudge.value = withRepeat(
      withSequence(
        withDelay(2600, withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) })),
        withTiming(0, { duration: 520, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
    );
  }, [phase, shimmer, halo, nudge]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      press.value = withSpring(1, motion.spring.snappy);
    })
    .onUpdate((e) => {
      if (locked.value) return;
      x.value = Math.min(Math.max(e.translationX, 0), maxX);
      vel.value = withTiming(Math.min(Math.abs(e.velocityX) / 2200, 1), { duration: 90 });
      const step = Math.floor((x.value / maxX) * 4);
      if (step !== lastStep.value) {
        lastStep.value = step;
        if (step > 0 && step < 4) runOnJS(Haptics.selectionAsync)();
      }
    })
    .onEnd(() => {
      if (locked.value) return;
      vel.value = withTiming(0, { duration: 200 });
      if (x.value > maxX * 0.75) {
        locked.value = 1;
        x.value = withSpring(maxX, motion.spring.snappy, (fin) => {
          if (fin) {
            done.value = withTiming(1, { duration: 650, easing: motion.easeOut });
            runOnJS(onComplete)();
          }
        });
        runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
      } else {
        x.value = withSpring(0, motion.spring.fluid);
        lastStep.value = 0;
      }
    })
    .onFinalize(() => {
      press.value = withSpring(0, motion.spring.snappy);
    });

  const wrap = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(done.value, [0, 0.25, 1], [1, 1.04, 1]) }] }));
  const thumb = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value + (x.value < 4 ? nudge.value * 10 : 0) },
      { scaleX: 1 + vel.value * 0.16 },
      { scale: 1 + press.value * 0.08 },
    ],
  }));
  const haloSt = useAnimatedStyle(() => ({
    opacity: 0.4 * (1 - halo.value) * (1 - Math.min(1, x.value / (maxX * 0.2))),
    transform: [{ translateX: x.value }, { scale: 1 + halo.value * 0.9 }],
  }));
  const fill = useAnimatedStyle(() => ({ width: x.value + THUMB + PAD * 2 }));
  const text = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, maxX * 0.45], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(x.value, [0, maxX], [0, 30], Extrapolation.CLAMP) }],
  }));
  const trail = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, maxX * 0.4], [1, 0], Extrapolation.CLAMP) }));
  const sheen = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, maxX * 0.3], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(shimmer.value, [0, 1], [-140, width + 20]) }, { skewX: '-18deg' }],
  }));
  const arrow = useAnimatedStyle(() => {
    const p = interpolate(x.value, [maxX * 0.6, maxX], [0, 1], Extrapolation.CLAMP);
    return { opacity: 1 - p, transform: [{ rotate: `${p * 90}deg` }, { scale: 1 - p * 0.4 }] };
  });
  const leaf = useAnimatedStyle(() => {
    const p = interpolate(x.value, [maxX * 0.6, maxX], [0, 1], Extrapolation.CLAMP);
    return { opacity: p, transform: [{ rotate: `${(1 - p) * -60}deg` }, { scale: 0.6 + p * 0.5 }] };
  });
  const ripple1 = useAnimatedStyle(() => ({ opacity: done.value > 0 ? 0.7 * (1 - done.value) : 0, transform: [{ scale: 1 + done.value * 2.6 }] }));
  const ripple2 = useAnimatedStyle(() => {
    const d = Math.max(0, done.value - 0.2) / 0.8;
    return { opacity: d > 0 ? 0.5 * (1 - d) : 0, transform: [{ scale: 1 + d * 3.4 }] };
  });

  return (
    <Animated.View style={[{ width, height: H }, wrap]}>
      <View style={[styles.track, { width }]}>
        <Animated.View style={[styles.fill, fill]}>
          <LinearGradient colors={[colors.lime, colors.limeDeep]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.sheen, sheen]}>
          <LinearGradient
            colors={['rgba(203,232,160,0)', 'rgba(154,205,91,0.5)', 'rgba(203,232,160,0)']}
            start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.Text style={[styles.label, text]}>{label}</Animated.Text>
        <Animated.View style={[styles.chevrons, trail]}>
          {[0, 1, 2].map((i) => <Chevron key={i} i={i} phase={phase} />)}
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.halo, haloSt]} />
        <GestureDetector gesture={pan}>
          <Animated.View style={[styles.thumb, thumb]}>
            <Animated.View style={[StyleSheet.absoluteFill, styles.center, arrow]}>
              <Ionicons name="arrow-forward" size={22} color="#fff" />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, styles.center, leaf]}>
              <Ionicons name="leaf" size={22} color={colors.lime} />
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </View>
      <Animated.View pointerEvents="none" style={[styles.ripple, ripple1]} />
      <Animated.View pointerEvents="none" style={[styles.ripple, ripple2]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  track: { height: H, borderRadius: 40, backgroundColor: '#fff', justifyContent: 'center', overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 40, overflow: 'hidden' },
  sheen: { position: 'absolute', top: 0, bottom: 0, width: 110 },
  halo: { position: 'absolute', left: PAD, width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: colors.forest },
  thumb: { position: 'absolute', left: PAD, width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  chevrons: { position: 'absolute', right: 22, flexDirection: 'row' },
  ripple: { position: 'absolute', right: PAD, top: PAD, width: THUMB, height: THUMB, borderRadius: THUMB / 2, borderWidth: 2, borderColor: colors.limeDeep },
});
