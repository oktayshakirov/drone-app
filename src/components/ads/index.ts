// AdBanner is not re-exported here so that importing ConsentDialog etc. does not
// load react-native-google-mobile-ads (and trigger RNGoogleMobileAdsModule). Import
// AdBanner from "./BannerAd" only where needed (e.g. dynamic import in App).
export { ConsentDialog, type ConsentDialogProps } from "./ConsentDialog";
export { getAdUnitId, adUnitIDs, USE_TEST_ADS } from "./adConfig";
export { useAdConsent } from "./useAdConsent";
