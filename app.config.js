const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';
export default {
  "name": IS_DEV ? "Biblophile Dev" : IS_PREVIEW ? "Biblophile Preview" : "Biblophile",
  "slug": "Biblophile-App",
  "version": "0.0.11",
  "orientation": "default",
  "icon": IS_DEV ? "./assets/favicon.png" : "./assets/icon.png",
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
    "buildNumber": "8",
    "supportsTablet": true,
    "googleServicesFile": "./GoogleService-Info.plist",
    "infoPlist": {
      "NSCameraUsageDescription": "We need camera access to let you take a profile photo.",
      "NSPhotoLibraryUsageDescription": "We need photo library access so you can choose a profile picture.",
      "UIBackgroundModes": ["fetch", "remote-notification"],
      "ITSAppUsesNonExemptEncryption": false
    },
    "bundleIdentifier": IS_DEV
      ? "com.biblophile.biblophile.dev"
      : IS_PREVIEW
      ? "com.biblophile.biblophile.preview"
      : "com.biblophile.biblophile",
    "associatedDomains": ["applinks:biblophile.com"]
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#0C0F14"
    },
    "googleServicesFile": "./google-services.json",
    "versionCode": 13,
    package: IS_DEV
      ? "com.debar_shit.BiblophileApp.dev"
      : IS_PREVIEW
      ? "com.debar_shit.BiblophileApp.preview"
      : "com.debar_shit.BiblophileApp",
    "permissions": [
      "NOTIFICATIONS",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "CAMERA"
    ],
    "compileSdkVersion": 35,
    "targetSdkVersion": 35,
    "intentFilters": [
      {
        "action": "VIEW",
        "autoVerify": true,
        "data": [
          {
            "scheme": "https",
            "host": "biblophile.com",
            "pathPrefix": "/"
          }
        ],
        "category": ["BROWSABLE", "DEFAULT"]
      }
    ]
  },
  "web": {
    "favicon": "./assets/favicon.png"
  },
  "plugins": [
    "expo-font",
    "expo-localization",
    "@react-native-firebase/app",
    [
      "expo-build-properties",
      {
        "ios": {
          "useFrameworks": "static"
        }
      }
    ],
    [
      "expo-tracking-transparency",
      {
        "userTrackingPermission": "This allows Biblophile to provide personalized book recommendations and measure the effectiveness of our ads."
      }
    ]
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