import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { AnimatedNumber, DotProgress, FocusStatusBar, Img, LiveDot, PressableScale, Reveal, Ring, RoundButton, SectionHeader, Toggle } from '../../src/ui';
import { Farm, soilStatus } from '../../src/data';
import { useStore } from '../../src/store';
import { colors, fonts, motion, shadow } from '../../src/theme';

const HERO = 300;

function Bar({ v, last }: { v: number; last: boolean }) {
  const h = useSharedValue(4);
  useEffect(() => { h.value = withSpring(Math.max(6, v * 0.9), motion.spring.fluid); }, [v, h]);
  const st = useAnimatedStyle(() => ({ height: h.value }));
  return <Animated.View style={[{ flex: 1, borderRadius: 6, backgroundColor: last ? colors.forest : 'rgba(47,95,75,0.22)' }, st]} />;
}

function Stage({ f }: { f: Farm }) {
  const { width } = useWindowDimensions();
  const trackW = width - 40 - 36;
  const p = useSharedValue(0);
  useEffect(() => { p.value = withTiming(f.stage, { duration: 1100, easing: motion.easeOut }); }, [f.stage, p]);
  const fill = useAnimatedStyle(() => ({ width: p.value * trackW }));
  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * trackW - 9 }] }));
  const labels = ['Sowing', 'Growth', 'Flowering', 'Harvest'];
  return (
    <View>
      <View style={{ height: 18, justifyContent: 'center' }}>
        <View style={styles.track}><Animated.View style={[styles.trackFill, fill]} /></View>
        <Animated.View style={[styles.knob, knob]} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
        {labels.map((l, i) => (
          <Text key={l} style={[styles.stageLabel, f.stage >= i / 3 - 0.01 && { color: colors.forest, fontFamily: fonts.bodyBold }]}>{l}</Text>
        ))}
      </View>
    </View>
  );
}

