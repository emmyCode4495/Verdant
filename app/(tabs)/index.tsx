import React from 'react';
import { FlatList, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation, FadeIn, FadeOut, interpolate, interpolateColor, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  AnimatedNumber, FocusStatusBar, IconName, IconTile, Img, LiveDot, PressableScale, Reveal, Ring, RoundButton, SectionHeader,
} from '../../src/ui';
import { IMG, Farm, airStatus, soilStatus, weatherStatus } from '../../src/data';
import { selectFarm, useStore } from '../../src/store';
import { colors, fonts, motion, shadow } from '../../src/theme';

const HERO = 420;

/* Tap to flip: status on the front, the live reading on the back */
function StatCard({ label, status, value, unit, decimals = 0, icon, tint, iconBg, index }: {
  label: string; status: string; value: number; unit: string; decimals?: number; icon: IconName; tint: string; iconBg: string; index: number;
}) {
  const { width } = useWindowDimensions();
  const w = (width - 40 - 16) / 3;
  const flip = useSharedValue(0);
  const front = useAnimatedStyle(() => ({ transform: [{ perspective: 900 }, { rotateY: `${interpolate(flip.value, [0, 1], [0, 180])}deg` }] }));
  const back = useAnimatedStyle(() => ({ transform: [{ perspective: 900 }, { rotateY: `${interpolate(flip.value, [0, 1], [180, 360])}deg` }] }));
  return (
    <Reveal index={index}>
      <PressableScale haptic style={{ width: w, height: 122 }} onPress={() => { flip.value = withSpring(flip.value > 0.5 ? 0 : 1, motion.spring.fluid); }}>
        <Animated.View style={[styles.face, { backgroundColor: tint }, front]}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statStatus} numberOfLines={2}>{status}</Text>
          <View style={[styles.statIcon, { backgroundColor: iconBg }]}><Ionicons name={icon} size={20} color={colors.forest} /></View>
        </Animated.View>
        <Animated.View style={[styles.face, { backgroundColor: colors.forest }, back]}>
          <Text style={[styles.statLabel, { color: 'rgba(255,255,255,0.7)' }]}>{label}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
            <AnimatedNumber value={value} decimals={decimals} style={styles.statBig} />
            <Text style={styles.statUnit}>{unit}</Text>
          </View>
          <Text style={[styles.statLabel, { color: colors.lime, marginTop: 'auto' }]}>Live · tap to flip</Text>
        </Animated.View>
      </PressableScale>
    </Reveal>
  );
}

function FarmCard({ f, selected, onSelect, onOpen }: { f: Farm; selected: boolean; onSelect: () => void; onOpen: () => void }) {
  const p = useSharedValue(selected ? 1 : 0);
  React.useEffect(() => { p.value = withSpring(selected ? 1 : 0, motion.spring.snappy); }, [selected, p]);
  const box = useAnimatedStyle(() => ({
    borderColor: interpolateColor(p.value, [0, 1], ['rgba(255,255,255,0)', colors.forest]),
    transform: [{ scale: 1 + p.value * 0.02 }],
  }));
  const open = useAnimatedStyle(() => ({ opacity: p.value, transform: [{ scale: 0.6 + p.value * 0.4 }] }));
  return (
    <PressableScale haptic onPress={onSelect} scaleTo={0.97}>
      <Animated.View style={[styles.farmCard, shadow.card, box]}>
        <Img uri={f.image} style={{ height: 112, borderRadius: 18 }}>
          <View style={styles.ptsChip}><Text style={styles.ptsText}>{f.pts} pts</Text></View>
        </Img>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.farmName} numberOfLines={1}>{f.name}</Text>
            <Text style={styles.farmKind} numberOfLines={1}>{f.kind}</Text>
          </View>
          <Animated.View style={open} pointerEvents={selected ? 'auto' : 'none'}>
            <PressableScale onPress={onOpen} haptic style={styles.openBtn}>
              <Ionicons name="arrow-forward" size={16} color="#fff" style={{ transform: [{ rotate: '-45deg' }] }} />
            </PressableScale>
          </Animated.View>
        </View>
      </Animated.View>
    </PressableScale>
  );
}

function ActionRow({ icon, tint, title, sub, onPress, index }: { icon: IconName; tint: string; title: string; sub: string; onPress: () => void; index: number }) {
  return (
    <Reveal index={index} style={{ marginHorizontal: 20, marginBottom: 12 }}>
      <PressableScale onPress={onPress} haptic style={[styles.row, shadow.card]}>
        <IconTile name={icon} bg={tint} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.rowTitle}>{title}</Text>
          <Text style={styles.rowSub}>{sub}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.ink} />
      </PressableScale>
    </Reveal>
  );
}

