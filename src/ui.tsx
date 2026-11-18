import React, { ReactNode, useEffect } from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import Animated, {
  FadeInDown, interpolate, interpolateColor, useAnimatedProps, useAnimatedStyle, useSharedValue,
  withDelay, withRepeat, withSequence, withSpring, withTiming, Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, fonts, motion } from './theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

/* ---------- Status bar that only speaks when its screen is focused ---------- */
export function FocusStatusBar({ style }: { style: 'light' | 'dark' }) {
  const navigation = useNavigation();
  const [focused, setFocused] = React.useState(() => navigation.isFocused());

  useEffect(() => {
    const onFocus = navigation.addListener('focus', () => setFocused(true));
    const onBlur = navigation.addListener('blur', () => setFocused(false));
    return () => { onFocus(); onBlur(); };
  }, [navigation]);

  return focused ? <StatusBar style={style} /> : null;
}

/* ---------- Press feedback: spring scale + optional haptic ---------- */
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
type PSProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
  scaleTo?: number;
  haptic?: boolean;
};
export function PressableScale({ scaleTo = 0.96, haptic = false, style, onPress, children, ...rest }: PSProps) {
  const s = useSharedValue(1);
  const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      onPressIn={() => { s.value = withSpring(scaleTo, motion.spring.snappy); }}
      onPressOut={() => { s.value = withSpring(1, motion.spring.snappy); }}
      onPress={(e) => { if (haptic) Haptics.selectionAsync(); onPress?.(e); }}
      style={[style, a] as any}
    >
      {children}
    </AnimatedPressable>
  );
}

/* ---------- Staggered entrance ---------- */
export function Reveal({ index = 0, children, style }: { index?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={FadeInDown.delay(120 + index * motion.stagger).duration(520).easing(motion.easeOut)} style={style}>
      {children}
    </Animated.View>
  );
}

/* ---------- Rolling number (runs fully on the UI thread) ---------- */
const AnimatedInput = Animated.createAnimatedComponent(TextInput);
export function AnimatedNumber({
  value, decimals = 0, prefix = '', suffix = '', thousands = false, style, duration = 800,
}: {
  value: number; decimals?: number; prefix?: string; suffix?: string; thousands?: boolean;
  style?: StyleProp<TextStyle>; duration?: number;
}) {
  const sv = useSharedValue(0);
  useEffect(() => {
    sv.value = withTiming(value, { duration, easing: motion.easeOut });
  }, [value, duration, sv]);
  const props = useAnimatedProps(() => {
    let s = sv.value.toFixed(decimals);
    if (thousands) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    const text = `${prefix}${s}${suffix}`;
    return { text, defaultValue: text } as any;
  });
  return (
    <AnimatedInput
      editable={false}
      allowFontScaling={false}
      underlineColorAndroid="transparent"
      defaultValue={`${prefix}${(0).toFixed(decimals)}${suffix}`}
      style={[{ padding: 0, margin: 0 }, style]}
      animatedProps={props}
    />
  );
}

/* ---------- Progress ring ---------- */
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export function Ring({
  size = 56, stroke = 6, progress, color = colors.forest, track = 'rgba(18,37,28,0.08)', children,
}: { size?: number; stroke?: number; progress: number; color?: string; track?: string; children?: ReactNode }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(Math.min(1, Math.max(0, progress)), { duration: 900, easing: motion.easeOut });
  }, [progress, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: c * (1 - p.value) }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeLinecap="round" rotation="-90" origin={`${size / 2}, ${size / 2}`}
          animatedProps={props}
        />
      </Svg>
      {children}
    </View>
  );
}

/* ---------- Dotted progress (matches the reference's dotted bars) ---------- */
function Dot({ filled, i, size, color }: { filled: boolean; i: number; size: number; color: string }) {
  const p = useSharedValue(filled ? 1 : 0);
  useEffect(() => {
    p.value = withDelay(i * 26, withTiming(filled ? 1 : 0, { duration: 300 }));
  }, [filled, i, p]);
  const st = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(p.value, [0, 1], ['rgba(18,37,28,0.12)', color]),
    transform: [{ scale: interpolate(p.value, [0, 0.5, 1], [1, 1.5, 1]) }],
  }));
  return <Animated.View style={[{ width: size, height: size, borderRadius: size / 2 }, st]} />;
}
export function DotProgress({ value, total = 12, size = 7, gap = 4, color = colors.forest }: { value: number; total?: number; size?: number; gap?: number; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', gap }}>
      {Array.from({ length: total }, (_, i) => <Dot key={i} i={i} size={size} color={color} filled={i < value} />)}
    </View>
  );
}

