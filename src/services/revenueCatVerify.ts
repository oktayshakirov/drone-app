/**
 * Pre–paywall verification: fetch offerings and products without presenting UI.
 * Use from a dev-only button or __DEV__ log to confirm RevenueCat + store wiring.
 */
import Purchases from "react-native-purchases";
import { PRODUCT_IDS } from "../constants/revenueCat";
import { isRevenueCatConfigured } from "./revenueCat";

export type RevenueCatVerifyResult = {
  configured: boolean;
  offerings: {
    ok: boolean;
    error?: string;
    currentIdentifier?: string | null;
    packageCount?: number;
    packageIdentifiers?: string[];
  };
  products: {
    ok: boolean;
    error?: string;
    count?: number;
    productIds?: string[];
  };
  customerInfo: {
    ok: boolean;
    error?: string;
    activeEntitlementKeys?: string[];
  };
};

/**
 * Call after configure + on native iOS/Android. Does not open paywall.
 * Log the result or show in a dev alert to confirm everything is wired.
 */
export async function verifyRevenueCatReadiness(): Promise<RevenueCatVerifyResult> {
  const result: RevenueCatVerifyResult = {
    configured: isRevenueCatConfigured(),
    offerings: { ok: false },
    products: { ok: false },
    customerInfo: { ok: false },
  };

  if (!result.configured) {
    result.offerings.error = "Not configured";
    result.products.error = "Not configured";
    result.customerInfo.error = "Not configured";
    return result;
  }

  // 1) Customer info (always works if API key + network OK)
  try {
    const info = await Purchases.getCustomerInfo();
    result.customerInfo.ok = true;
    result.customerInfo.activeEntitlementKeys = Object.keys(
      info.entitlements?.active ?? {}
    );
  } catch (e) {
    result.customerInfo.error = e instanceof Error ? e.message : String(e);
  }

  // 2) Offerings (needs store products fetchable — device + sandbox or StoreKit config)
  try {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    const packages = current?.availablePackages ?? [];
    result.offerings.ok = true;
    result.offerings.currentIdentifier = current?.identifier ?? null;
    result.offerings.packageCount = packages.length;
    result.offerings.packageIdentifiers = packages.map((p) => p.identifier);
  } catch (e) {
    result.offerings.error = e instanceof Error ? e.message : String(e);
  }

  // 3) Direct product fetch (same store dependency as offerings)
  try {
    const products = await Purchases.getProducts([...PRODUCT_IDS]);
    result.products.ok = true;
    result.products.count = products.length;
    result.products.productIds = products.map(
      (p) => (p as { identifier?: string }).identifier ?? String(p)
    );
  } catch (e) {
    result.products.error = e instanceof Error ? e.message : String(e);
  }

  return result;
}
