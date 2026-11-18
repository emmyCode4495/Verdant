import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';
import Animated, {
  FadeInDown, FadeOutUp, LinearTransition, interpolateColor, runOnJS, useAnimatedStyle, useSharedValue,
  withRepeat, withSequence, withSpring, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { FocusStatusBar, IconName, Img, PressableScale, Reveal } from '../src/ui';
import { IMG } from '../src/data';
import { LoadingOverlay } from '../src/Loader';
import { useStore } from '../src/store';
import { colors, fonts, motion } from '../src/theme';

function Field({ icon, right, ...input }: { icon: IconName; right?: React.ReactNode } & React.ComponentProps<typeof TextInput>) {
  const f = useSharedValue(0);
  const box = useAnimatedStyle(() => ({
    borderColor: interpolateColor(f.value, [0, 1], ['rgba(18,37,28,0.08)', colors.forest]),
    backgroundColor: interpolateColor(f.value, [0, 1], [colors.surfaceSoft, '#FFFFFF']),
    transform: [{ scale: 1 + f.value * 0.015 }],
  }));
  const iconStyle = useAnimatedStyle(() => ({ opacity: 0.5 + f.value * 0.5 }));
  return (
    <Animated.View style={[styles.field, box]}>
      <Animated.View style={iconStyle}><Ionicons name={icon} size={20} color={colors.forest} /></Animated.View>
      <TextInput
        {...input}
        placeholderTextColor="#9BAEA3"
        style={styles.input}
        onFocus={() => { f.value = withTiming(1, { duration: 180 }); }}
        onBlur={() => { f.value = withTiming(0, { duration: 180 }); }}
      />
      {right}
    </Animated.View>
  );
}

export default function Auth() {
  const { width: W, height: H } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const login = useStore((s) => s.login);
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('alex@verdant.farm');
  const [pw, setPw] = useState('farmlife');
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const seg = useSharedValue(0);
  const shake = useSharedValue(0);
  const grow = useSharedValue(0);

  const segW = (W - 48 - 8) / 2;
  const indicator = useAnimatedStyle(() => ({ transform: [{ translateX: seg.value * segW }] }));
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shake.value }] }));
  const overlay = useAnimatedStyle(() => ({ transform: [{ scale: grow.value * 40 }], opacity: grow.value > 0 ? 1 : 0 }));

  const switchMode = (m: 'in' | 'up') => {
    setMode(m);
    setErr('');
    seg.value = withSpring(m === 'in' ? 0 : 1, motion.spring.snappy);
    Haptics.selectionAsync();
  };

  const finish = () => {
    login(name.trim() || 'Alex Hales');
    router.replace('/(tabs)');
  };

  const submit = () => {
    if (busy) return;
    if (!email.includes('@') || pw.length < 6 || (mode === 'up' && name.trim().length < 2)) {
      setErr(mode === 'up' && name.trim().length < 2 ? 'Tell us your name to get started.' : !email.includes('@') ? 'That email looks off.' : 'Password needs at least 6 characters.');
      shake.value = withSequence(withTiming(-10, { duration: 50 }), withRepeat(withTiming(10, { duration: 90 }), 5, true), withTiming(0, { duration: 50 }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setErr('');
    setBusy(true);
    grow.value = withDelay(1300, withTiming(1, { duration: 650, easing: motion.easeOut }, (done) => {
      if (done) runOnJS(finish)();
    }));
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FocusStatusBar style="light" />
      <ScrollView keyboardShouldPersistTaps="handled" bounces={false} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <Img uri={IMG.greenhouse} style={{ height: H * 0.36 }}>
          <LinearGradient colors={['rgba(8,24,17,0.55)', 'rgba(8,24,17,0.1)', 'rgba(8,24,17,0.75)']} style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', left: 24, right: 24, bottom: 58, top: insets.top + 20, justifyContent: 'flex-end' }}>
            <View style={styles.logo}><Ionicons name="leaf" size={20} color={colors.forestDeep} /></View>
            <Text style={styles.heroTitle}>{mode === 'in' ? 'Welcome back to\nyour fields' : 'Start growing\nsmarter today'}</Text>
          </View>
        </Img>

        <View style={styles.sheet}>
          <Reveal index={0}>
            <View style={styles.segment}>
              <Animated.View style={[styles.segIndicator, { width: segW }, indicator]} />
              {(['in', 'up'] as const).map((m) => (
                <Pressable key={m} style={styles.segItem} onPress={() => switchMode(m)}>
                  <Text style={[styles.segText, { color: mode === m ? '#fff' : colors.ink }]}>{m === 'in' ? 'Sign in' : 'Create account'}</Text>
                </Pressable>
              ))}
            </View>
          </Reveal>

          <Animated.View layout={LinearTransition.springify().damping(18)} style={[{ gap: 12, marginTop: 20 }, shakeStyle]}>
            {mode === 'up' && (
              <Animated.View entering={FadeInDown.duration(320)} exiting={FadeOutUp.duration(180)}>
                <Field icon="person-outline" placeholder="Full name" value={name} onChangeText={setName} autoCapitalize="words" />
              </Animated.View>
            )}
            <Field icon="mail-outline" placeholder="Email address" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <Field
              icon="lock-closed-outline" placeholder="Password" value={pw} onChangeText={setPw} secureTextEntry={!show}
              right={<Pressable hitSlop={10} onPress={() => setShow((v) => !v)}><Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.muted} /></Pressable>}
            />
          </Animated.View>

          <Animated.View layout={LinearTransition.springify().damping(18)}>
            {err ? <Animated.Text entering={FadeInDown.duration(200)} style={styles.err}>{err}</Animated.Text> : <View style={{ height: 22 }} />}
            <PressableScale onPress={submit} haptic style={styles.cta}>
              {busy ? (
                <Text style={styles.ctaText}>Signing you in…</Text>
              ) : (
                <>
                  <Text style={styles.ctaText}>{mode === 'in' ? 'Enter the farm' : 'Create my account'}</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </PressableScale>
            <Text style={styles.hint}>Demo mode · any valid email and 6+ character password works</Text>
          </Animated.View>
        </View>
      </ScrollView>

      {busy && <LoadingOverlay />}

      {/* success: the button's green blooms into the app */}
      <Animated.View pointerEvents="none" style={[styles.bloom, { left: W / 2 - 40, top: H - insets.bottom - 150 }, overlay]} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  logo: { width: 40, height: 40, borderRadius: 14, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  heroTitle: { fontFamily: fonts.displayXL, fontSize: 32, lineHeight: 35, color: '#fff', letterSpacing: -0.8 },
  sheet: { flex: 1, marginTop: -36, backgroundColor: colors.bg, borderTopLeftRadius: 36, borderTopRightRadius: 36, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 32 },
  segment: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 28, padding: 4, height: 54 },
  segIndicator: { position: 'absolute', left: 4, top: 4, bottom: 4, borderRadius: 24, backgroundColor: colors.forest },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  segText: { fontFamily: fonts.bodyBold, fontSize: 14 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 58, borderRadius: 20, borderWidth: 1.5, paddingHorizontal: 16 },
  input: { flex: 1, fontFamily: fonts.bodyMed, fontSize: 15, color: colors.ink, height: '100%' },
  err: { height: 22, marginTop: 0, fontFamily: fonts.bodyMed, fontSize: 13, color: colors.danger },
  cta: { height: 60, borderRadius: 30, backgroundColor: colors.forest, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, shadowColor: colors.forest, shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  ctaText: { fontFamily: fonts.bodyBold, fontSize: 16, color: '#fff' },
  hint: { marginTop: 14, textAlign: 'center', fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  bloom: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: colors.forest },
});
