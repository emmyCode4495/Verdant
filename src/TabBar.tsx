import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, shadow } from './theme';
import type { IconName } from './ui';

const META: Record<string, { label: string; icon: IconName; on: IconName }> = {
  index: { label: 'Home', icon: 'home-outline', on: 'home' },
  work: { label: 'Work', icon: 'leaf-outline', on: 'leaf' },
  control: { label: 'Control', icon: 'flash-outline', on: 'flash' },
  rewards: { label: 'Rewards', icon: 'trophy-outline', on: 'trophy' },
};

// Structural props so this works with both the classic React Navigation tab bar
// (`navigation`) and Expo Router 58's tab view (`emitter` + `navigateToTab`).
type TabBarProps = {
  state: { index: number; routes: { key: string; name: string }[] };
  navigation?: any;
  emitter?: any;
  navigateToTab?: (routeKey: string) => void;
};

/** Floating dock with a lime "lens" that slides and stretches between tabs. */
export function TabBar({ state, navigation, emitter, navigateToTab }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const [w, setW] = useState(0);
  const n = state.routes.length;
  const itemW = w / n;
  const x = useSharedValue(0);
  const stretch = useSharedValue(1);

  useEffect(() => {
    if (!w) return;
    x.value = withSpring(state.index * itemW, { damping: 16, stiffness: 210, mass: 0.9 });
    stretch.value = withSequence(withTiming(1.3, { duration: 110 }), withSpring(1, { damping: 12, stiffness: 200 }));
  }, [state.index, w, itemW, x, stretch]);

  const lens = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }, { scaleX: stretch.value }] }));

  return (
    <View style={[styles.bar, shadow.float, { bottom: insets.bottom + 10 }]}>
      <View style={styles.row} onLayout={(e) => setW(e.nativeEvent.layout.width)}>
        {w > 0 && <Animated.View style={[styles.lens, { width: itemW - 8 }, lens]} />}
        {state.routes.map((route, i) => {
          const focused = state.index === i;
          const m = META[route.name] ?? META.index;
          return (
            <Pressable
              key={route.key}
              style={styles.item}
              onPress={() => {
                const e = (emitter ?? navigation)?.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !e?.defaultPrevented) {
                  Haptics.selectionAsync();
                  if (navigateToTab) navigateToTab(route.key);
                  else navigation?.navigate(route.name);
                }
              }}
            >
              <Ionicons name={focused ? m.on : m.icon} size={21} color={focused ? colors.forestDeep : 'rgba(255,255,255,0.62)'} />
              <Text style={[styles.label, { color: focused ? colors.forestDeep : 'rgba(255,255,255,0.62)' }]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { position: 'absolute', left: 20, right: 20, height: 68, borderRadius: 34, backgroundColor: colors.forestDeep, padding: 6 },
  row: { flex: 1, flexDirection: 'row' },
  lens: { position: 'absolute', left: 4, top: 0, bottom: 0, borderRadius: 28, backgroundColor: colors.lime },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  label: { fontFamily: fonts.bodyBold, fontSize: 10.5 },
});
