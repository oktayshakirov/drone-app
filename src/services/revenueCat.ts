/**
 * RevenueCat SDK wrapper: init, customer info, entitlement check, restore.
 * Use only on iOS/Android (native modules); no-op on web.
 * Follows RevenueCat quickstart: https://www.revenuecat.com/docs/getting-started/quickstart
 */
import { Platform } from "react-native";
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
} from "react-native-purchases";
import { ENTITLEMENT_PRO } from "../constants/revenueCat";
import { getRevenueCatApiKey } from "../utils/revenueCatEnv";

let isConfigured = false;

export type RevenueCatError = {
  code: string;
  message: string;
  userCancelled?: boolean;
};

export async function configureRevenueCat(): Promise<{
  ok: boolean;
  error?: RevenueCatError;
}> {
  if (Platform.OS !== "ios" && Platform.OS !== "android") {
    return { ok: false, error: { code: "UNSUPPORTED", message: "RevenueCat is not supported on this platform." } };
  }

  // Configure only once per app lifecycle (RevenueCat quickstart best practice).
  if (isConfigured) {
    return { ok: true };
  }

  const apiKey = getRevenueCatApiKey();
  if (!apiKey?.trim()) {
    return { ok: false, error: { code: "NO_API_KEY", message: "RevenueCat API key is not set." } };
  }

  try {
    // Set log level before configure; use verbose logs in development (quickstart recommendation).
    if (__DEV__) {
      await Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);
    }
    Purchases.configure({ apiKey });
    isConfigured = true;
    return { ok: true };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    return {
      ok: false,
      error: {
        code: err?.code ?? "CONFIGURE_FAILED",
        message: err?.message ?? String(e),
      },
    };
  }
}

export function isRevenueCatConfigured(): boolean {
  return isConfigured;
}

/** Returns whether the user has the "Drone Pal Pro" entitlement. */
export function hasProEntitlement(customerInfo: CustomerInfo | null): boolean {
  if (!customerInfo?.entitlements?.active) return false;
  return Boolean(customerInfo.entitlements.active[ENTITLEMENT_PRO]);
}

/** Get current customer info. Call after configure. */
export async function getCustomerInfo(): Promise<{
  customerInfo: CustomerInfo | null;
  error?: RevenueCatError;
}> {
  if (!isConfigured) {
    return {
      customerInfo: null,
      error: { code: "NOT_CONFIGURED", message: "RevenueCat has not been configured." },
    };
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return { customerInfo };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string; userCancelled?: boolean };
    return {
      customerInfo: null,
      error: {
        code: err?.code ?? "GET_CUSTOMER_INFO_FAILED",
        message: err?.message ?? String(e),
        userCancelled: err?.userCancelled,
      },
    };
  }
}

/** Restore previous purchases. */
export async function restorePurchases(): Promise<{
  customerInfo: CustomerInfo | null;
  error?: RevenueCatError;
}> {
  if (!isConfigured) {
    return {
      customerInfo: null,
      error: { code: "NOT_CONFIGURED", message: "RevenueCat has not been configured." },
    };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    return { customerInfo };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string; userCancelled?: boolean };
    return {
      customerInfo: null,
      error: {
        code: err?.code ?? "RESTORE_FAILED",
        message: err?.message ?? String(e),
        userCancelled: err?.userCancelled,
      },
    };
  }
}

/** Optional: log in a user by ID (e.g. after auth). Use null to log out. */
export async function logInUser(appUserId: string | null): Promise<{
  customerInfo: CustomerInfo | null;
  created: boolean;
  error?: RevenueCatError;
}> {
  if (!isConfigured) {
    return {
      customerInfo: null,
      created: false,
      error: { code: "NOT_CONFIGURED", message: "RevenueCat has not been configured." },
    };
  }

  try {
    const result = await Purchases.logIn(appUserId ?? "");
    return {
      customerInfo: result.customerInfo,
      created: (result as { created: boolean }).created,
    };
  } catch (e: unknown) {
    const err = e as { code?: string; message?: string };
    return {
      customerInfo: null,
      created: false,
      error: {
        code: err?.code ?? "LOG_IN_FAILED",
        message: err?.message ?? String(e),
      },
    };
  }
}

export { PURCHASES_ERROR_CODE };
