import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FocusStatusBar, IconName, IconTile, PressableScale, Reveal } from '../src/ui';
import { Note } from '../src/data';
import { useStore } from '../src/store';
import { colors, fonts, shadow } from '../src/theme';

const TONE = { warn: { bg: '#FBE6D3', fg: '#B5651D' }, ok: { bg: colors.mint, fg: colors.forest }, info: { bg: colors.sky, fg: '#2F6F94' } };

function Item({ n, index }: { n: Note; index: number }) {
  const markRead = useStore((s) => s.markRead);
  const dot = useAnimatedStyle(() => ({ opacity: withTiming(n.read ? 0 : 1), transform: [{ scale: withTiming(n.read ? 0.2 : 1) }] }));
  const t = TONE[n.tone];
  return (
    <Reveal index={index}>
      <PressableScale haptic onPress={() => markRead(n.id)} style={[styles.item, shadow.card, n.read && { opacity: 0.7 }]}>
        <IconTile name={n.icon as IconName} bg={t.bg} color={t.fg} />
        <View style={{ flex: 1, marginHorizontal: 14 }}>
          <Text style={styles.title}>{n.title}</Text>
          <Text style={styles.body}>{n.body}</Text>
          <Text style={styles.time}>{n.time} ago</Text>
        </View>
        <Animated.View style={[styles.unread, dot]} />
      </PressableScale>
    </Reveal>
  );
}

export default function Notifications() {
  const insets = useSafeAreaInsets();
  const notes = useStore((s) => s.notes);
  const markAll = useStore((s) => s.markAllRead);
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: 20 }}>
      <FocusStatusBar style="dark" />
      <View style={styles.grab} />
      <View style={styles.head}>
        <Text style={styles.h1}>Alerts</Text>
        <PressableScale haptic onPress={markAll} style={styles.markAll}><Text style={styles.markText}>Mark all read</Text></PressableScale>
      </View>
      <Animated.ScrollView layout={LinearTransition} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 30, gap: 12 }}>
        {notes.map((n, i) => <Item key={n.id} n={n} index={i} />)}
        <PressableScale onPress={() => router.back()} style={styles.close}><Text style={styles.closeText}>Close</Text></PressableScale>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  grab: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: 'rgba(18,37,28,0.15)', marginBottom: 14 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  h1: { fontFamily: fonts.displayXL, fontSize: 30, color: colors.ink, letterSpacing: -0.8 },
  markAll: { backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 18 },
  markText: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: colors.forest },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 24, padding: 14 },
  title: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: 3, lineHeight: 18 },
  time: { fontFamily: fonts.bodyMed, fontSize: 11.5, color: colors.forest, marginTop: 6 },
  unread: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.danger },
  close: { alignSelf: 'center', marginTop: 8, paddingHorizontal: 22, paddingVertical: 12 },
  closeText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.muted },
});
