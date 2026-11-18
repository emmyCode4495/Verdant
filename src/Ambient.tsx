import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, SharedValue, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { colors } from './theme';

type Mote = { x: number; size: number; dur: number; delay: number; sway: number; depth: number; glow: boolean };

function MoteView({ m, W, H, scrollX }: { m: Mote; W: number; H: number; scrollX: SharedValue<number> }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(m.delay, withRepeat(withTiming(1, { duration: m.dur, easing: Easing.linear }), -1));
  }, [m, t]);
  const st = useAnimatedStyle(() => {
    // wrap horizontally so scroll-parallax never empties the screen
    const px = m.x * W - scrollX.value * m.depth * 0.45 + Math.sin(t.value * Math.PI * 2) * m.sway;
    const wrapped = ((px % W) + W) % W;
    return {
      opacity: Math.sin(Math.PI * t.value) * (m.glow ? 0.35 : 0.85),
      transform: [{ translateX: wrapped }, { translateY: H * 0.95 - t.value * H * 0.85 }, { scale: 0.7 + t.value * 0.5 }],
    };
  });
  return (
    <Animated.View
      style={[{ position: 'absolute', left: 0, top: 0, width: m.size, height: m.size, borderRadius: m.size, backgroundColor: m.glow ? '#fff' : colors.lime }, st]}
    />
  );
}

/** Drifting pollen / seed motes. Parallax-linked to the onboarding pager. */
export function Ambient({ scrollX, W, H, count = 18 }: { scrollX: SharedValue<number>; W: number; H: number; count?: number }) {
  const motes = useMemo<Mote[]>(
    () => Array.from({ length: count }, (_, i) => ({
      x: ((i * 37) % 100) / 100,
      size: i % 5 === 0 ? 16 : 3 + (i % 4) * 2,
      dur: 7000 + ((i * 613) % 5200),
      delay: (i * 430) % 4200,
      sway: 14 + (i % 5) * 7,
      depth: 0.4 + (i % 4) * 0.3,
      glow: i % 5 === 0,
    })),
    [count]
  );
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {motes.map((m, i) => <MoteView key={i} m={m} W={W} H={H} scrollX={scrollX} />)}
    </View>
  );
}
