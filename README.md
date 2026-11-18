# Verdant — Smart Farming (Expo / React Native)

Built from your reference: splash → onboarding → auth → live farm dashboard.

## Run
```bash
npm install
npx expo install --fix      # aligns every native package to your Expo SDK
npx expo start
```
Needs a dev build or Expo Go that matches the SDK. Reanimated 4 needs `react-native-worklets`
(already in package.json); `babel-preset-expo` wires the plugin automatically.

## Flow
`app/index` splash (sprout draws itself) → `onboarding` (parallax pager + slide-to-start pill)
→ `auth` (animated fields, shake validation, green bloom into app) → `(tabs)`:
Home · Work · Control · Rewards, plus `farm/[id]`, `drone`, `notifications`.

## What's live
`src/store.ts` ticks every 2.5s: soil/temp/air drift per farm, irrigation raises moisture,
In-Progress tasks fill their dots and award points (toast fires), drone battery drains while flying.
Swap `tick` for a websocket/MQTT feed when your server exists — screens only read the store.

## Signature moves
- Slide-to-start pill (onboarding)
- Flip-on-tap sensor cards (Home)
- Lime "lens" tab bar that slides + stretches
- Rolling numbers and dotted progress that pop in sequence

## Retheme
All colors, fonts, springs and shadows live in `src/theme.ts`.
Images are Unsplash placeholders in `src/data.ts` (gradient shows if one fails) — replace with your assets.
