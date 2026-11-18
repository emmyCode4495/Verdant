import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { SharedValue, Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FocusStatusBar, Img } from '../src/ui';
import { SlideToStart } from '../src/SlideToStart';
import { IMG } from '../src/data';
import { colors, fonts } from '../src/theme';

const PAGES = [
  { title: 'Shaping the Future of Modern Farming', body: 'Advanced tools and real-time insights help farmers manage crops, resources, and operations more efficiently than ever.', img: IMG.hero },
  { title: 'Know Your Land in Real Time', body: 'Soil condition, weather and air quality — streamed live from sensors across every field you own.', img: IMG.veg },
  { title: 'Automate. Delegate. Grow.', body: 'Schedule irrigation, dispatch drones and track your crew from one calm control room.', img: IMG.greenhouse },
];

function Page({ i, scrollX, W, H }: { i: number; scrollX: SharedValue<number>; W: number; H: number }) {
  const img = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(scrollX.value, [(i - 1) * W, i * W, (i + 1) * W], [-W * 0.2, 0, W * 0.2], Extrapolation.CLAMP) }],
  }));
  const text = useAnimatedStyle(() => ({
    opacity: interpolate(scrollX.value, [(i - 0.6) * W, i * W, (i + 0.6) * W], [0, 1, 0], Extrapolation.CLAMP),
    transform: [
      { translateX: interpolate(scrollX.value, [(i - 1) * W, i * W, (i + 1) * W], [70, 0, -70], Extrapolation.CLAMP) },
    ],
  }));
  const p = PAGES[i];
  return (
    <View style={{ width: W, height: H }}>
      <Animated.View style={[{ position: 'absolute', left: -W * 0.2, width: W * 1.4, height: H }, img]}>
        <Img uri={p.img} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <LinearGradient colors={['rgba(8,24,17,0.35)', 'transparent', 'rgba(8,24,17,0.9)']} locations={[0, 0.42, 1]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[{ position: 'absolute', left: 28, right: 28, bottom: 230 }, text]}>
        <Text style={styles.title}>{p.title}</Text>
        <Text style={styles.body}>{p.body}</Text>
      </Animated.View>
    </View>
  );
}

function Indicator({ i, scrollX, W }: { i: number; scrollX: SharedValue<number>; W: number }) {
  const st = useAnimatedStyle(() => ({
    width: interpolate(scrollX.value, [(i - 1) * W, i * W, (i + 1) * W], [8, 28, 8], Extrapolation.CLAMP),
    opacity: interpolate(scrollX.value, [(i - 1) * W, i * W, (i + 1) * W], [0.4, 1, 0.4], Extrapolation.CLAMP),
  }));
  return <Animated.View style={[{ height: 8, borderRadius: 4, backgroundColor: colors.lime }, st]} />;
}

export default function Onboarding() {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollX = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { scrollX.value = e.contentOffset.x; });

  return (
    <View style={{ flex: 1, backgroundColor: colors.forestDeep }}>
      <FocusStatusBar style="light" />
      <Animated.ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16} bounces={false}>
        {PAGES.map((_, i) => <Page key={i} i={i} scrollX={scrollX} W={W} H={H} />)}
      </Animated.ScrollView>

      <Pressable style={[styles.skip, { top: insets.top + 12 }]} onPress={() => router.replace('/auth')} hitSlop={12}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={[styles.bottom, { bottom: insets.bottom + 24 }]}>
        <View style={styles.dots}>{PAGES.map((_, i) => <Indicator key={i} i={i} scrollX={scrollX} W={W} />)}</View>
        <SlideToStart width={W - 48} onComplete={() => router.replace('/auth')} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.displayXL, fontSize: 36, lineHeight: 40, color: '#fff', letterSpacing: -1 },
  body: { marginTop: 12, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.82)' },
  skip: { position: 'absolute', right: 24, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)' },
  skipText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 13 },
  bottom: { position: 'absolute', left: 24, right: 24, gap: 22 },
  dots: { flexDirection: 'row', gap: 6, alignSelf: 'center' },
});
