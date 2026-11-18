import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, SharedValue, interpolate, useAnimatedStyle, useSharedValue, withTiming, Extrapolation } from 'react-native-reanimated';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FocusStatusBar } from '../src/ui';
import { Ambient } from '../src/Ambient';
import { IMG } from '../src/data';
import { colors, fonts } from '../src/theme';

/* ---------- timeline (ms, real time). The video plays at 1.25x, so its 6s clip lasts ~4.8s ---------- */
const RATE = 1.25;
const T_BURST = 950; // sprout breaks the soil
const T_WORD = 1900; // wordmark starts rising
const T_TAG = 2700; // tagline words
const TOTAL = 4800; // clip length at 1.25x — we leave the moment it ends

const seg = (t: number, a: number, d: number) => {
  'worklet';
  return Math.min(1, Math.max(0, (t - a) / d));
};
const outCubic = (p: number) => {
  'worklet';
  return 1 - Math.pow(1 - p, 3);
};
const outBack = (p: number) => {
  'worklet';
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2);
};

const WORD = 'Verdant'.split('');
const TAG = ['Farm', 'smarter.', 'Grow', 'further.'];

/* one expanding ring of light, driven by the shared clock */
function Shock({ clock, at, dur, max }: { clock: SharedValue<number>; at: number; dur: number; max: number }) {
  const st = useAnimatedStyle(() => {
    const p = outCubic(seg(clock.value * TOTAL, at, dur));
    return { opacity: p > 0 && p < 1 ? 0.6 * (1 - p) : 0, transform: [{ scale: 0.2 + p * max }] };
  });
  return <Animated.View pointerEvents="none" style={[{ position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 2, borderColor: colors.lime }, st]} />;
}

function Letter({ ch, i, clock }: { ch: string; i: number; clock: SharedValue<number> }) {
  const st = useAnimatedStyle(() => {
    const p = seg(clock.value * TOTAL, T_WORD + i * 70, 620);
    const e = outBack(p);
    return { opacity: Math.min(1, p * 2.5), transform: [{ translateY: (1 - e) * 58 }, { rotate: `${(1 - e) * 8}deg` }] };
  });
  return (
    <View style={{ overflow: 'hidden', height: 60 }}>
      <Animated.Text style={[styles.letter, i === 0 && { color: colors.lime }, st]}>{ch}</Animated.Text>
    </View>
  );
}

function TagWord({ w, i, clock }: { w: string; i: number; clock: SharedValue<number> }) {
  const st = useAnimatedStyle(() => {
    const p = outCubic(seg(clock.value * TOTAL, T_TAG + i * 150, 520));
    return { opacity: p, transform: [{ translateY: (1 - p) * 10 }] };
  });
  return <Animated.Text style={[styles.tag, st]}>{w}</Animated.Text>;
}

export default function Splash() {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const clock = useSharedValue(0); // 0 → 1 across the whole splash
  const poster = useSharedValue(1);
  const started = useRef(false);

  const player = useVideoPlayer(require('../assets/video/plant-grow.mp4'), (p) => {
    p.loop = false;
    p.muted = true;
    p.playbackRate = RATE;
    p.play();
  });

  // everything is scrubbed from one clock, started when the first video frame lands
  const left = useRef(false);
  const go = useCallback(() => {
    if (left.current) return;
    left.current = true;
    router.replace('/onboarding');
  }, []);

  const start = useCallback(() => {
    if (started.current) return;
    started.current = true;
    poster.value = withTiming(0, { duration: 220 });
    clock.value = withTiming(1, { duration: TOTAL, easing: Easing.linear });
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), T_BURST);
    setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), T_WORD + 200);
    player.addListener('playToEnd', go);
    setTimeout(go, TOTAL + 500); // safety net
  }, [clock, poster, player, go]);

  useEffect(() => {
    Image.prefetch([IMG.hero, IMG.veg, IMG.greenhouse]);
  }, []);

  useEffect(() => {
    const fallback = setTimeout(start, 1200); // never get stuck if the first-frame event doesn't fire
    return () => clearTimeout(fallback);
  }, [start]);

  const posterStyle = useAnimatedStyle(() => ({ opacity: poster.value }));
  const curtain = useAnimatedStyle(() => {
    const t = clock.value * TOTAL;
    return { opacity: 1 - seg(t, 0, 600) };
  });
  const dust = useAnimatedStyle(() => ({
    opacity: interpolate(clock.value * TOTAL, [700, 2000, 2100, TOTAL], [0, 1, 1, 1], Extrapolation.CLAMP),
  }));
  const bar = useAnimatedStyle(() => ({ width: clock.value * 120 }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.forestDeep }}>
      <FocusStatusBar style="light" />

      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        allowsPictureInPicture={false}
        surfaceType="textureView"
        onFirstFrameRender={start}
        pointerEvents="none"
      />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, posterStyle]}>
        <Image source={require('../assets/video/plant-poster.jpg')} style={StyleSheet.absoluteFill} contentFit="cover" />
      </Animated.View>

      {/* grade: pull the footage into the Verdant palette */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,49,42,0.28)' }]} />
      <LinearGradient pointerEvents="none" colors={['rgba(20,49,42,0.62)', 'rgba(20,49,42,0)']} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: H * 0.3 }} />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(20,49,42,0)', 'rgba(20,49,42,0.55)', 'rgba(20,49,42,0.95)']}
        locations={[0, 0.45, 1]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: H * 0.45 }}
      />

      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, dust]}>
        <Ambient scrollX={useSharedValue(0)} W={W} H={H} count={14} />
      </Animated.View>

      {/* ring of light where the sprout breaks the soil, and one more on the way out */}
      <View pointerEvents="none" style={{ position: 'absolute', left: W / 2, top: H * 0.71, width: 1, height: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Shock clock={clock} at={T_BURST} dur={1500} max={3.4} />
      </View>

      <Animated.View pointerEvents="none" style={[styles.brand, { bottom: insets.bottom + 92 }]}>
        <View style={styles.word}>{WORD.map((ch, i) => <Letter key={i} ch={ch} i={i} clock={clock} />)}</View>
        <View style={styles.tagRow}>{TAG.map((w, i) => <TagWord key={i} w={w} i={i} clock={clock} />)}</View>
      </Animated.View>

      <Animated.View pointerEvents="none" style={[styles.barWrap, { bottom: insets.bottom + 44 }]}>
        <View style={styles.barTrack}><Animated.View style={[styles.barFill, bar]} /></View>
      </Animated.View>

      {/* fades in from the brand green, and back out to it for the hand-off */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.forestDeep }, curtain]} />
    </View>
  );
}

const styles = StyleSheet.create({
  brand: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  word: { flexDirection: 'row' },
  letter: { fontFamily: fonts.displayXL, fontSize: 50, lineHeight: 60, color: '#fff', letterSpacing: -1.2, textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 14, textShadowOffset: { width: 0, height: 2 } },
  tagRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  tag: { fontFamily: fonts.bodyMed, fontSize: 15, color: 'rgba(255,255,255,0.8)', letterSpacing: 0.4, textShadowColor: 'rgba(0,0,0,0.4)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 1 } },
  barWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  barTrack: { width: 120, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' },
  barFill: { height: 3, borderRadius: 2, backgroundColor: colors.lime },
});
