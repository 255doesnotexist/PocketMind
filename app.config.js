/**
 * Expo 配置文件
 * 使用 Expo 工作流，这个文件是应用配置的单一来源
 */
module.exports = {
  // 此项目使用 Expo 托管工作流
  expo: {
    name: "PocketMind",
    slug: "pocketmind",
    version: "0.0.1",
    orientation: "portrait",
    icon: "./src/assets/images/icon.png",
    splash: {
      image: "./src/assets/images/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    updates: {
      fallbackToCacheTimeout: 0
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "moe.doesnotexist.pocketmind"
    },
    android: {
      package: "moe.doesnotexist.pocketmind",
      adaptiveIcon: {
        foregroundImage: "./src/assets/images/adaptive-icon.png",
        backgroundColor: "#FFFFFF"
      }
    },
    web: {
      favicon: "./src/assets/images/favicon.png"
    }
  }
};
