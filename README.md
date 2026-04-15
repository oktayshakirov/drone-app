# Drone Pal

Drone Pal is a pre-flight companion for drone pilots of all skill levels. Get an instant Go/No-Go assessment from real-time weather and safety data, tailored to your aircraft weight class—from sub-250g minis to heavier rigs.

> Fly with confidence. Protect your gear. Drone Pal turns your phone into a focused safety dashboard: wind, gusts, visibility, geomagnetic activity, and a streamlined no-fly reference—so you can decide faster and fly smarter.

Whether you are planning a golden-hour shoot or a quick line-of-sight flight, Drone Pal surfaces the signals that matter most before you take off.

## Demo

![Drone Pal](https://oktayshakirov.com/assets/images/projects/drone-pal.png "Drone Pal")

<p align="center">
  <a href="https://play.google.com/store/apps/details?id=com.shadev.dronepal&pli=1"><strong>➥ Get it on Google Play</strong></a>
  &nbsp;·&nbsp;
  <a href="https://apps.apple.com/de/app/drone-pal/id6760303630?l=en-GB"><strong>➥ Download on the App Store</strong></a>
</p>

## Features

- **Weight-class thresholds** — Pick a class (under 250g through 1kg+) so wind and safety alerts match how your drone actually behaves.
- **Go / No-Go at a glance** — Green, yellow, and red status for quick decisions before launch.
- **Precision weather** — Hyper-local wind, gusts, visibility, and precipitation via **Apple WeatherKit** (JWT-authenticated REST).
- **24-hour outlook** — Hourly wind, cloud cover, and temperature to plan timing.
- **Kp index** — Geomagnetic activity for GPS reliability awareness.
- **No-fly reference map** — Airports, heliports, and caution zones as a planning aid (always verify against local rules).
- **Sun and sky** — Sunrise/sunset and UV for lighting and comfort.
- **Camera tutorials** — Scenario-based ISO / shutter / ND / WB starting points
- **Modern UI** — Expo + **NativeWind** (Tailwind), dark high-contrast theme.

> **Disclaimer:** Drone Pal is a safety reference tool. Always comply with local aviation laws and official sources before any flight.

## Stack

- **Expo** (SDK 54) + **TypeScript** + **React Native**
- **NativeWind** (Tailwind) for styling
- **expo-location** for GPS
- **Apple WeatherKit** REST API (JWT auth)
- **react-native-maps** — map screen (**Google Maps API key** required on Android for dev/production builds)
- **RevenueCat** — subscriptions (`react-native-purchases`)
- **Google Mobile Ads** — configured via Expo plugin in `app.json`

## Installation

### Prerequisites (once per machine)

- **Node.js:** [Install Node.js](https://nodejs.org/en/download/) (LTS recommended)
- **Android Studio:** [Android Studio](https://developer.android.com/studio) (Android builds & emulator)
- **Xcode:** [Xcode](https://developer.apple.com/xcode/) (iOS builds & Simulator, macOS only)
- **CocoaPods:** for native iOS dependencies (`sudo gem install cocoapods` or your preferred setup)

### Local setup

Clone the repo, open it in your editor, and use the project terminal.

- Install dependencies

```sh
npm install

# OR
yarn install
```

- **Environment:** copy `.env.example` to `.env` and fill in the values. `.env` is gitignored.

```sh
cp .env.example .env
```

| Variable                                  | Purpose                                                                                                                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `WEATHERKIT_*`                            | Live weather (Team ID, Service ID, Key ID, private key). Without valid credentials the app can fall back to **mock weather** for UI work. |
| `REVENUECAT_API_KEY`                      | Public SDK key (optional `REVENUECAT_API_KEY_IOS` / `REVENUECAT_API_KEY_ANDROID`).                                                        |
| `EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY` | Android map screen (also read by Gradle from `.env`).                                                                                     |

Create and configure WeatherKit keys in [Apple Developer](https://developer.apple.com/) (Identifiers → Services IDs, Keys with WeatherKit enabled).

- Install iOS pods (first time or after native changes)

```sh
cd ios && pod install && cd ..
```

- Start the dev server

```sh
npm start

# OR
yarn start
```

Then press **i** for iOS Simulator, **a** for Android emulator, or use a device with the Expo dev workflow.

- Run on Android (native project)

```sh
npm run android

# OR
yarn android
```

- Run on iOS (macOS)

```sh
npm run ios

# OR
yarn ios
```

## Production build

### Android

```sh
cd android
./gradlew assembleRelease
cd ..
```

Generate a signed **AAB/APK** in Android Studio or with your usual release keystore workflow.

### iOS (macOS, Xcode)

Open `ios/DronePal.xcworkspace` in Xcode and archive, or use `xcodebuild` with scheme **DronePal** and workspace **DronePal.xcworkspace**.

## Project structure

- `src/api` — WeatherKit client, mock weather
- `src/components` — Safety gauge, weather cards, weight class selector, map-related UI, camera tutorial modals
- `docs` — Feature notes (e.g. camera settings tutorials)
- `src/constants` — Drone weight classes and thresholds, copy
- `src/hooks` — Location and weather hooks
- `src/types` — Weather and safety types
- `src/utils` — JWT (WeatherKit), conversions, Go/No-Go evaluation, env helpers

## Troubleshooting

- **React Native:** [React Native troubleshooting](https://reactnative.dev/docs/troubleshooting)
- **Expo:** [Expo documentation](https://docs.expo.dev/)

## License

This project is provided for viewing purposes only. All rights are reserved. No part of this project may be copied, modified, or redistributed without explicit written permission from the author.
