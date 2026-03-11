# RevenueCat setup for DronePal

This guide covers the paywall plan, Pro benefits, subscription plans, and step-by-step setup in the RevenueCat dashboard and app stores.

The app implementation follows the [RevenueCat SDK Quickstart](https://www.revenuecat.com/docs/getting-started/quickstart): configure once on launch with the **public** API key (iOS key on iOS, Google key on Android), set log level before configure in development, check entitlement via `customerInfo.entitlements.active[ENTITLEMENT_PRO]`, present paywall with RevenueCat UI, and expose restore purchases (e.g. via Customer Center).

---

## 1. Paywall logic & Pro benefits

### What Pro unlocks

| Benefit                                                     | Free                          | Pro                                       | Notes                                                              |
| ----------------------------------------------------------- | ----------------------------- | ----------------------------------------- | ------------------------------------------------------------------ |
| **No ads**                                                  | Banner shown                  | No ads                                    | Implemented via `isPro` → hide `AdBanner`.                         |
| **Real-time weather refresh**                               | Pull-to-refresh shows paywall; auto-refresh once per 12h on app open | Pull-to-refresh works | Free: pull shows paywall. Auto-refresh every 12h for free.         |
| **Location change for trip planning**                       | Tap opens paywall             | Full location picker                      | No lock icons; tap opens paywall.                                  |
| **Map search**                                              | Search button opens paywall   | Full map + search                          | Map view is free for all; searching new location is Pro.           |
| **Extended conditions**                                      | Values in grid only           | Info modal with explanations, breakdown   | Tap on conditions/Go-No-Go/Weather opens paywall for free.         |

**Current implementation:** No lock icons. Paywall triggers on: condition/Go-No-Go/Weather tap, location change, pull-to-refresh (free), map search (free). Red/yellow condition indicators shown to all. Subscription button next to Settings.

### Entitlement

- **Identifier:** `Drone Pal Pro` (used in code as `ENTITLEMENT_PRO` — must match dashboard exactly).
- When the user has an active **monthly** or **lifetime** purchase that is attached to the `pro` entitlement in RevenueCat, `isPro` is `true`.

---

## 2. Subscription plans

Two products: **monthly** and **lifetime**. Apple’s minimum for this tier is $2.99/mo, so monthly is set to $2.99. Lifetime is a one-time purchase at $29.99 (discount vs 12 months).

| Plan         | Product ID | Price        | Notes                                                    |
| ------------ | ---------- | ------------ | -------------------------------------------------------- |
| **Monthly**  | `monthly`  | **$2.99**/mo | Auto-renewable. Set in App Store Connect / Play Console. |
| **Lifetime** | `lifetime` | **$29.99**   | One-time. Non-consumable (iOS) / one-time (Android).     |

Use these exact prices in the stores so the paywall copy (“12 months for the price of 12, locked in forever”) stays consistent.

---

## 3. Step-by-step: RevenueCat dashboard

### 3.1 Create project and add apps

1. Go to [RevenueCat](https://app.revenuecat.com) and sign in.
2. **Create a project** (e.g. "DronePal") if you don’t have one.
3. **Add your iOS app:**
   - Project → **Apps** → **+ New**.
   - Platform: **Apple App Store**.
   - App name: DronePal.
   - **App-Specific Shared Secret:** From App Store Connect → Your app → App Information → App-Specific Shared Secret (for subscriptions). Paste it here.
   - **Bundle ID:** Must match your app (e.g. `com.shadev.drone-pal`).
4. **Add your Android app:**
   - **+ New** → Platform: **Google Play Store**.
   - **Package name:** e.g. `com.shadev.drone-pal`.
   - **Service account:** Create a Google Play service account and upload the JSON key; follow RevenueCat’s “Google Play” setup so RevenueCat can validate purchases.

### 3.2 Create entitlement

1. In the project, go to **Entitlements**.
2. **+ New**.
3. **Identifier:** `Drone Pal Pro` (must match `ENTITLEMENT_PRO` in code exactly).
4. **Display name:** e.g. "DronePal Pro".
5. Save.

### 3.3 Create products (store products are created in App Store Connect / Play Console)

RevenueCat does **not** create the products in the stores; it only references them. Create the products first in Apple and Google, then in RevenueCat:

1. **Products** in RevenueCat → **+ New**.
2. For each product, enter the **exact Product ID** you created in the store:
   - `monthly` (Subscription, Apple & Google).
   - `lifetime` (Non-Consumable on Apple; one-time product on Google).

Linking is done when you add these IDs to an **Offering** (below). RevenueCat will pull store metadata (price, etc.) when you attach the products to packages.

### 3.4 Create offering and packages

1. Go to **Offerings**.
2. **+ New Offering**.
3. **Identifier:** `default` (or the identifier you use when calling `getOfferings()` in code; RevenueCat UI often uses "default").
4. **Packages** in this offering:
   - **Monthly:** Type **Monthly**, attach product ID `monthly`. Attach to entitlement **Drone Pal Pro**.
   - **Lifetime:** Type **Lifetime** (or **Custom** with identifier `lifetime`), attach product ID `lifetime`. Attach to entitlement **Drone Pal Pro**.
5. Set **Lifetime** as the default or “best value” package if you want it highlighted.
6. Save.

### 3.5 Create paywall

1. Go to **Paywalls**.
2. **+ New Paywall**.
3. Choose a template or design your layout (title, features, monthly/lifetime buttons).
4. **Attach the offering:** e.g. "default".
5. Optionally set **Placements** (e.g. "default" placement for when you call `presentPaywall()`).
6. Save and **publish**.

### 3.6 Customer Center (manage subscription / restore)

1. Go to **Customer Center** (or Project settings).
2. Enable **Customer Center** and configure:
   - Restore purchases.
   - Manage subscription (link to store subscription management).
3. In the app you call `presentCustomerCenter()` so Pro users can manage or restore.

### 3.7 Get API keys

1. **Project** → **API Keys** (or Project settings).
2. Copy the **Public API key** for iOS and the one for Android (or the shared key if you use one key for both).
3. Put them in `.env`:
   - `REVENUECAT_API_KEY` (or `REVENUECAT_API_KEY_IOS` and `REVENUECAT_API_KEY_ANDROID`).

---

## 4. Step-by-step: App Store Connect (iOS)

1. **App Store Connect** → Your app → **Subscriptions** (or **In-App Purchases**).
2. Create a **Subscription Group** (e.g. "DronePal Pro").
3. **Add subscription:**
   - **Reference name:** e.g. "Monthly".
   - **Product ID:** `monthly` (must match code and RevenueCat).
   - Duration: 1 month.
   - **Price: $2.99** (or equivalent in each territory).
4. **Add in-app purchase (non-consumable)** for lifetime:
   - **Product ID:** `lifetime`.
   - Type: Non-Consumable.
   - **Price: $29.99**.
5. In **App Information**, copy the **App-Specific Shared Secret** and paste it in RevenueCat (Apps → iOS app).

---

## 5. Step-by-step: Google Play Console (Android)

1. **Google Play Console** → Your app → **Monetize** → **Subscriptions** or **In-app products**.
2. **Create subscription:**
   - **Product ID:** `monthly`.
   - Billing period: Monthly.
   - **Price: $2.99** (and free trial if desired).
3. **Create one-time product** (for lifetime):
   - **Product ID:** `lifetime`.
   - Type: One-time product (or managed product).
   - **Price: $29.99**.
4. Complete RevenueCat’s **Google Play** linking (service account key) so RevenueCat can verify Android purchases.

---

## 6. App configuration (already in code)

- **Entitlement identifier:** Must match RevenueCat **exactly** — currently `Drone Pal Pro` in `src/constants/revenueCat.ts` (`ENTITLEMENT_PRO`). If you rename the entitlement in RevenueCat, update this constant.
- **Product IDs:** `monthly`, `lifetime`.
- **Env:** `.env` / `app.config.js` `extra` has RevenueCat public API keys per platform.

### 6.1 Test without opening the paywall

Before wiring `presentPaywall()` everywhere, confirm the chain works:

1. **Customer info** — Should succeed on device/simulator if the API key is valid (no store products required).
   - `Purchases.getCustomerInfo()` → `activeEntitlementKeys` empty until purchase; after sandbox purchase should include `Drone Pal Pro`.

2. **Offerings + products** — Require the store to return `monthly` and `lifetime` (real device + sandbox, or simulator + StoreKit config + run from Xcode).
   - Call `verifyRevenueCatReadiness()` from `src/services/revenueCatVerify.ts` after configure (e.g. in `__DEV__` after `useRevenueCat` init, or from a temporary Settings button):
     - `offerings.ok` + `packageCount > 0` → paywall can load packages.
     - `products.count === 2` (or both IDs present) → StoreKit/App Store Connect sees your products.
   - Example:
     ```ts
     import { verifyRevenueCatReadiness } from "../services/revenueCatVerify";
     // after app is configured:
     const v = await verifyRevenueCatReadiness();
     console.log(JSON.stringify(v, null, 2));
     ```

3. **RevenueCat dashboard** — **Customers** tab with **View sandbox data** on: after a sandbox purchase, the customer should show the entitlement.

### 6.2 App Store Connect: “First IAP must be submitted with a new app version”

Apple shows this in the In-App Purchases / Subscriptions tab. It means:

- The **first** subscription or IAP for the app must be **attached to an app version** when you submit that version to App Review (version page → **In-App Purchases and Subscriptions** → select your products → submit binary + IAP together).
- **You can still test in sandbox** before that: create the IAPs, use a **development build** on a **real device** with a **Sandbox Apple ID**. Sandbox does not require the IAP to be approved or attached to a submitted version.
- After the first binary + IAP set is approved, additional IAPs can be submitted from the IAP section without a new binary in many cases.

So: **local/sandbox testing** is fine pre-submission; **production** purchases require the version + first IAP submission flow Apple describes.

---

## 7. App behavior summary

- **Entitlement check:** `useRevenueCat().isPro` is `true` when the user has the **Drone Pal Pro** entitlement (monthly or lifetime).
- **Subscribe / IAP button:** Top-right (next to Settings): pricetag icon for free users → `showPaywall()`; person icon for Pro → `showCustomerCenter()`.
- **Locked features:** Location, refresh, Go/No-Go details, Weather details, all condition grid items, and Map show lock icon for free users; tap opens paywall.
- **Restore:** Via Customer Center (Pro) or paywall flow.
- **Manage:** When Pro, subscription button opens `showCustomerCenter()`.

---

## 8. Native build (Expo)

`react-native-purchases` and `react-native-purchases-ui` use native code. They do **not** run in Expo Go. Use a **development build** (`npx expo run:ios` / `run:android`) or **EAS Build**.

---

## 9. Links

- [RevenueCat React Native](https://www.revenuecat.com/docs/getting-started/installation/reactnative)
- [RevenueCat Paywalls](https://www.revenuecat.com/docs/tools/paywalls)
- [RevenueCat Customer Center](https://www.revenuecat.com/docs/tools/customer-center)
- [App Store Connect In-App Purchase](https://developer.apple.com/in-app-purchase/)
- [Google Play Billing](https://developer.android.com/google/play/billing)
