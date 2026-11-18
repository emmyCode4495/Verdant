import React, { useEffect } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AnimatedNumber, FocusStatusBar, LiveDot, PressableScale, Reveal, RoundButton } from '../src/ui';
import { useStore } from '../src/store';
import { colors, fonts, motion } from '../src/theme';

const BLIPS = [
  { x: 0.28, y: 0.3, label: 'Green Valley' },
  { x: 0.72, y: 0.38, label: 'Sunrise' },
  { x: 0.34, y: 0.7, label: 'Riverbend' },
  { x: 0.68, y: 0.74, label: 'Highland' },
];

function Blip({ x, y, label, R, i }: { x: number; y: number; label: string; R: number; i: number }) {
  return (
    <Reveal index={i + 3} style={{ position: 'absolute', left: x * R - 5, top: y * R - 5 }}>
      <LiveDot color={colors.lime} size={10} />
      <Text style={styles.blipLabel}>{label}</Text>
    </Reveal>
  );
}

export default function Drone() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const R = width - 56;
  const flying = useStore((s) => s.flying);
  const battery = useStore((s) => s.battery);
  const altitude = useStore((s) => s.altitude);
  const speed = useStore((s) => s.speed);
  const toggle = useStore((s) => s.toggleFlight);
  const notify = useStore((s) => s.notify);

  const sweep = useSharedValue(0);
  const orbit = useSharedValue(0);
  const radius = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(withTiming(360, { duration: 3200, easing: Easing.linear }), -1);
    orbit.value = withRepeat(withTiming(360, { duration: 9000, easing: Easing.linear }), -1);
  }, [sweep, orbit]);
  useEffect(() => {
    radius.value = withSpring(flying ? R * 0.3 : 0, motion.spring.fluid);
  }, [flying, R, radius]);

  const sweepStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${sweep.value}deg` }] }));
  const orbitStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${orbit.value}deg` }] }));
  const droneStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -radius.value }] }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.forestDeep }}>
      <FocusStatusBar style="light" />
      <LinearGradient colors={[colors.forestDeep, '#0D2119']} style={StyleSheet.absoluteFill} />

      <View style={[styles.top, { paddingTop: insets.top + 8 }]}>
        <RoundButton icon="arrow-back" onPress={() => router.back()} />
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.title}>Drone D-2</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <LiveDot color={flying ? colors.lime : colors.sun} size={7} />
            <Text style={styles.state}>{flying ? 'Airborne · scanning' : 'Docked · ready'}</Text>
          </View>
        </View>
        <View style={{ width: 52 }} />
      </View>

      <Reveal index={0} style={{ alignSelf: 'center', marginTop: 28 }}>
        <View style={{ width: R, height: R, borderRadius: R / 2, overflow: 'hidden', backgroundColor: 'rgba(203,232,160,0.05)', borderWidth: 1, borderColor: 'rgba(203,232,160,0.25)' }}>
          {[0.66, 0.33].map((k) => (
            <View key={k} style={{ position: 'absolute', width: R * k, height: R * k, borderRadius: R, left: (R - R * k) / 2, top: (R - R * k) / 2, borderWidth: 1, borderColor: 'rgba(203,232,160,0.18)' }} />
          ))}
          <View style={[styles.cross, { left: R / 2, top: 0, width: 1, height: R }]} />
          <View style={[styles.cross, { top: R / 2, left: 0, height: 1, width: R }]} />

          <Animated.View style={[StyleSheet.absoluteFill, sweepStyle]}>
            <LinearGradient colors={['rgba(203,232,160,0)', 'rgba(203,232,160,0.38)']} start={{ x: 0, y: 1 }} end={{ x: 1, y: 0.2 }} style={{ position: 'absolute', left: R / 2, top: 0, width: R / 2, height: R / 2 }} />
            <View style={{ position: 'absolute', left: R / 2 - 1, top: 0, width: 2, height: R / 2, backgroundColor: colors.lime }} />
          </Animated.View>

          {BLIPS.map((b, i) => <Blip key={b.label} {...b} R={R} i={i} />)}

          <Animated.View style={[StyleSheet.absoluteFill, orbitStyle]}>
            <Animated.View style={[{ position: 'absolute', left: R / 2 - 18, top: R / 2 - 18, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }, droneStyle]}>
              <Ionicons name="airplane" size={18} color={colors.forestDeep} />
            </Animated.View>
          </Animated.View>
        </View>
      </Reveal>

      <Reveal index={4} style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 20, marginTop: 28 }}>
        {[
          { l: 'Battery', v: battery, s: '%', d: 0, i: 'battery-half' },
          { l: 'Altitude', v: altitude, s: ' m', d: 0, i: 'arrow-up' },
          { l: 'Speed', v: speed, s: ' km/h', d: 0, i: 'speedometer-outline' },
        ].map((t) => (
          <View key={t.l} style={styles.tile}>
            <Ionicons name={t.i as any} size={16} color={colors.lime} />
            <AnimatedNumber value={t.v} decimals={t.d} suffix={t.s} style={styles.tileNum} />
            <Text style={styles.tileLabel}>{t.l}</Text>
          </View>
        ))}
      </Reveal>

      <Reveal index={5} style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 20, marginTop: 'auto', paddingBottom: insets.bottom + 20 }}>
        <PressableScale haptic style={[styles.btn, { backgroundColor: 'rgba(255,255,255,0.1)', flex: 0.8 }]} onPress={() => (flying ? notify('Scanning Sunrise Fields…') : notify('Take off first to start a scan'))}>
          <Ionicons name="scan" size={18} color="#fff" />
          <Text style={[styles.btnText, { color: '#fff' }]}>Scan field</Text>
        </PressableScale>
        <PressableScale haptic style={[styles.btn, { backgroundColor: colors.lime, flex: 1.2 }]} onPress={toggle}>
          <Ionicons name={flying ? 'home' : 'rocket'} size={18} color={colors.forestDeep} />
          <Text style={[styles.btnText, { color: colors.forestDeep }]}>{flying ? 'Return home' : 'Take off'}</Text>
        </PressableScale>
      </Reveal>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  title: { fontFamily: fonts.display, fontSize: 20, color: '#fff' },
  state: { fontFamily: fonts.bodyMed, fontSize: 12.5, color: 'rgba(255,255,255,0.7)' },
  cross: { position: 'absolute', backgroundColor: 'rgba(203,232,160,0.14)' },
  blipLabel: { position: 'absolute', left: 14, top: -2, width: 90, fontFamily: fonts.bodyMed, fontSize: 10.5, color: 'rgba(255,255,255,0.7)' },
  tile: { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 22, padding: 14, gap: 4 },
  tileNum: { fontFamily: fonts.displayXL, fontSize: 22, color: '#fff', marginTop: 4 },
  tileLabel: { fontFamily: fonts.body, fontSize: 11.5, color: 'rgba(255,255,255,0.6)' },
  btn: { height: 58, borderRadius: 29, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 15 },
});
