import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { DotProgress, FocusStatusBar, Img, PressableScale, Reveal } from '../../src/ui';
import { Task } from '../../src/data';
import { useStore } from '../../src/store';
import { colors, fonts, motion, shadow } from '../../src/theme';

const CATS = [
  { k: 'daily', l: 'Daily Work' },
  { k: 'workers', l: 'Workers' },
  { k: 'tools', l: 'Tools' },
  { k: 'ongoing', l: 'Ongoing' },
] as const;

function TaskCard({ t, w, index, onPress }: { t: Task; w: number; index: number; onPress: () => void }) {
  const done = t.status === 'Done';
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 60).duration(420).easing(motion.easeOut)}
      exiting={FadeOut.duration(120)}
      layout={LinearTransition.springify().damping(18)}
      style={{ width: w }}
    >
      <View style={[styles.card, shadow.card]}>
        <Img uri={t.image} style={{ height: 104, borderRadius: 18 }}>
          <View style={styles.chip}><Text style={styles.chipText}>{t.pts} pts</Text></View>
        </Img>
        <Text style={styles.title} numberOfLines={2}>{t.title}</Text>
        <Text style={styles.meta}>{t.meta}</Text>
        <View style={{ marginTop: 10 }}><DotProgress value={t.progress} total={12} size={6} gap={3} color={done ? colors.limeDeep : colors.forest} /></View>
        <View style={styles.foot}>
          <Text style={[styles.status, { color: done ? colors.limeDeep : t.status === 'In Progress' ? colors.forest : colors.muted }]}>{t.status}</Text>
          <PressableScale onPress={onPress} haptic style={[styles.go, done && { backgroundColor: colors.lime }]}>
            <Ionicons name={done ? 'checkmark' : t.status === 'Scheduled' ? 'play' : 'arrow-forward'} size={15} color={colors.forestDeep}
              style={!done && t.status !== 'Scheduled' ? { transform: [{ rotate: '-45deg' }] } : undefined} />
          </PressableScale>
        </View>
      </View>
    </Animated.View>
  );
}

export default function Work() {
  const { width: W } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const tasks = useStore((s) => s.tasks);
  const start = useStore((s) => s.startTask);
  const [cat, setCat] = useState<(typeof CATS)[number]['k']>('daily');

  const segW = (W - 40 - 8) / 4;
  const x = useSharedValue(0);
  const st = useSharedValue(1);
  const pick = (i: number) => {
    setCat(CATS[i].k);
    x.value = withSpring(i * segW, { damping: 16, stiffness: 220 });
    st.value = withSequence(withTiming(1.2, { duration: 100 }), withSpring(1, { damping: 12 }));
    Haptics.selectionAsync();
  };
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { scaleX: st.value }] }));

  const list = tasks.filter((t) => t.cat === cat);
  const active = tasks.filter((t) => t.status === 'In Progress').length;
  const scheduled = tasks.filter((t) => t.status === 'Scheduled').length;
  const cardW = (W - 40 - 12) / 2;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FocusStatusBar style="dark" />
      <Animated.ScrollView contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 140, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
        <Reveal index={0}>
          <Text style={styles.h1}>Today’s Work</Text>
          <Text style={styles.sub}>{active} active · {scheduled} scheduled · progress syncs live</Text>
        </Reveal>

        <Reveal index={1} style={{ marginTop: 20, marginBottom: 18 }}>
          <View style={styles.segment}>
            <Animated.View style={[styles.indicator, { width: segW }, indicator]} />
            {CATS.map((c, i) => (
              <Pressable key={c.k} style={{ width: segW, alignItems: 'center', justifyContent: 'center' }} onPress={() => pick(i)}>
                <Text style={[styles.segText, { color: cat === c.k ? '#fff' : colors.ink }]}>{c.l}</Text>
              </Pressable>
            ))}
          </View>
        </Reveal>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {list.map((t, i) => <TaskCard key={t.id} t={t} w={cardW} index={i} onPress={() => start(t.id)} />)}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  h1: { fontFamily: fonts.displayXL, fontSize: 32, color: colors.ink, letterSpacing: -1 },
  sub: { marginTop: 4, fontFamily: fonts.body, fontSize: 13.5, color: colors.muted },
  segment: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 28, padding: 4, height: 52 },
  indicator: { position: 'absolute', left: 4, top: 4, bottom: 4, borderRadius: 24, backgroundColor: colors.forest },
  segText: { fontFamily: fonts.bodyBold, fontSize: 12.5 },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 8, paddingBottom: 12 },
  chip: { position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 11 },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.ink },
  title: { marginTop: 10, paddingHorizontal: 2, fontFamily: fonts.bodyBold, fontSize: 13.5, color: colors.ink, minHeight: 36 },
  meta: { paddingHorizontal: 2, fontFamily: fonts.body, fontSize: 11.5, color: colors.muted },
  foot: { marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 },
  status: { fontFamily: fonts.bodyBold, fontSize: 11 },
  go: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceSoft, alignItems: 'center', justifyContent: 'center' },
});
