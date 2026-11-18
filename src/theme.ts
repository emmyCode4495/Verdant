import { Easing } from 'react-native-reanimated';

// Direction: "soft-organic precision" — mint field light, deep forest ink, lime sprout accent.
export const colors = {
  bg: '#E4F1E8',
  bgDeep: '#D2E7DA',
  surface: '#FFFFFF',
  surfaceSoft: '#F2F8F2',
  forest: '#2F5F4B',
  forestDeep: '#14312A',
  ink: '#12251C',
  muted: '#6A7E73',
  line: 'rgba(18,37,28,0.08)',
  lime: '#CBE8A0',
  limeDeep: '#9ACD5B',
  sky: '#D8EDFA',
  mint: '#D9F2E1',
  sun: '#F5B942',
  danger: '#E0604A',
  white: '#FFFFFF',
};

export const fonts = {
  displayXL: 'BricolageGrotesque_800ExtraBold',
  display: 'BricolageGrotesque_700Bold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  body: 'DMSans_400Regular',
  bodyMed: 'DMSans_500Medium',
  bodyBold: 'DMSans_700Bold',
};

export const radius = { sm: 12, md: 20, lg: 28, xl: 36, pill: 999 };

export const motion = {
  duration: { instant: 90, fast: 160, base: 260, slow: 420, hero: 700 },
  easeOut: Easing.bezier(0.3, 0, 0, 1),
  ease: Easing.bezier(0.2, 0, 0, 1),
  spring: {
    snappy: { damping: 20, stiffness: 300, mass: 0.9 },
    fluid: { damping: 18, stiffness: 160, mass: 1 },
    bouncy: { damping: 11, stiffness: 180, mass: 1 },
  },
  stagger: 60,
};

export const shadow = {
  card: {
    shadowColor: '#1B4332',
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  float: {
    shadowColor: '#0B1F17',
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
};
