# Google Maps API key (Android)

The map screen uses **react-native-maps** with Google Maps on Android. A Google Maps API key is required for Android dev and production builds. Without it, the app crashes on launch with:

`API key not found. Check that <meta-data android:name="com.google.android.geo.API_KEY" .../> is in the <application> element of AndroidManifest.xml`

Expo Go may run without it; native/development builds need the key.

## 1. Get an API key

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. Enable **Maps SDK for Android**: APIs & Services → Library → search “Maps SDK for Android” → Enable.
4. Go to **APIs & Services → Credentials** → **Create credentials** → **API key**.
5. (Recommended) Restrict the key: edit the key → **Application restrictions** → **Android apps** → add:
   - **Package name:** `com.shadev.dronepal` (from your `app.config.js`).
   - **SHA-1:** From your debug keystore (local builds) or from Play Console → Release → Setup → App integrity (for production).
6. Copy the API key.

## 2. Add the key to the project

In your `.env` (create from `.env.example` if needed), set:

```env
EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY=your_actual_api_key_here
```

The key is read in `app.config.js` and injected into the Android manifest at build time.

## 3. Rebuild the Android app

Regenerate the native project so the new key is in the manifest:

```bash
npx expo prebuild --platform android --clean
npx expo run:android
```

Or with EAS:

```bash
eas build --platform android
```

After setting the env var and rebuilding, the map screen should load on Android without crashing.
