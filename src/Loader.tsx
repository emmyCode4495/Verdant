import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import LottieView from 'lottie-react-native';

/* Branded loader — use this anywhere you'd reach for a spinner. */
export function LoadingLogo({ size = 140 }: { size?: number }) {
  return (
    <LottieView
      source={require('../assets/lottie/loading-logo.json')}
      autoPlay
      loop
      style={{ width: size, height: size }}
    />
  );
}

/* Full-screen loading state: soft scrim + the animated logo, fades in and out. */
export function LoadingOverlay({ size = 150 }: { size?: number }) {
  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(220)}
      style={styles.scrim}
      pointerEvents="auto"
    >
      <View style={styles.center}>
        <LoadingLogo size={size} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(8,24,17,0.6)', zIndex: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
