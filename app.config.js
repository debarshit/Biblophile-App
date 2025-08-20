const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = APP_VARIANT === 'preview';
export default {
  "name": IS_DEV ? "Biblophile Dev" : IS_PREVIEW ? "Biblophile Preview" : "Biblophile",
  "slug": IS_DEV ? "Biblophile-App-Dev" : IS_PREVIEW ? "Biblophile-App-Preview" : "Biblophile-App",
  "version": "0.0.8",
  "orientation": "portrait",
  "icon": "./assets/icon.png",
  "userInterfaceStyle": "light",
  "scheme": "biblophile",
  "platforms": [
    "ios",
    "android",
    "web"
  ],
  "newArchEnabled": true,
  "splash": {
    "image": "./assets/splash.png",
    "resizeMode": "contain",
    "backgroundColor": "#0C0F14"
  },
  "assetBundlePatterns": [
    "**/*"
  ],
  "ios": {
    "buildNumber": "5",
    "supportsTablet": true,
    "infoPlist": {
      "UIBackgroundModes": [
        "fetch",
        "remote-notification",
        "fetch",
        "remote-notification"
      ],
      "ITSAppUsesNonExemptEncryption": false
    },
    "bundleIdentifier": isDev
      ? "com.biblophile.biblophile.dev"
      : isPreview
      ? "com.biblophile.biblophile.preview"
      : "com.biblophile.biblophile"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#0C0F14"
    },
    "googleServicesFile": "./google-services.json",
    "versionCode": 10,
    package: isDev
      ? "com.debar_shit.BiblophileApp.dev"
      : isPreview
      ? "com.debar_shit.BiblophileApp.preview"
      : "com.debar_shit.BiblophileApp",
    "permissions": [
      "NOTIFICATIONS"
    ]
  },
  "web": {
    "favicon": "./assets/favicon.png"
  },
  "plugins": [
    "expo-font"
  ],
  "extra": {
    "eas": {
      "projectId": "1c34706d-2df8-4c6b-939c-9e3f1e5185d3"
    }
  },
  "updates": {
    "enabled": true,
    "checkAutomatically": "ON_LOAD",
    "fallbackToCacheTimeout": 0,
    "url": "https://u.expo.dev/1c34706d-2df8-4c6b-939c-9e3f1e5185d3"
  },
  "runtimeVersion": {
    "policy": "appVersion"
  },
  "notification": {
    "icon": "./assets/icon.png",
    "color": "#0C0F14",
    "iosDisplayInForeground": true
  }
}