export default function Home() {
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const userName = useStore((s) => s.userName);
  const farm = useStore(selectFarm);
  const farms = useStore((s) => s.farms);
  const select = useStore((s) => s.select);
  const unread = useStore((s) => s.notes.filter((n) => !n.read).length);
  const running = useStore((s) => Object.values(s.auto).filter(Boolean).length);

  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { y.value = e.contentOffset.y; });
  const heroStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(y.value, [0, HERO], [0, -HERO * 0.4], Extrapolation.CLAMP) },
      { scale: interpolate(y.value, [-250, 0], [1.5, 1], Extrapolation.CLAMP) },
    ],
  }));
  const headerStyle = useAnimatedStyle(() => ({ opacity: interpolate(y.value, [0, 140], [1, 0], Extrapolation.CLAMP) }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FocusStatusBar style="light" />

      {/* parallax hero — crossfades whenever the selected farm changes */}
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: HERO }, heroStyle]}>
        <Animated.View key={farm.id} entering={FadeIn.duration(700)} exiting={FadeOut.duration(450)} style={StyleSheet.absoluteFill}>
          <Img uri={farm.id === 'gv' ? IMG.hero : farm.image} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <LinearGradient colors={['rgba(8,24,17,0.5)', 'transparent']} style={[StyleSheet.absoluteFill, { height: 180 }]} />
        <LinearGradient colors={['transparent', colors.bg]} style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 170 }} />
      </Animated.View>

      <Animated.View style={[styles.header, { paddingTop: insets.top + 8 }, headerStyle]} pointerEvents="box-none">
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Img uri={IMG.avatar} style={styles.avatar} />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.welcome}>Welcome Back</Text>
            <Text style={styles.name}>{userName}</Text>
          </View>
        </View>
        <RoundButton icon="notifications-outline" badge={unread || undefined} onPress={() => router.push('/notifications')} />
      </Animated.View>

      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: HERO - 130, paddingBottom: 140 }}>
        <Reveal index={0} style={{ paddingHorizontal: 20, marginBottom: 14 }}>
          <View style={styles.livePill}>
            <LiveDot color={colors.lime} />
            <Text style={styles.liveText}>{farm.name} · {farm.hectares} ha · live</Text>
          </View>
        </Reveal>

        <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 28 }}>
          <StatCard index={1} label="Soil Condition" status={soilStatus(farm.moisture)} value={farm.moisture} unit="%" icon="heart" tint="#D6EEF8" iconBg="#EAF7FC" />
          <StatCard index={2} label="Weather" status={weatherStatus(farm.temp)} value={farm.temp} unit="°C" decimals={1} icon="sunny" tint="#DDF4E3" iconBg="#EEFAF1" />
          <StatCard index={3} label="Air Quality" status={airStatus(farm.air)} value={farm.air} unit=" AQI" icon="earth" tint="#E8F5D2" iconBg="#F4FAE9" />
        </View>

        <SectionHeader title="Choose Your Farm" />
        <FlatList
          horizontal data={farms} keyExtractor={(f) => f.id} showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 18 }}
          snapToInterval={172} decelerationRate="fast"
          renderItem={({ item }) => (
            <FarmCard f={item} selected={item.id === farm.id} onSelect={() => select(item.id)} onOpen={() => router.push(`/farm/${item.id}`)} />
          )}
        />

        <Reveal index={4} style={{ marginHorizontal: 20, marginBottom: 26 }}>
          <View style={[styles.perf, shadow.card]}>
            {[
              { label: 'Crop health', value: farm.health, suffix: '%', c: colors.forest },
              { label: 'Soil moisture', value: farm.moisture, suffix: '%', c: '#4A9AC2' },
              { label: 'Growth stage', value: farm.stage * 100, suffix: '%', c: colors.limeDeep },
            ].map((m) => (
              <View key={m.label} style={{ alignItems: 'center', flex: 1 }}>
                <Ring size={74} stroke={7} progress={m.value / 100} color={m.c}>
                  <AnimatedNumber value={m.value} suffix={m.suffix} style={styles.ringNum} />
                </Ring>
                <Text style={styles.ringLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
        </Reveal>

        <SectionHeader title="Instant Actions" right="Details" onRight={() => router.push('/control')} />
        <ActionRow index={5} icon="settings-outline" tint="#E3F6C9" title="System Automation" sub={`${running} of 5 systems running`} onPress={() => router.push('/control')} />
        <ActionRow index={6} icon="airplane" tint="#D6EEF8" title="Drone Control" sub="Open flight console" onPress={() => router.push('/drone')} />
        <ActionRow index={7} icon="water" tint="#DDF4E3" title="Irrigation Zones" sub={`${farm.zones.filter((z) => z.on).length} zones watering now`} onPress={() => router.push(`/farm/${farm.id}`)} />
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20 },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#fff' },
  welcome: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  name: { fontFamily: fonts.display, fontSize: 18, color: '#fff' },
  livePill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(20,49,42,0.72)', paddingVertical: 9, paddingHorizontal: 14, borderRadius: 20 },
  liveText: { color: '#fff', fontFamily: fonts.bodyMed, fontSize: 12.5 },
  face: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 24, padding: 12, backfaceVisibility: 'hidden' },
  statLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  statStatus: { marginTop: 3, fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink, lineHeight: 17 },
  statIcon: { position: 'absolute', right: 10, bottom: 10, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  statBig: { fontFamily: fonts.displayXL, fontSize: 30, color: '#fff', marginTop: 6, minWidth: 40 },
  statUnit: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.lime, marginBottom: 6, marginLeft: 2 },
  farmCard: { width: 160, backgroundColor: '#fff', borderRadius: 26, padding: 8, borderWidth: 2 },
  ptsChip: { position: 'absolute', top: 8, left: 8, backgroundColor: '#fff', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12 },
  ptsText: { fontFamily: fonts.bodyBold, fontSize: 10.5, color: colors.ink },
  farmName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  farmKind: { fontFamily: fonts.body, fontSize: 11.5, color: colors.muted, marginTop: 1 },
  openBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.forest, alignItems: 'center', justifyContent: 'center' },
  perf: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 28, paddingVertical: 20, paddingHorizontal: 8 },
  ringNum: { fontFamily: fonts.display, fontSize: 16, color: colors.ink, textAlign: 'center', width: 60 },
  ringLabel: { marginTop: 10, fontFamily: fonts.bodyMed, fontSize: 12, color: colors.muted },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 14 },
  rowTitle: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: colors.ink },
  rowSub: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 2 },
});
