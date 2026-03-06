require("dotenv").config();

module.exports = {
  expo: {
    name: "DronePal",
    slug: "dronepal",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0f172a",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.shadev.dronepal",
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "DronePal uses your location to fetch weather for your flying site.",
        GADApplicationIdentifier: "ca-app-pub-5852582960793521~8965039341",
        NSUserTrackingUsageDescription:
          "This allows us to show you relevant ads and support DronePal.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0f172a",
      },
      edgeToEdgeEnabled: true,
      package: "com.shadev.dronepal",
      permissions: ["ACCESS_FINE_LOCATION", "ACCESS_COARSE_LOCATION"],
    },
    web: { favicon: "./assets/favicon.png" },
    plugins: [
      "expo-location",
      "expo-tracking-transparency",
      [
        "react-native-google-mobile-ads",
        {
          androidAppId: "ca-app-pub-5852582960793521~8666820166",
          iosAppId: "ca-app-pub-5852582960793521~8965039341",
        },
      ],
    ],
    extra: {
      weatherKitTeamId: process.env.WEATHERKIT_TEAM_ID,
      weatherKitServiceId: process.env.WEATHERKIT_SERVICE_ID,
      weatherKitKeyId: process.env.WEATHERKIT_KEY_ID,
      weatherKitPrivateKey: process.env.WEATHERKIT_PRIVATE_KEY,
      revenueCatApiKeyIos: process.env.REVENUECAT_API_KEY_IOS ?? process.env.REVENUECAT_API_KEY,
      revenueCatApiKeyAndroid: process.env.REVENUECAT_API_KEY_ANDROID ?? process.env.REVENUECAT_API_KEY,
    },
  },
};
