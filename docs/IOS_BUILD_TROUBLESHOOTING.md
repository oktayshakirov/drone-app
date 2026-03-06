# iOS build troubleshooting

## "lipo: ... Command PhaseScriptExecution failed with a nonzero exit code"

This usually comes from the **CocoaPods frameworks script** (`Pods-DronePal-frameworks.sh`) when it runs `lipo` on React/React Native/Hermes frameworks. Stale or incomplete build artifacts are a common cause.

### Fix: clean and rebuild

From the **project root**:

```bash
# 1. Remove iOS build artifacts and Pods
rm -rf ios/build ios/Pods ios/Podfile.lock

# 2. Regenerate native project and install pods
npx expo prebuild --platform ios --clean

# 3. Build (choose one)
npx expo run:ios
# or open ios/DronePal.xcworkspace in Xcode and build there
```

If you prefer to keep your current `ios` folder and only reset Pods:

```bash
cd ios
rm -rf build Pods Podfile.lock
pod install
cd ..
npx expo run:ios
```

### If it still fails

- In **Xcode**: **Product → Clean Build Folder** (Shift+Cmd+K), then build again.
- Build for a **single destination** (e.g. one simulator or “Any iOS Device”) to avoid architecture mismatches.
- Ensure you’re on a supported **Xcode version** (e.g. 15+ for recent Expo/RN).
