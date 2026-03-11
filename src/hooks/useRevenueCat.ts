import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
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
  /** True when RevenueCat is configured and available on this platform. */
  isAvailable: boolean;
}

export function useRevenueCat(): UseRevenueCatResult {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<RevenueCatError | null>(null);

  const isAvailable = Platform.OS === "ios" || Platform.OS === "android";

  const fetchCustomerInfo = useCallback(async () => {
    if (!isAvailable) {
      setLoading(false);
      return;
    }
    const { customerInfo: info, error: err } = await getCustomerInfo();
    setCustomerInfo(info ?? null);
    setError(err ?? null);
  }, [isAvailable]);

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
      await RevenueCatUI.presentPaywall({ displayCloseButton: true });
      await fetchCustomerInfo();
    } catch (e) {
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
    setCustomerInfo(info ?? null);
    setError(err ?? null);
    setLoading(false);
    return { success: Boolean(info && !err), error: err ?? undefined };
  }, [isAvailable]);

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

  const isPro = hasProEntitlement(customerInfo);

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
    isAvailable,
  };
}
