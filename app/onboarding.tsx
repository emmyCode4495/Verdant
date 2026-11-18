import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing, Extrapolation, SharedValue, cancelAnimation, interpolate, interpolateColor, runOnJS, useAnimatedProps, useAnimatedReaction,
  useAnimatedScrollHandler, useAnimatedStyle, useDerivedValue, useSharedValue, withDelay, withRepeat, withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Burst, FocusStatusBar, Img, LiveDot } from '../src/ui';
import { Ambient } from '../src/Ambient';
import { GrowSlider } from '../src/GrowSlider';
import { IMG } from '../src/data';
import { colors, fonts, motion } from '../src/theme';

const PAGES = [
  { kicker: 'GROW', accent: '#CBE8A0', title: 'Shaping the Future of Modern Farming', body: 'Advanced tools and real-time insights help farmers manage crops, resources, and operations more efficiently than ever.', img: IMG.hero },
  { kicker: 'SENSE', accent: '#BFE3F5', title: 'Know Your Land in Real Time', body: 'Soil condition, weather and air quality — streamed live from sensors across every field you own.', img: IMG.veg },
  { kicker: 'AUTOMATE', accent: '#F5D58A', title: 'Automate. Delegate. Grow.', body: 'Schedule irrigation, dispatch drones and track your crew from one calm control room.', img: IMG.greenhouse },
];
const STORY_MS = 5200;
const clamp01 = (v: number) => {
  'worklet';
  return Math.min(1, Math.max(0, v));
};

/* ---------------- scroll-linked focus: 0 = off-screen, 1 = centred ---------------- */
function useFocus(i: number, scrollX: SharedValue<number>, W: number, intro: SharedValue<number>) {
  return useDerivedValue(() => Math.min(1 - Math.min(1, Math.abs(scrollX.value / W - i)), intro.value));
}

/* ---------------- kinetic, masked word reveal ---------------- */
function Word({ text, idx, focus, style }: { text: string; idx: number; focus: SharedValue<number>; style: any }) {
  const lh = style.lineHeight as number;
  const st = useAnimatedStyle(() => {
    const p = clamp01((focus.value - idx * 0.055) / 0.42);
    return { opacity: p, transform: [{ translateY: (1 - p) * lh * 1.05 }, { rotate: `${(1 - p) * 5}deg` }] };
  });
  return (
    <View style={{ overflow: 'hidden', marginRight: 9 }}>
      <Animated.Text style={[style, st]}>{text}</Animated.Text>
    </View>
  );
}

/* ---------------- glass scene card (floats in, tilts with focus) ---------------- */
function SceneCard({ focus, W, compact, children }: { focus: SharedValue<number>; W: number; compact: boolean; children: React.ReactNode }) {
  const st = useAnimatedStyle(() => ({
    opacity: interpolate(focus.value, [0, 0.55, 1], [0, 0.15, 1], Extrapolation.CLAMP),
    transform: [
      { perspective: 900 },
      { translateY: (1 - focus.value) * 70 },
      { rotateX: `${(1 - focus.value) * 16}deg` },
      { scale: (compact ? 0.86 : 1) * (0.9 + 0.1 * focus.value) },
    ],
  }));
  return <Animated.View style={[styles.scene, { width: Math.min(W - 48, 340) }, st]}>{children}</Animated.View>;
}

/* Scene 1 — crop health ring fills + counts as the page arrives, chips bob */
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedInput = Animated.createAnimatedComponent(TextInput);
function Chip({ label, icon, bob, phase }: { label: string; icon: any; bob: SharedValue<number>; phase: number }) {
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: Math.sin((bob.value + phase) * Math.PI * 2) * 4 }] }));
  return (
    <Animated.View style={[styles.chip, st]}>
      <Ionicons name={icon} size={12} color={colors.lime} />
      <Text style={styles.chipText}>{label}</Text>
    </Animated.View>
  );
}
function ScenePulse({ focus }: { focus: SharedValue<number> }) {
  const SIZE = 98, STROKE = 9, r = (SIZE - STROKE) / 2, c = 2 * Math.PI * r;
  const bob = useSharedValue(0);
  useEffect(() => { bob.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.linear }), -1); }, [bob]);
  const ring = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - 0.92 * focus.value) }));
  const num = useAnimatedProps(() => {
    const t = `${Math.round(92 * focus.value)}%`;
    return { text: t, defaultValue: t } as any;
  });
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
            <Circle cx={SIZE / 2} cy={SIZE / 2} r={r} stroke="rgba(255,255,255,0.18)" strokeWidth={STROKE} fill="none" />
            <AnimatedCircle cx={SIZE / 2} cy={SIZE / 2} r={r} stroke={colors.lime} strokeWidth={STROKE} fill="none" strokeDasharray={c} strokeLinecap="round" rotation="-90" origin={`${SIZE / 2}, ${SIZE / 2}`} animatedProps={ring} />
          </Svg>
          <AnimatedInput editable={false} allowFontScaling={false} underlineColorAndroid="transparent" defaultValue="0%" animatedProps={num} style={styles.ringNum} />
        </View>
        <View style={{ flex: 1, marginLeft: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <LiveDot color={colors.lime} size={7} />
            <Text style={styles.sceneKicker}>LIVE · GREEN VALLEY</Text>
          </View>
          <Text style={styles.sceneTitle}>Crop health</Text>
          <Text style={styles.sceneSub}>Excellent — no action needed</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
        <Chip label="Soil 58%" icon="water" bob={bob} phase={0} />
        <Chip label="28°C" icon="sunny" bob={bob} phase={0.33} />
        <Chip label="AQI 24" icon="leaf" bob={bob} phase={0.66} />
      </View>
    </View>
  );
}

