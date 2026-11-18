import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing, Extrapolation, SharedValue, interpolate, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts } from './theme';

const THUMB = 56;
const PAD = 6;
const HEIGHT = THUMB + PAD * 2;
const LEAVES = [0.16, 0.34, 0.52, 0.7, 0.88];

/* A leaf sprouts on the vine each time the seed passes its spot */
function Leaf({ f, k, x, maxX }: { f: number; k: number; x: SharedValue<number>; maxX: number }) {
  const st = useAnimatedStyle(() => {
    const s = interpolate(x.value, [f * maxX - 4, f * maxX + 30], [0, 1], Extrapolation.CLAMP);
    return { opacity: s, transform: [{ scale: s }, { rotate: `${(k % 2 ? 1 : -1) * (40 - 30 * s)}deg` }] };
  });
  return (
    <Animated.View style={[{ position: 'absolute', left: PAD + THUMB / 2 + f * maxX - 9, top: k % 2 ? HEIGHT / 2 + 2 : HEIGHT / 2 - 22 }, st]}>
      <Ionicons name="leaf" size={18} color={colors.forestDeep} />
    </Animated.View>
  );
}

function Chevron({ i, phase }: { i: number; phase: SharedValue<number> }) {
  const st = useAnimatedStyle(() => ({ opacity: 0.25 + 0.75 * Math.max(0, 1 - Math.abs(phase.value * 3.4 - i)) }));
  return (
    <Animated.View style={st}>
      <Ionicons name="chevron-forward" size={18} color="#fff" style={{ marginLeft: -8 }} />
    </Animated.View>
  );
}

/**
 * "Get Started" as a living seed.
 * – idle: shimmer sweep, breathing halo, periodic nudge, chevron wave
 * – drag: haptic ticks, lime fill follows, a vine sprouts leaves behind the seed, seed → sprout morph
 * – release past 72% (or tap): seed locks in and `onComplete` fires; early release rubber-bands back
 */
