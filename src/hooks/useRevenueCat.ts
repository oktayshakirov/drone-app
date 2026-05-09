import { useState, useEffect, useCallback } from "react";
import { Linking, Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CustomerInfo } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT } from "react-native-purchases-ui";
import {
  configureRevenueCat,
  getCustomerInfo,
  restorePurchases,
  hasProEntitlement,
  type RevenueCatError,
} from "../services/revenueCat";
import { ENTITLEMENT_PRO } from "../constants/revenueCat";

const RC_PRO_CACHE_KEY = "@dronepal/revenuecat_pro_cache_v1";

export interface UseRevenueCatResult {
  /** User has "Drone Pal Pro" entitlement. */
  isPro: boolean;
  /** Customer info from RevenueCat (null if not configured or error). */
  customerInfo: CustomerInfo | null;
  /** True while initial config or first fetch is in progress. */
  loading: boolean;
  /** Configuration or fetch error. */
  error: RevenueCatError | null;
  /** Re-fetch customer info (e.g. after purchase or restore). */
  refresh: () => Promise<void>;
  /** Present the RevenueCat paywall (current offering). */
  showPaywall: () => Promise<void>;
  /** Present paywall only if user doesn't have Pro. Returns whether paywall was shown. */
  showPaywallIfNeeded: () => Promise<boolean>;
  /** Restore purchases and refresh state. */
  restore: () => Promise<{ success: boolean; error?: RevenueCatError }>;
  /** Present RevenueCat Customer Center (manage subscription, restore, etc.). */
  showCustomerCenter: () => Promise<void>;
  /** Open native store subscriptions management screen. */
  openStoreSubscriptions: () => Promise<void>;
  /** True when RevenueCat is configured and available on this platform. */
  isAvailable: boolean;
  /** True after entitlement state has been fetched successfully at least once. */
  entitlementResolved: boolean;
}

export function useRevenueCat(): UseRevenueCatResult {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [cachedIsPro, setCachedIsPro] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RevenueCatError | null>(null);
  const [entitlementResolved, setEntitlementResolved] = useState(false);

  // RevenueCat billing APIs are unavailable in most iOS/Android simulators.
  // Skip SDK initialization there to avoid repetitive BILLING_UNAVAILABLE logs.
  // Note: `Constants.isDevice` can be null in some runtimes; treat "not false" as a real device.
  const isRealDevice = Constants.isDevice !== false;
  const isAvailable =
    (Platform.OS === "ios" || Platform.OS === "android") && isRealDevice;

  const persistProCache = useCallback(async (isPro: boolean) => {
    try {
      await AsyncStorage.setItem(RC_PRO_CACHE_KEY, isPro ? "1" : "0");
    } catch {
      // Ignore cache write failures.
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadCachedEntitlement() {
      try {
        const raw = await AsyncStorage.getItem(RC_PRO_CACHE_KEY);
        if (cancelled || raw == null) return;
        const cached = raw === "1";
        setCachedIsPro(cached);
        setEntitlementResolved(true);
      } catch {
        // Ignore cache read failures.
      }
    }
    loadCachedEntitlement();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchCustomerInfo = useCallback(async () => {
    if (!isAvailable) {
      setLoading(false);
      return;
    }
    const { customerInfo: info, error: err } = await getCustomerInfo();
    setError(err ?? null);
    if (!err) {
      setCustomerInfo(info ?? null);
      const hasPro = hasProEntitlement(info ?? null);
      setCachedIsPro(hasPro);
      persistProCache(hasPro);
      setEntitlementResolved(true);
    }
  }, [isAvailable, persistProCache]);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (!isAvailable) {
        setLoading(false);
        return;
      }
      const { ok, error: configError } = await configureRevenueCat();
      if (cancelled) return;
      if (!ok && configError) {
        setError(configError);
        setLoading(false);
        return;
      }
      await fetchCustomerInfo();
      if (!cancelled) setLoading(false);
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [isAvailable, fetchCustomerInfo]);

  const refresh = useCallback(async () => {
    if (!isAvailable) return;
    setLoading(true);
    await fetchCustomerInfo();
    setLoading(false);
  }, [isAvailable, fetchCustomerInfo]);

  const showPaywall = useCallback(async () => {
    if (!isAvailable) return;
    try {
      await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_PRO,
        displayCloseButton: true,
      });
      await fetchCustomerInfo();
    } catch {
      // User may have closed; refresh state anyway
      await fetchCustomerInfo();
    }
  }, [isAvailable, fetchCustomerInfo]);

  const showPaywallIfNeeded = useCallback(async (): Promise<boolean> => {
    if (!isAvailable) return false;
    try {
      const result = await RevenueCatUI.presentPaywallIfNeeded({
        requiredEntitlementIdentifier: ENTITLEMENT_PRO,
        displayCloseButton: true,
      });
      await fetchCustomerInfo();
      // Paywall was shown if result is not NOT_PRESENTED (user already had entitlement).
      return result !== PAYWALL_RESULT.NOT_PRESENTED;
    } catch {
      await fetchCustomerInfo();
      return false;
    }
  }, [isAvailable, fetchCustomerInfo]);

  const restore = useCallback(async () => {
    if (!isAvailable)
      return {
        success: false,
        error: {
          code: "UNSUPPORTED",
          message: "Not available on this platform.",
        },
      };
    setLoading(true);
    const { customerInfo: info, error: err } = await restorePurchases();
    setError(err ?? null);
    if (!err) {
      setCustomerInfo(info ?? null);
      const hasPro = hasProEntitlement(info ?? null);
      setCachedIsPro(hasPro);
      persistProCache(hasPro);
      setEntitlementResolved(true);
    }
    setLoading(false);
    return { success: Boolean(info && !err), error: err ?? undefined };
  }, [isAvailable, persistProCache]);

  const showCustomerCenter = useCallback(async () => {
    if (!isAvailable) return;
    try {
      await RevenueCatUI.presentCustomerCenter({
        callbacks: {
          onRestoreCompleted: () => {
            fetchCustomerInfo();
          },
        },
      });
      await fetchCustomerInfo();
    } catch {
      await fetchCustomerInfo();
    }
  }, [isAvailable, fetchCustomerInfo]);

  const openStoreSubscriptions = useCallback(async () => {
    if (Platform.OS === "ios") {
      const iosUrl = "https://apps.apple.com/account/subscriptions";
      await Linking.openURL(iosUrl);
      return;
    }
    if (Platform.OS === "android") {
      const pkg =
        (
          Constants.expoConfig as {
            android?: { package?: string };
          }
        )?.android?.package ?? "com.shadev.dronepal";
      const candidates = [
        `https://play.google.com/store/account/subscriptions?package=${pkg}`,
        "https://play.google.com/store/account/subscriptions",
      ];
      for (const url of candidates) {
        try {
          const canOpen = await Linking.canOpenURL(url);
          if (!canOpen) continue;
          await Linking.openURL(url);
          return;
        } catch {
          // Try the next candidate URL.
        }
      }
    }
  }, []);

  const isPro = hasProEntitlement(customerInfo) || cachedIsPro;

  return {
    isPro,
    customerInfo,
    loading,
    error,
    refresh,
    showPaywall,
    showPaywallIfNeeded,
    restore,
    showCustomerCenter,
    openStoreSubscriptions,
    isAvailable,
    entitlementResolved,
  };
}