/* Scene 2 — living moisture waveform */
function EqBar({ i, t, focus }: { i: number; t: SharedValue<number>; focus: SharedValue<number> }) {
  const st = useAnimatedStyle(() => {
    const a = 0.5 + 0.5 * Math.sin(t.value * Math.PI * 2 + i * 0.6);
    const b = 0.5 + 0.5 * Math.sin(t.value * Math.PI * 4 + i * 1.3);
    return { height: 6 + (12 + 40 * (0.65 * a + 0.35 * b)) * focus.value, opacity: 0.55 + 0.45 * a };
  });
  return <Animated.View style={[{ width: 8, borderRadius: 4, backgroundColor: colors.lime }, st]} />;
}
function SceneSensors({ focus }: { focus: SharedValue<number> }) {
  const t = useSharedValue(0);
  useEffect(() => { t.value = withRepeat(withTiming(1, { duration: 2800, easing: Easing.linear }), -1); }, [t]);
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={styles.sceneKicker}>SOIL MOISTURE</Text>
          <Text style={styles.sceneTitle}>58% · Healthy</Text>
        </View>
        <View style={styles.livePill}><LiveDot color={colors.lime} size={7} /><Text style={styles.liveText}>Live</Text></View>
      </View>
      <View style={styles.eq}>{Array.from({ length: 20 }, (_, i) => <EqBar key={i} i={i} t={t} focus={focus} />)}</View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
        <Text style={styles.sceneSub}>Field C · 6 sensors</Text>
        <Text style={styles.sceneSub}>updated just now</Text>
      </View>
    </View>
  );
}

/* Scene 3 — switches flip themselves, one after another */
function AutoRow({ k, label, icon, t }: { k: number; label: string; icon: any; t: SharedValue<number> }) {
  const on = useDerivedValue(() => clamp01((t.value - (0.12 + k * 0.2)) / 0.06) * (1 - clamp01((t.value - 0.94) / 0.05)));
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(on.value, [0, 1], ['rgba(255,255,255,0.22)', colors.limeDeep]) }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: on.value * 18 }] }));
  const state = useAnimatedStyle(() => ({ opacity: 0.45 + 0.55 * on.value }));
  return (
    <View style={styles.autoRow}>
      <Ionicons name={icon} size={18} color={colors.lime} />
      <Text style={styles.autoLabel}>{label}</Text>
      <Animated.Text style={[styles.autoState, state]}>auto</Animated.Text>
      <Animated.View style={[styles.sw, track]}><Animated.View style={[styles.swThumb, thumb]} /></Animated.View>
    </View>
  );
}
function SceneAuto() {
  const t = useSharedValue(0);
  const spin = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 5600, easing: Easing.linear }), -1);
    spin.value = withRepeat(withTiming(360, { duration: 6000, easing: Easing.linear }), -1);
  }, [t, spin]);
  const ring = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[{ position: 'absolute', width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.lime }, ring]} />
          <Ionicons name="airplane" size={18} color={colors.lime} />
        </View>
        <View style={{ marginLeft: 12 }}>
          <Text style={styles.sceneKicker}>AUTOPILOT</Text>
          <Text style={styles.sceneTitle}>Running itself</Text>
        </View>
      </View>
      <AutoRow k={0} label="Smart irrigation" icon="water" t={t} />
      <AutoRow k={1} label="Drone patrol" icon="airplane" t={t} />
      <AutoRow k={2} label="Night lights" icon="bulb" t={t} />
    </View>
  );
}

