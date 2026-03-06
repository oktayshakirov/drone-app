import { Platform } from "react-native";

/**
 * When true, use Google's test ad unit IDs (safe for development; no real revenue).
 * - __DEV__ is true in dev (Expo start, debug builds) and false in production.
 * - Set to true to always use test ads (e.g. to avoid invalid traffic in prod while testing).
 */
export const USE_TEST_ADS = __DEV__;

export const adUnitIDs = {
  banner: Platform.select({
    ios: "ca-app-pub-5852582960793521/2763281439",
    android: "ca-app-pub-5852582960793521/5378311849",
  }),
};

type AdType = "banner";

export function getAdUnitId(type: AdType): string | undefined {
  if (USE_TEST_ADS && type === "banner") {
    const { TestIds } = require("react-native-google-mobile-ads");
    return TestIds.BANNER;
  }
  return adUnitIDs[type];
}