export default function FarmDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const farm = useStore((s) => s.farms.find((f) => f.id === id));
  const hist = useStore((s) => (id ? s.hist[id] : undefined)) ?? [];
  const toggleZone = useStore((s) => s.toggleZone);
  const irrigate = useStore((s) => s.irrigate);
  const [running, setRunning] = useState(false);

  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { y.value = e.contentOffset.y; });
  const hero = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(y.value, [0, HERO], [0, -HERO * 0.4], Extrapolation.CLAMP) },
      { scale: interpolate(y.value, [-250, 0], [1.5, 1], Extrapolation.CLAMP) },
    ],
  }));
  const cycle = useSharedValue(0);
  const cycleFill = useAnimatedStyle(() => ({ width: `${cycle.value * 100}%` as any }));

  if (!farm) return null;

  const run = () => {
    if (running) return;
    setRunning(true);
    cycle.value = 0;
    cycle.value = withTiming(1, { duration: 4200, easing: Easing.inOut(Easing.quad) }, (done) => {
      if (done) runOnJS(finish)();
    });
  };
  const finish = () => {
    irrigate(farm.id, 7);
    setRunning(false);
    cycle.value = withTiming(0, { duration: 400 });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FocusStatusBar style="light" />
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: HERO }, hero]}>
        <Img uri={farm.image} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(8,24,17,0.55)', 'transparent', colors.bg]} locations={[0, 0.45, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <View style={[styles.top, { top: insets.top + 8 }]}>
        <RoundButton icon="arrow-back" onPress={() => router.back()} />
        <View style={styles.live}><LiveDot color={colors.lime} /><Text style={styles.liveText}>Live</Text></View>
      </View>

      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: HERO - 90, paddingBottom: insets.bottom + 40 }}>
        <Reveal index={0} style={{ marginHorizontal: 20 }}>
          <View style={[styles.card, shadow.float, { flexDirection: 'row', alignItems: 'center' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.kicker}>{farm.kind.toUpperCase()}</Text>
              <Text style={styles.title}>{farm.name}</Text>
              <Text style={styles.meta}>{farm.hectares} ha · {farm.crop} · pH {farm.ph}</Text>
            </View>
            <Ring size={72} stroke={7} progress={farm.health / 100}>
              <AnimatedNumber value={farm.health} suffix="%" style={styles.ringNum} />
            </Ring>
          </View>
        </Reveal>

        <Reveal index={1} style={{ marginHorizontal: 20, marginTop: 14 }}>
          <View style={[styles.card, shadow.card]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View>
                <Text style={styles.label}>Soil moisture · {soilStatus(farm.moisture)}</Text>
                <AnimatedNumber value={farm.moisture} decimals={1} suffix="%" style={styles.big} />
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.label}>Air temp</Text>
                <AnimatedNumber value={farm.temp} decimals={1} suffix="°C" style={[styles.big, { fontSize: 22, color: colors.forest }]} />
              </View>
            </View>
            <View style={styles.bars}>
              {hist.map((v, i) => <Bar key={i} v={v} last={i === hist.length - 1} />)}
            </View>
            <Text style={styles.caption}>Last 14 readings · updates every few seconds</Text>
          </View>
        </Reveal>

        <Reveal index={2} style={{ marginHorizontal: 20, marginTop: 14 }}>
          <View style={[styles.card, shadow.card]}>
            <Text style={[styles.label, { marginBottom: 14 }]}>Crop timeline</Text>
            <Stage f={farm} />
          </View>
        </Reveal>

        <View style={{ height: 24 }} />
        <SectionHeader title="Irrigation zones" />
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          {farm.zones.map((z, i) => (
            <Reveal key={z.id} index={i + 3}>
              <View style={[styles.zone, shadow.card]}>
                <Ionicons name="water" size={20} color={z.on ? '#4A9AC2' : colors.muted} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.zoneName}>{z.name}</Text>
                  <Text style={styles.caption}>{z.on ? 'Watering now' : 'Idle'}</Text>
                </View>
                <Toggle value={z.on} onChange={() => toggleZone(farm.id, z.id)} />
              </View>
            </Reveal>
          ))}
        </View>

        <Reveal index={7} style={{ marginHorizontal: 20, marginTop: 20 }}>
          <PressableScale haptic onPress={run} style={styles.cta}>
            <Animated.View style={[styles.ctaFill, cycleFill]} />
            <Ionicons name={running ? 'water' : 'play'} size={18} color="#fff" />
            <Text style={styles.ctaText}>{running ? 'Running irrigation cycle…' : 'Run full irrigation cycle'}</Text>
          </PressableScale>
        </Reveal>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { position: 'absolute', left: 20, right: 20, zIndex: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  live: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(20,49,42,0.72)', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20 },
  liveText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 12 },
  card: { backgroundColor: '#fff', borderRadius: 28, padding: 18 },
  kicker: { fontFamily: fonts.bodyBold, fontSize: 10.5, letterSpacing: 1.4, color: colors.muted },
  title: { fontFamily: fonts.displayXL, fontSize: 25, color: colors.ink, letterSpacing: -0.6, marginTop: 2 },
  meta: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 4 },
  ringNum: { fontFamily: fonts.display, fontSize: 15, color: colors.ink, textAlign: 'center', width: 56 },
  label: { fontFamily: fonts.bodyMed, fontSize: 12.5, color: colors.muted },
  big: { fontFamily: fonts.displayXL, fontSize: 34, color: colors.ink, minWidth: 120 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', gap: 5, height: 92, marginTop: 16 },
  caption: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, marginTop: 8 },
  track: { height: 8, borderRadius: 4, backgroundColor: 'rgba(18,37,28,0.08)', overflow: 'hidden' },
  trackFill: { height: 8, borderRadius: 4, backgroundColor: colors.forest },
  knob: { position: 'absolute', left: 0, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.lime, borderWidth: 3, borderColor: colors.forest },
  stageLabel: { fontFamily: fonts.bodyMed, fontSize: 11.5, color: colors.muted },
  zone: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 22, padding: 14 },
  zoneName: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.ink },
  cta: { height: 60, borderRadius: 30, backgroundColor: colors.forestDeep, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  ctaFill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: colors.forest },
  ctaText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 15 },
});