/* ---------------- one page ---------------- */
function Page({ i, scrollX, W, H, intro, top, bottom }: { i: number; scrollX: SharedValue<number>; W: number; H: number; intro: SharedValue<number>; top: number; bottom: number }) {
  const focus = useFocus(i, scrollX, W, intro);
  const kb = useSharedValue(0);
  useEffect(() => { kb.value = withRepeat(withTiming(1, { duration: 9000, easing: Easing.inOut(Easing.quad) }), -1, true); }, [kb]);
  const img = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(scrollX.value, [(i - 1) * W, i * W, (i + 1) * W], [-W * 0.2, 0, W * 0.2], Extrapolation.CLAMP) },
      { scale: 1.05 + kb.value * 0.09 },
      { translateY: -kb.value * 12 },
    ],
  }));
  const body = useAnimatedStyle(() => {
    const p = clamp01((focus.value - 0.4) / 0.5);
    return { opacity: p, transform: [{ translateY: (1 - p) * 22 }] };
  });
  const kicker = useAnimatedStyle(() => ({ opacity: clamp01(focus.value / 0.5), transform: [{ translateX: (1 - focus.value) * -40 }] }));
  const p = PAGES[i];
  const compact = H < 740;
  const Scene = [ScenePulse, SceneSensors, SceneAuto][i] as React.ComponentType<{ focus: SharedValue<number> }>;
  const words = p.title.split(' ');

  return (
    <View style={{ width: W, height: H, overflow: 'hidden' }}>
      <Animated.View style={[{ position: 'absolute', left: -W * 0.2, width: W * 1.4, height: H }, img]}>
        <Img uri={p.img} transition={0} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <LinearGradient colors={['rgba(8,24,17,0.55)', 'rgba(8,24,17,0.05)', 'rgba(8,24,17,0.94)']} locations={[0, 0.4, 0.86]} style={StyleSheet.absoluteFill} />

      <View style={{ position: 'absolute', top: top + 84, left: 0, right: 0, alignItems: 'center' }}>
        <SceneCard focus={focus} W={W} compact={compact}>
          <Scene focus={focus} />
        </SceneCard>
      </View>

      <View style={{ position: 'absolute', left: 28, right: 28, bottom: bottom + 24 + 68 + 26 }}>
        <Animated.Text style={[styles.kicker, { color: p.accent }, kicker]}>{`0${i + 1}  ·  ${p.kicker}`}</Animated.Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {words.map((w, k) => <Word key={k} text={w} idx={k} focus={focus} style={styles.title} />)}
        </View>
        <Animated.Text style={[styles.body, body]}>{p.body}</Animated.Text>
      </View>
    </View>
  );
}

/* ---------------- story-style progress ---------------- */
function Segment({ i, page, prog }: { i: number; page: SharedValue<number>; prog: SharedValue<number> }) {
  const st = useAnimatedStyle(() => ({ width: `${(i < page.value ? 1 : i === page.value ? prog.value : 0) * 100}%` as any }));
  return (
    <View style={styles.seg}>
      <Animated.View style={[{ height: '100%', borderRadius: 2, backgroundColor: colors.lime }, st]} />
    </View>
  );
}

