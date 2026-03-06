# AdMob banner setup (DronePal)

The app shows a small **bottom banner ad** for non‑Pro users, using [react-native-google-mobile-ads](https://github.com/invertase/react-native-google-mobile-ads) and the same structure as [crypto-wiki-app/components/ads](https://github.com/oktayshakirov/crypto-wiki-app/tree/main/components/ads): `adConfig`, `useAdConsent`, and a banner component with fade-in and AppState reload.

## Behaviour

- **Pro users:** Banner is hidden.
- **Free users:** Adaptive banner is shown at the bottom of the main screen (above the safe area inset).
- **Development:** `USE_TEST_ADS` is `true` in `__DEV__`, so Google test unit IDs are used; in production builds your banner unit IDs from `adConfig` are used.

## Requirements

- **Development build for ads:** The AdMob native module (`RNGoogleMobileAdsModule`) is **not** included in Expo Go. To see the banner, run a dev build: `npx expo run:ios` or `npx expo run:android` (or EAS development build). In **Expo Go** the app still runs; `App.tsx` only lazy-loads and renders the banner when not in Expo Go, so the native module is never loaded there.
- **AdMob account:** Create an app and banner ad units in [AdMob](https://admob.google.com/).

## Configuration

### 1. App IDs (app.json)

The Expo plugin is already configured with **test** App IDs so the project builds. For production, replace them with your AdMob App IDs:

- In [AdMob](https://admob.google.com/) → Apps → Your app → App settings, copy the **App ID** (e.g. `ca-app-pub-xxxxxxxx~xxxxxxxx`).
- In `app.json`, under `plugins` → `react-native-google-mobile-ads`, set:
  - `androidAppId`: your Android App ID
  - `iosAppId`: your iOS App ID

You can switch to `app.config.js` and use env vars for these if you prefer.

### 2. Banner ad unit IDs

- Production banner unit IDs are in `src/components/ads/adConfig.ts` (`adUnitIDs.banner`).
- In `.env` (or EAS Secrets), set:
  - `EXPO_PUBLIC_ADMOB_BANNER_ANDROID=ca-app-pub-xxxxxxxx/yyyyyyyy`
  - `EXPO_PUBLIC_ADMOB_BANNER_IOS=ca-app-pub-xxxxxxxx/yyyyyyyy`

If these are not set, the app uses Google’s **test** banner unit IDs so you can run and test without invalid traffic.

## Files

- `src/components/ads/BannerAd.tsx` – Banner: hidden when `isPro`; bottom placement with safe area, fade-in on load, reload on app foreground; uses `getAdUnitId` and `useAdConsent`.
- `src/components/ads/adConfig.ts` – `USE_TEST_ADS`, `adUnitIDs.banner` (iOS/Android), `getAdUnitId("banner")` (TestIds loaded lazily to avoid pulling in the native module at import time).
- `src/components/ads/useAdConsent.ts` – Reads `trackingConsent` from AsyncStorage; `requestNonPersonalizedAdsOnly` for ad requests.
- `App.tsx` – Lazy-loads `BannerAd` only when not in Expo Go (`Constants.appOwnership !== "expo"`), initializes the Mobile Ads SDK, and renders the banner below the main content.

## Testing

- Use the provided test App IDs and test unit IDs in development to avoid policy issues.
- Pro state is driven by RevenueCat; toggle Pro in the app or via RevenueCat sandbox to confirm the banner hides for Pro users.
