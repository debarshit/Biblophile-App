const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';
export default {
  "name": IS_DEV ? "Biblophile Dev" : IS_PREVIEW ? "Biblophile Preview" : "Biblophile",
  "slug": "Biblophile-App",
  "version": "0.0.13",
  "orientation": "default",
  "icon": IS_DEV ? "./assets/favicon.png" : "./assets/icon.png",
  "userInterfaceStyle": "automatic",
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
    "buildNumber": "11",
    "supportsTablet": true,
    "googleServicesFile": "./GoogleService-Info.plist",
    "infoPlist": {
      "NSCameraUsageDescription": "We need camera access to let you take a profile photo.",
      "NSPhotoLibraryUsageDescription": "We need photo library access so you can choose a profile picture.",
      "NSPhotoLibraryAddUsageDescription": "This app needs access to save images to your library.",
      "UIBackgroundModes": ["fetch", "remote-notification"],
      "ITSAppUsesNonExemptEncryption": false,
    },
    "bundleIdentifier": IS_DEV
      ? "com.biblophile.biblophile.dev"
      : IS_PREVIEW
      ? "com.biblophile.biblophile.preview"
      : "com.biblophile.biblophile",
    "entitlements": {
      "aps-environment": IS_DEV ? "development" : "production"
    },
    "associatedDomains": ["applinks:biblophile.com"]
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#0C0F14"
    },
    "googleServicesFile": "./google-services.json",
    "versionCode": 15,
    package: IS_DEV
      ? "com.debar_shit.BiblophileApp.dev"
      : IS_PREVIEW
      ? "com.debar_shit.BiblophileApp.preview"
      : "com.debar_shit.BiblophileApp",
    "permissions": [
      "NOTIFICATIONS",
      "CAMERA"
    ],
    "packageVisibility": {
      "packages": [
        "com.instagram.android"
      ]
    },
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
      "expo-media-library",
      {
        "photosPermission": "Allow Bibliophile to save wrap images to your photo library.",
        "savePhotosPermission": "Allow Bibliophile to save wrap images to your photo library.",
        "isAccessMediaLocationEnabled": false,
        "granularPermissions": []
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