import React, { useState } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, {
  Extrapolation, FadeIn, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSequence, withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { AnimatedNumber, Burst, DotProgress, FocusStatusBar, IconName, IconTile, Img, PressableScale, Reveal, SectionHeader } from '../../src/ui';
import { IMG, TIERS, benefits, earnSeed } from '../../src/data';
import { useStore } from '../../src/store';
import { colors, fonts, shadow } from '../../src/theme';

const HERO = 270;

export default function Rewards() {
  const insets = useSafeAreaInsets();
  const { width: W } = useWindowDimensions();
  const points = useStore((s) => s.points);
  const tierIdx = useStore((s) => s.tierIdx);
  const earned = useStore((s) => s.earned);
  const earn = useStore((s) => s.earn);
  const claim = useStore((s) => s.claim);
  const notify = useStore((s) => s.notify);
  const [burst, setBurst] = useState(0);

  const tier = TIERS[tierIdx];
  const next = TIERS[tierIdx + 1];
  const toNext = next ? Math.max(0, next.at - points) : 0;
  const ratio = next ? (points - tier.at) / (next.at - tier.at) : 1;
  const filled = Math.round(Math.min(1, Math.max(0, ratio)) * 16);

  const y = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => { y.value = e.contentOffset.y; });
  const hero = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(y.value, [0, HERO], [0, -HERO * 0.35], Extrapolation.CLAMP) },
      { scale: interpolate(y.value, [-200, 0], [1.4, 1], Extrapolation.CLAMP) },
    ],
  }));
  const shake = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));

  const onClaim = () => {
    if (claim()) {
      setBurst((b) => b + 1);
    } else {
      shake.value = withSequence(withTiming(-8, { duration: 50 }), withTiming(8, { duration: 80 }), withTiming(-6, { duration: 80 }), withTiming(0, { duration: 60 }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      notify(next ? `${toNext} more points to reach ${next.name}` : 'You are at the top tier');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FocusStatusBar style="light" />
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, height: HERO }, hero]}>
        <Img uri={IMG.greenhouse} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={['rgba(8,24,17,0.5)', 'transparent', colors.bg]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140 }}>
        <Text style={styles.screenTitle}>Rewards</Text>

        <Reveal index={0} style={{ marginHorizontal: 20, marginTop: HERO - insets.top - 110 }}>
          <View style={[styles.card, shadow.float]}>
            <Burst trigger={burst} />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="ribbon" size={20} color={colors.forest} />
                <Animated.Text key={tier.name} entering={FadeIn.duration(500)} style={styles.tierName}>{tier.name}</Animated.Text>
              </View>
              <View style={styles.seeBtn}><Text style={styles.seeText}>See Benefits</Text></View>
            </View>

            <View style={styles.pointsBox}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
                <View>
                  <AnimatedNumber value={points} thousands style={styles.points} />
                  <Text style={styles.pts}>Pts</Text>
                </View>
                <Text style={styles.toNext}>{next ? `${toNext} points to ${next.name.split(' ')[0]} Tier` : 'Top tier reached'}</Text>
              </View>
              <View style={{ marginTop: 14 }}><DotProgress value={filled} total={16} size={9} gap={5} /></View>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <PressableScale haptic style={[styles.btn, { backgroundColor: colors.surfaceSoft }]} onPress={() => notify('Complete the quick tasks below to earn points')}>
                <Text style={[styles.btnText, { color: colors.ink }]}>Earn More Points</Text>
              </PressableScale>
              <Animated.View style={[{ flex: 1 }, shakeStyle]}>
                <PressableScale haptic style={[styles.btn, { backgroundColor: toNext === 0 && next ? colors.forest : '#8CA89A' }]} onPress={onClaim}>
                  <Text style={[styles.btnText, { color: '#fff' }]}>Claim Benefits</Text>
                </PressableScale>
              </Animated.View>
            </View>
          </View>
        </Reveal>

        <View style={{ height: 28 }} />
        <SectionHeader title="Quick ways to earn" />
        <View style={{ paddingHorizontal: 20, gap: 10, marginBottom: 26 }}>
          {earnSeed.map((e, i) => (
            <Reveal key={e.id} index={i + 1}>
              <View style={[styles.row, shadow.card]}>
                <IconTile name={earned[e.id] ? 'checkmark-circle' : 'sparkles'} bg={earned[e.id] ? colors.lime : colors.mint} />
                <Text style={[styles.rowTitle, earned[e.id] && { color: colors.muted }]}>{e.title}</Text>
                <PressableScale haptic onPress={() => earn(e.id)} style={[styles.earn, earned[e.id] && { backgroundColor: colors.surfaceSoft }]}>
                  <Text style={[styles.earnText, earned[e.id] && { color: colors.muted }]}>{earned[e.id] ? 'Done' : `+${e.pts}`}</Text>
                </PressableScale>
              </View>
            </Reveal>
          ))}
        </View>

        <SectionHeader title="Your benefits" />
        <View style={{ paddingHorizontal: 20, gap: 10 }}>
          {benefits.map((b, i) => {
            const locked = b.tier > tierIdx;
            return (
              <Reveal key={b.title} index={i + 4}>
                <View style={[styles.row, shadow.card, locked && { opacity: 0.55 }]}>
                  <IconTile name={b.icon as IconName} bg={locked ? colors.surfaceSoft : colors.sky} color={locked ? colors.muted : colors.forest} />
                  <Text style={styles.rowTitle}>{b.title}</Text>
                  <Ionicons name={locked ? 'lock-closed' : 'checkmark-circle'} size={20} color={locked ? colors.muted : colors.limeDeep} />
                </View>
              </Reveal>
            );
          })}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenTitle: { position: 'absolute', alignSelf: 'center', top: 0, marginTop: 70, fontFamily: fonts.display, fontSize: 18, color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 32, padding: 16 },
  tierName: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  seeBtn: { backgroundColor: colors.forest, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  seeText: { color: '#fff', fontFamily: fonts.bodyBold, fontSize: 12 },
  pointsBox: { backgroundColor: colors.surfaceSoft, borderRadius: 22, padding: 16, marginVertical: 14 },
  points: { fontFamily: fonts.displayXL, fontSize: 36, color: colors.ink, minWidth: 110 },
  pts: { fontFamily: fonts.bodyMed, fontSize: 13, color: colors.muted, marginTop: -2 },
  toNext: { flex: 1, fontFamily: fonts.bodyMed, fontSize: 13, color: colors.ink, marginBottom: 6 },
  btn: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 13.5 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 22, padding: 12 },
  rowTitle: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.ink },
  earn: { backgroundColor: colors.lime, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16 },
  earnText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.forestDeep },
});
