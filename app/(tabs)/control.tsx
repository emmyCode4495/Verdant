import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { AnimatedNumber, FocusStatusBar, IconName, IconTile, PressableScale, Reveal, Toggle } from '../../src/ui';
import { automations } from '../../src/data';
import { useStore } from '../../src/store';
import { colors, fonts, shadow } from '../../src/theme';

function Pulse({ on, delay }: { on: boolean; delay: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = on ? withDelay(delay, withRepeat(withTiming(1, { duration: 2200, easing: Easing.out(Easing.quad) }), -1)) : withTiming(0, { duration: 300 });
  }, [on, delay, p]);
  const st = useAnimatedStyle(() => ({ opacity: on ? 0.4 * (1 - p.value) : 0, transform: [{ scale: 0.6 + p.value * 1.6 }] }));
  return <Animated.View style={[styles.pulse, st]} />;
}

export default function Control() {
  const insets = useSafeAreaInsets();
  const auto = useStore((s) => s.auto);
  const toggle = useStore((s) => s.toggleAuto);
  const setAll = useStore((s) => s.setAllAuto);
  const flying = useStore((s) => s.flying);
  const count = Object.values(auto).filter(Boolean).length;
  const allOn = count === automations.length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FocusStatusBar style="dark" />
      <Animated.ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <Reveal index={0}>
          <Text style={styles.h1}>Automation</Text>
          <Text style={styles.sub}>Let the farm run itself — you stay in charge.</Text>
        </Reveal>

        <Reveal index={1} style={{ marginTop: 20 }}>
          <LinearGradient colors={[colors.forestDeep, colors.forest]} style={[styles.master, shadow.float]}>
            <View style={styles.pulseWrap}><Pulse on={count > 0} delay={0} /><Pulse on={count > 0} delay={900} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.masterLabel}>AUTOPILOT</Text>
              <Text style={styles.masterTitle}>{count} of {automations.length} systems{'\n'}running</Text>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 12 }}>
                <AnimatedNumber value={count * 1.2} decimals={1} style={styles.power} />
                <Text style={styles.powerUnit}> kW draw</Text>
              </View>
            </View>
            <Toggle value={allOn} onChange={(v) => setAll(v)} onColor={colors.limeDeep} />
          </LinearGradient>
        </Reveal>

        <View style={{ marginTop: 22, gap: 12 }}>
          {automations.map((a, i) => (
            <Reveal key={a.id} index={i + 2}>
              <View style={[styles.row, shadow.card]}>
                <IconTile name={a.icon as IconName} bg={auto[a.id] ? colors.lime : colors.surfaceSoft} color={auto[a.id] ? colors.forestDeep : colors.muted} />
                <View style={{ flex: 1, marginHorizontal: 14 }}>
                  <Text style={styles.rowTitle}>{a.title}</Text>
                  <Text style={styles.rowSub}>{a.sub}</Text>
                </View>
                <Toggle value={!!auto[a.id]} onChange={() => toggle(a.id)} />
              </View>
            </Reveal>
          ))}
        </View>

        <Reveal index={8} style={{ marginTop: 22 }}>
          <PressableScale haptic onPress={() => router.push('/drone')} style={[styles.drone, shadow.card]}>
            <IconTile name="airplane" bg={colors.forestDeep} color={colors.lime} />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.rowTitle}>Drone Control</Text>
              <Text style={styles.rowSub}>{flying ? 'D-2 is airborne · open console' : 'D-2 docked · ready for takeoff'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.ink} />
          </PressableScale>
        </Reveal>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.displayXL, fontSize: 32, color: colors.ink, letterSpacing: -1 },
  sub: { marginTop: 4, fontFamily: fonts.body, fontSize: 13.5, color: colors.muted },
  master: { borderRadius: 32, padding: 22, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  pulseWrap: { position: 'absolute', right: -30, top: 20, width: 120, height: 120, alignItems: 'center', justifyContent: 'center' },
  pulse: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: colors.lime },
  masterLabel: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.5, color: colors.lime },
  masterTitle: { marginTop: 6, fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: '#fff' },
  power: { fontFamily: fonts.displayXL, fontSize: 26, color: '#fff', minWidth: 54 },
  powerUnit: { fontFamily: fonts.bodyMed, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 14 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: colors.ink },
  rowSub: { fontFamily: fonts.body, fontSize: 12.5, color: colors.muted, marginTop: 2 },
  drone: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 14 },
});
