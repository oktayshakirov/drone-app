# RevenueCat setup for DronePal

## 1. Install (already done)

```bash
npm install --save react-native-purchases react-native-purchases-ui
```

## 2. Configure API key

In `.env`:

```env
# Use one key for both platforms, or set per platform
REVENUECAT_API_KEY=your_public_api_key_here

# Optional: override per platform
# REVENUECAT_API_KEY_IOS=appl_xxx
# REVENUECAT_API_KEY_ANDROID=goog_xxx
```

Use your **public** API key from the RevenueCat dashboard (Project → API keys). For testing use the **sandbox** key (e.g. `test_xxx`).

## 3. RevenueCat dashboard setup

### Entitlement

1. In RevenueCat: **Project → Entitlements**.
2. Create an entitlement with identifier: **`pro`** (this is the `ENTITLEMENT_PRO` used in code).
3. Display name can be "Drone Pal Pro".

### Products

1. **App Store Connect** (iOS): create in-app products with IDs: `monthly`, `yearly`, `lifetime` (or match `src/constants/revenueCat.ts`).
2. **Google Play Console** (Android): create the same product IDs.
3. In RevenueCat: **Project → Products** → link your App Store / Play products to RevenueCat.
4. **Offerings**: create an offering (e.g. "default") and attach packages for monthly, yearly, lifetime so the paywall can display them.

### Paywall

1. In RevenueCat: **Paywalls** → create a paywall and attach your offering.
2. The app uses **RevenueCat UI** (`presentPaywall`) to show the paywall; design it in the dashboard.

## 4. App behavior

- **Entitlement check**: `useRevenueCat().isPro` is `true` when the user has the `pro` entitlement.
- **Subscribe**: "Drone Pal Pro — Subscribe" opens the RevenueCat paywall (`presentPaywall`).
- **Restore**: "Restore purchases" calls `Purchases.restorePurchases()` and refreshes customer info.
- **Manage**: When Pro, "Manage subscription" opens the Customer Center (`presentCustomerCenter`).

## 5. Error handling

- `useRevenueCat()` exposes `error` (e.g. no API key, network error). The footer shows `revenueCatError.message` when set.
- Restore and paywall errors are handled inside the hook; after closing paywall or restore we call `refresh()` to update `isPro`.

## 6. Expo / native build

`react-native-purchases` and `react-native-purchases-ui` use native code. For **Expo**:

- Use a **development build** (`npx expo prebuild` then build with Xcode/Android Studio), or
- Use **EAS Build** (`eas build`).

They do not run in Expo Go. See [Expo docs](https://docs.expo.dev/guides/development-builds/).

## 7. Product identifiers (code)

Defined in `src/constants/revenueCat.ts`:

| Code constant           | Product ID  | Use in App Store Connect / Play |
|-------------------------|------------|----------------------------------|
| `PRODUCT_ID_MONTHLY`    | `monthly`  | Monthly subscription             |
| `PRODUCT_ID_YEARLY`     | `yearly`   | Yearly subscription              |
| `PRODUCT_ID_LIFETIME`   | `lifetime` | Non-consumable lifetime         |

Create these products in the stores and link them in RevenueCat, then add them to your Offering so the paywall shows them.

## Links

- [RevenueCat React Native docs](https://www.revenuecat.com/docs/getting-started/installation/reactnative)
- [Paywalls](https://www.revenuecat.com/docs/tools/paywalls)
- [Customer Center](https://www.revenuecat.com/docs/tools/customer-center)
