import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing, FadeInDown, FadeIn, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSpring, withTiming,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { FocusStatusBar } from '../src/ui';
import { colors, fonts, motion } from '../src/theme';

function Ring({ delay }: { delay: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }), -1));
  }, [delay, p]);
  const st = useAnimatedStyle(() => ({ opacity: 0.35 * (1 - p.value), transform: [{ scale: 0.5 + p.value * 1.8 }] }));
  return <Animated.View style={[styles.ring, st]} />;
}

export default function Splash() {
  const grow = useSharedValue(0.82);
  const out = useSharedValue(1);

  useEffect(() => {
    grow.value = withSpring(1, motion.spring.fluid);
    // Hold the splash, then dissolve it (fade + soft zoom) just before handing off.
    const fade = setTimeout(() => {
      out.value = withTiming(0, { duration: 520, easing: Easing.in(Easing.quad) });
    }, 2700);
    const t = setTimeout(() => router.replace('/onboarding'), 3250);
    return () => { clearTimeout(t); clearTimeout(fade); };
  }, [grow, out]);

  const plant = useAnimatedStyle(() => ({ transform: [{ scale: grow.value }] }));
  const exit = useAnimatedStyle(() => ({
    opacity: out.value,
    transform: [{ scale: 1 + (1 - out.value) * 0.06 }],
  }));
  const word = 'Verdant'.split('');

  return (
    <View style={{ flex: 1, backgroundColor: colors.forestDeep }}>
      <FocusStatusBar style="light" />
      <LinearGradient colors={[colors.forestDeep, '#1F4A3A', colors.forest]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[styles.root, exit]}>
      <View style={styles.center}>
        <Ring delay={0} />
        <Ring delay={700} />
        <Animated.View entering={FadeIn.duration(500)} style={plant}>
          <LottieView
            source={require('../assets/lottie/plant.json')}
            autoPlay
            loop
            style={{ width: 170, height: 316 }}
          />
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
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  center: { width: 240, height: 316, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  ring: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: colors.lime },
  word: { flexDirection: 'row' },
  letter: { fontFamily: fonts.displayXL, fontSize: 46, color: '#fff', letterSpacing: -1 },
  tag: { marginTop: 8, fontFamily: fonts.bodyMed, fontSize: 15, color: 'rgba(255,255,255,0.7)' },
});