export function GrowSlider({ width, onComplete, label = 'Get Started' }: { width: number; onComplete: () => void; label?: string }) {
  const maxX = width - THUMB - PAD * 2;
  const x = useSharedValue(0);
  const locked = useSharedValue(0);
  const lastTick = useSharedValue(0);
  const phase = useSharedValue(0);
  const nudge = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const breathe = useSharedValue(0);

  useEffect(() => {
    phase.value = withRepeat(withTiming(1, { duration: 1300, easing: Easing.linear }), -1);
    shimmer.value = withRepeat(withTiming(1, { duration: 3400, easing: Easing.bezier(0.4, 0, 0.2, 1) }), -1);
    breathe.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.quad) }), -1, true);
    nudge.value = withRepeat(
      withSequence(withDelay(2400, withTiming(22, { duration: 260, easing: Easing.out(Easing.quad) })), withSpring(0, { damping: 5, stiffness: 180 })),
      -1
    );
  }, [phase, shimmer, breathe, nudge]);

  const complete = () => {
    'worklet';
    if (locked.value) return;
    locked.value = 1;
    runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Success);
    x.value = withSpring(maxX, { damping: 16, stiffness: 220 }, (done) => {
      if (done) runOnJS(onComplete)();
    });
  };

  const pan = Gesture.Pan()
    .minDistance(2)
    .onBegin(() => {
      if (!locked.value) runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    })
    .onUpdate((e) => {
      if (locked.value) return;
      const nx = Math.min(Math.max(e.translationX, 0), maxX);
      x.value = nx;
      const tick = Math.floor((nx / maxX) * 8);
      if (tick !== lastTick.value) {
        lastTick.value = tick;
        runOnJS(Haptics.selectionAsync)();
      }
    })
    .onEnd(() => {
      if (locked.value) return;
      if (x.value > maxX * 0.72) complete();
      else {
        lastTick.value = 0;
        x.value = withSpring(0, { damping: 9, stiffness: 140 });
      }
    });
  const tap = Gesture.Tap().onEnd((_e, ok) => {
    if (ok) complete();
  });
  const gesture = Gesture.Race(pan, tap);

  const fill = useAnimatedStyle(() => ({ width: x.value + THUMB + PAD * 2 }));
  const stem = useAnimatedStyle(() => ({ width: x.value }));
  const thumbX = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value + nudge.value * interpolate(x.value, [0, 8], [1, 0], Extrapolation.CLAMP) }],
    backgroundColor: interpolateColor(x.value, [0, maxX * 0.2], [colors.lime, colors.forestDeep]),
  }));
  const halo = useAnimatedStyle(() => ({
    opacity: (0.15 + 0.3 * (1 - breathe.value)) * interpolate(x.value, [0, 30], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: x.value + nudge.value * interpolate(x.value, [0, 8], [1, 0], Extrapolation.CLAMP) }, { scale: 1 + breathe.value * 0.38 }],
  }));
  const arrowDark = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, maxX * 0.12], [1, 0], Extrapolation.CLAMP) }));
  const arrowLight = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [maxX * 0.05, maxX * 0.2, maxX * 0.42, maxX * 0.58], [0, 1, 1, 0], Extrapolation.CLAMP),
  }));
  const leaf = useAnimatedStyle(() => {
    const s = interpolate(x.value, [maxX * 0.42, maxX * 0.7], [0, 1], Extrapolation.CLAMP);
    return { opacity: s, transform: [{ scale: 0.4 + 0.6 * s }, { rotate: `${(1 - s) * -60}deg` }] };
  });
  const text = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, maxX * 0.35], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(x.value, [0, maxX], [0, 36], Extrapolation.CLAMP) }],
  }));
  const trail = useAnimatedStyle(() => ({ opacity: interpolate(x.value, [0, maxX * 0.3], [1, 0], Extrapolation.CLAMP) }));
  const sheen = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, maxX * 0.25], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(shimmer.value, [0, 0.6], [-100, width + 40], Extrapolation.CLAMP) }, { skewX: '-20deg' }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={[styles.track, { width }]}>
        <Animated.View style={[styles.sheen, sheen]}>
          <LinearGradient colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.35)', 'rgba(255,255,255,0)']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View style={[styles.fill, fill]}>
          <LinearGradient colors={[colors.lime, colors.limeDeep]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <Animated.View style={[styles.stem, stem]} />
        {LEAVES.map((f, k) => <Leaf key={f} f={f} k={k} x={x} maxX={maxX} />)}

        <Animated.Text style={[styles.label, text]}>{label}</Animated.Text>
        <Animated.View style={[styles.chevrons, trail]}>
          {[0, 1, 2].map((i) => <Chevron key={i} i={i} phase={phase} />)}
        </Animated.View>

        <Animated.View style={[styles.halo, halo]} />
        <Animated.View style={[styles.thumb, thumbX]}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.center, arrowDark]}><Ionicons name="arrow-forward" size={22} color={colors.forestDeep} /></Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.center, arrowLight]}><Ionicons name="arrow-forward" size={22} color={colors.lime} /></Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.center, leaf]}><Ionicons name="leaf" size={24} color={colors.lime} /></Animated.View>
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  track: { height: HEIGHT, borderRadius: HEIGHT / 2, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', justifyContent: 'center' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: HEIGHT / 2, overflow: 'hidden' },
  stem: { position: 'absolute', left: PAD + THUMB / 2, top: HEIGHT / 2 - 1.5, height: 3, borderRadius: 2, backgroundColor: 'rgba(20,49,42,0.4)' },
  sheen: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 90 },
  halo: { position: 'absolute', left: PAD - 5, top: HEIGHT / 2 - (THUMB + 10) / 2, width: THUMB + 10, height: THUMB + 10, borderRadius: (THUMB + 10) / 2, backgroundColor: colors.lime },
  thumb: { position: 'absolute', left: PAD, top: PAD, width: THUMB, height: THUMB, borderRadius: THUMB / 2, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center' },
  label: { textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 17, letterSpacing: 0.3, color: '#fff' },
  chevrons: { position: 'absolute', right: 24, flexDirection: 'row' },
});