/* ---------- Image with a designed fallback behind it ---------- */
export function Img({ uri, style, children, sharedTag, transition = 500 }: { uri: string; style?: StyleProp<ViewStyle>; children?: ReactNode; sharedTag?: string; transition?: number }) {
  const Wrap: any = sharedTag ? Animated.View : View;
  return (
    <Wrap
      {...(sharedTag ? { sharedTransitionTag: sharedTag } : null)}
      style={[{ overflow: 'hidden', backgroundColor: colors.bgDeep }, style]}
    >
      <LinearGradient colors={['#8FBF9F', '#CBE8A0']} style={StyleSheet.absoluteFill} />
      <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={transition} />
      {children}
    </Wrap>
  );
}

/* ---------- Live pulse dot ---------- */
export function LiveDot({ color = colors.limeDeep, size = 8 }: { color?: string; size?: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.quad) }), -1);
  }, [p]);
  const halo = useAnimatedStyle(() => ({ opacity: 0.6 * (1 - p.value), transform: [{ scale: 1 + p.value * 2.2 }] }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size, backgroundColor: color }, halo]} />
      <View style={{ width: size, height: size, borderRadius: size, backgroundColor: color }} />
    </View>
  );
}

/* ---------- Switch ---------- */
export function Toggle({ value, onChange, onColor = colors.forest }: { value: boolean; onChange: (v: boolean) => void; onColor?: string }) {
  const p = useSharedValue(value ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(value ? 1 : 0, motion.spring.snappy);
  }, [value, p]);
  const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], ['#CCD9D0', onColor]) }));
  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * 22 }] }));
  return (
    <Pressable hitSlop={10} onPress={() => { Haptics.selectionAsync(); onChange(!value); }}>
      <Animated.View style={[{ width: 52, height: 30, borderRadius: 15, padding: 3 }, track]}>
        <Animated.View style={[{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' }, thumb]} />
      </Animated.View>
    </Pressable>
  );
}

/* ---------- Celebration burst ---------- */
function Particle({ i, n, trigger }: { i: number; n: number; trigger: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (!trigger) return;
    p.value = 0;
    p.value = withTiming(1, { duration: 950, easing: motion.easeOut });
  }, [trigger, p]);
  const a = (i / n) * Math.PI * 2;
  const dist = 70 + (i % 3) * 26;
  const palette = [colors.lime, colors.sun, colors.limeDeep, colors.forest];
  const st = useAnimatedStyle(() => ({
    opacity: p.value === 0 ? 0 : 1 - p.value,
    transform: [
      { translateX: Math.cos(a) * dist * p.value },
      { translateY: Math.sin(a) * dist * p.value },
      { scale: 1 - p.value * 0.4 },
    ],
  }));
  return <Animated.View style={[{ position: 'absolute', width: 10, height: 10, borderRadius: i % 2 ? 5 : 2, backgroundColor: palette[i % 4] }, st]} />;
}
export function Burst({ trigger, n = 18 }: { trigger: number; n?: number }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', alignSelf: 'center', top: '50%', width: 1, height: 1 }}>
      {Array.from({ length: n }, (_, i) => <Particle key={i} i={i} n={n} trigger={trigger} />)}
    </View>
  );
}

/* ---------- Small shared pieces ---------- */
export function IconTile({ name, bg = colors.mint, color = colors.forest, size = 46 }: { name: IconName; bg?: string; color?: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.36, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={size * 0.48} color={color} />
    </View>
  );
}

export function SectionHeader({ title, right, onRight }: { title: string; right?: string; onRight?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 19, color: colors.ink, letterSpacing: -0.3 }}>{title}</Text>
      {right ? (
        <Pressable onPress={onRight} hitSlop={10}>
          <Text style={{ fontFamily: fonts.bodyMed, fontSize: 13, color: colors.muted }}>{right}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function RoundButton({ icon, onPress, badge, dark = false }: { icon: IconName; onPress?: () => void; badge?: number; dark?: boolean }) {
  return (
    <PressableScale onPress={onPress} haptic style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: dark ? colors.forestDeep : '#fff', alignItems: 'center', justifyContent: 'center', shadowColor: '#0B1F17', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 5 }}>
      <Ionicons name={icon} size={22} color={dark ? '#fff' : colors.ink} />
      {badge ? (
        <View style={{ position: 'absolute', top: 12, right: 13, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
          <Text style={{ color: '#fff', fontSize: 9, fontFamily: fonts.bodyBold }}>{badge}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}