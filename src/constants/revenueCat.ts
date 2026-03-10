/**
 * RevenueCat configuration for DronePal.
 * Match these to your RevenueCat dashboard and App Store Connect / Play Console.
 */

/** Entitlement identifier for "Drone Pal Pro" — create this in RevenueCat dashboard. */
export const ENTITLEMENT_PRO = "Drone Pal Pro";

/** Product identifiers (must match App Store Connect / Google Play). */
export const PRODUCT_ID_MONTHLY = "monthly";
export const PRODUCT_ID_LIFETIME = "lifetime";

export const PRODUCT_IDS = [PRODUCT_ID_MONTHLY, PRODUCT_ID_LIFETIME] as const;
