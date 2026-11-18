import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing, FadeInDown, FadeIn, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FocusStatusBar } from '../src/ui';
import { colors, fonts, motion } from '../src/theme';

const AnimatedPath = Animated.createAnimatedComponent(Path);

function Ring({ delay }: { delay: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }), -1));
  }, [delay, p]);
  const st = useAnimatedStyle(() => ({ opacity: 0.35 * (1 - p.value), transform: [{ scale: 0.5 + p.value * 1.8 }] }));
  return <Animated.View style={[styles.ring, st]} />;
}

export default function Splash() {
  const stem = useSharedValue(0);
  const leaves = useSharedValue(0);
  const grow = useSharedValue(0.6);

  useEffect(() => {
    grow.value = withSpring(1, motion.spring.fluid);
    stem.value = withDelay(250, withTiming(1, { duration: 900, easing: motion.easeOut }));
    leaves.value = withDelay(900, withTiming(1, { duration: 700, easing: motion.easeOut }));
    const t = setTimeout(() => router.replace('/onboarding'), 3100);
    return () => clearTimeout(t);
  }, [stem, leaves, grow]);

  const stemProps = useAnimatedProps(() => ({ strokeDashoffset: 90 * (1 - stem.value) }));
  const leafProps = useAnimatedProps(() => ({ opacity: leaves.value }));
  const sprout = useAnimatedStyle(() => ({ transform: [{ scale: grow.value }] }));
  const word = 'Verdant'.split('');

  return (
    <View style={styles.root}>
      <FocusStatusBar style="light" />
      <LinearGradient colors={[colors.forestDeep, '#1F4A3A', colors.forest]} style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <Ring delay={0} />
        <Ring delay={700} />
        <Animated.View style={sprout}>
          <Svg width={150} height={170} viewBox="0 0 120 140">
            <AnimatedPath d="M60 132 C60 104 60 82 60 56" stroke={colors.lime} strokeWidth={5} strokeLinecap="round" fill="none" strokeDasharray={90} animatedProps={stemProps} />
            <AnimatedPath d="M60 78 C34 78 24 56 28 38 C49 38 60 54 60 78Z" fill={colors.limeDeep} animatedProps={leafProps} />
            <AnimatedPath d="M60 66 C84 66 96 46 92 28 C71 28 60 44 60 66Z" fill={colors.lime} animatedProps={leafProps} />
            <AnimatedPath d="M60 56 C50 40 52 24 60 12 C68 24 70 40 60 56Z" fill="#E6F6C8" animatedProps={leafProps} />
          </Svg>
        </Animated.View>
      </View>
      <View style={styles.word}>
        {word.map((ch, i) => (
          <Animated.Text key={i} entering={FadeInDown.delay(1100 + i * 70).duration(500).easing(motion.easeOut)} style={styles.letter}>
            {ch}
          </Animated.Text>
        ))}
      </View>
      <Animated.Text entering={FadeIn.delay(1900).duration(600)} style={styles.tag}>
        Farm smarter. Grow further.
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ring: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: colors.lime },
  word: { flexDirection: 'row' },
  letter: { fontFamily: fonts.displayXL, fontSize: 46, color: '#fff', letterSpacing: -1 },
  tag: { marginTop: 8, fontFamily: fonts.bodyMed, fontSize: 15, color: 'rgba(255,255,255,0.7)' },
});