/* ---------------- screen ---------------- */
export default function Onboarding() {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const scrollX = useSharedValue(0);
  const intro = useSharedValue(0);
  const page = useSharedValue(0);
  const prog = useSharedValue(0);
  const bloom = useSharedValue(0);
  const ref = useRef<Animated.ScrollView>(null);
  const [pageJS, setPageJS] = useState(0);
  const [kick, setKick] = useState(0);
  const [burst, setBurst] = useState(0);

  useEffect(() => { intro.value = withDelay(250, withTiming(1, { duration: 1500, easing: motion.easeOut })); }, [intro]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (e) => { scrollX.value = e.contentOffset.x; },
    onBeginDrag: () => { cancelAnimation(prog); },
    onMomentumEnd: () => { runOnJS(setKick)(Date.now()); },
  });
  useAnimatedReaction(
    () => Math.round(scrollX.value / W),
    (cur, prev) => {
      if (cur !== prev) {
        page.value = cur;
        runOnJS(setPageJS)(cur);
      }
    }
  );

  const advance = useCallback((n: number) => { ref.current?.scrollTo({ x: n * W, animated: true }); }, [W]);
  useEffect(() => {
    cancelAnimation(prog);
    prog.value = 0;
    if (pageJS >= PAGES.length - 1) {
      prog.value = withTiming(1, { duration: STORY_MS, easing: Easing.linear });
      return;
    }
    prog.value = withTiming(1, { duration: STORY_MS, easing: Easing.linear }, (done) => {
      if (done) runOnJS(advance)(pageJS + 1);
    });
  }, [pageJS, kick, advance, prog]);

  const goAuth = useCallback(() => router.replace('/auth'), []);
  const onComplete = useCallback(() => {
    cancelAnimation(prog);
    setBurst((b) => b + 1);
    bloom.value = withTiming(1, { duration: 760, easing: motion.easeOut }, (d) => {
      if (d) runOnJS(goAuth)();
    });
  }, [bloom, prog, goAuth]);

  const bloomStyle = useAnimatedStyle(() => ({ transform: [{ scale: 1 + bloom.value * ((Math.hypot(W, H) * 2.1) / 64) }], opacity: bloom.value > 0 ? 1 : 0 }));
  const bloomLogo = useAnimatedStyle(() => ({ opacity: interpolate(bloom.value, [0.55, 0.9], [0, 1], Extrapolation.CLAMP), transform: [{ scale: interpolate(bloom.value, [0.55, 1], [0.6, 1], Extrapolation.CLAMP) }] }));
  const uiOut = useAnimatedStyle(() => ({ opacity: 1 - interpolate(bloom.value, [0, 0.4], [0, 1], Extrapolation.CLAMP) }));

  const sliderW = W - 48;
  const bloomLeft = W - 24 - 6 - 28 - 32; // the seed's final resting spot
  const bloomTop = H - insets.bottom - 24 - 34 - 32;

  return (
    <View style={{ flex: 1, backgroundColor: colors.forestDeep }}>
      <FocusStatusBar style="light" />
      <Animated.ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16} bounces={false}>
        {PAGES.map((_, i) => <Page key={i} i={i} scrollX={scrollX} W={W} H={H} intro={intro} top={insets.top} bottom={insets.bottom} />)}
      </Animated.ScrollView>

      <Ambient scrollX={scrollX} W={W} H={H} />

      <Animated.View pointerEvents="box-none" style={[StyleSheet.absoluteFill, uiOut]}>
        <View style={[styles.stories, { top: insets.top + 8 }]}>
          {PAGES.map((_, i) => <Segment key={i} i={i} page={page} prog={prog} />)}
        </View>
        <View style={[styles.header, { top: insets.top + 24 }]}>
          <View style={styles.brand}>
            <View style={styles.logo}><Ionicons name="leaf" size={15} color={colors.forestDeep} /></View>
            <Text style={styles.brandText}>Verdant</Text>
          </View>
          <Pressable style={styles.skip} onPress={onComplete} hitSlop={12}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
        <View style={[styles.bottom, { bottom: insets.bottom + 24 }]}>
          <GrowSlider width={sliderW} onComplete={onComplete} />
        </View>
      </Animated.View>

      {/* the seed blooms into a full-screen lime wash, then hands off to sign-in */}
      <Animated.View pointerEvents="none" style={[styles.bloom, { left: bloomLeft, top: bloomTop }, bloomStyle]} />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center' }, bloomLogo]}>
        <View style={styles.bigLogo}><Ionicons name="leaf" size={44} color={colors.lime} /></View>
      </Animated.View>
      <View pointerEvents="none" style={{ position: 'absolute', left: bloomLeft + 32, top: bloomTop + 32 }}>
        <Burst trigger={burst} n={22} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stories: { position: 'absolute', left: 24, right: 24, flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden' },
  header: { position: 'absolute', left: 24, right: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo: { width: 28, height: 28, borderRadius: 10, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  brandText: { fontFamily: fonts.display, fontSize: 17, color: '#fff' },
  skip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.18)' },
  skipText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 13 },
  bottom: { position: 'absolute', left: 24, right: 24 },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 12, letterSpacing: 2.4, marginBottom: 12 },
  title: { fontFamily: fonts.displayXL, fontSize: 38, lineHeight: 41, color: '#fff', letterSpacing: -1.1 },
  body: { marginTop: 12, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: 'rgba(255,255,255,0.82)' },
  scene: { padding: 16, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  sceneKicker: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 1.4, color: 'rgba(255,255,255,0.7)' },
  sceneTitle: { marginTop: 3, fontFamily: fonts.display, fontSize: 19, color: '#fff' },
  sceneSub: { marginTop: 2, fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.7)' },
  ringNum: { fontFamily: fonts.displayXL, fontSize: 22, color: '#fff', padding: 0, textAlign: 'center', width: 70 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(8,24,17,0.45)', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 14 },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: '#fff' },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(8,24,17,0.45)', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14 },
  liveText: { fontFamily: fonts.bodyBold, fontSize: 11, color: '#fff' },
  eq: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 66, marginTop: 14 },
  autoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.2)' },
  autoLabel: { flex: 1, fontFamily: fonts.bodyMed, fontSize: 14, color: '#fff' },
  autoState: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.lime },
  sw: { width: 42, height: 24, borderRadius: 12, padding: 3 },
  swThumb: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#fff' },
  bloom: { position: 'absolute', width: 64, height: 64, borderRadius: 32, backgroundColor: colors.lime },
  bigLogo: { width: 96, height: 96, borderRadius: 32, backgroundColor: colors.forestDeep, alignItems: 'center', justifyContent: 'center' },
});
