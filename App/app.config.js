// Load .env early so environment variables are available
require('dotenv').config();

// Construct AppConfig from environment variables directly instead of requiring a JS file.
const AppConfig = {
    app_name: process.env.APP_NAME || 'TmasPlus',
    app_description: process.env.APP_DESCRIPTION || 'Sistema de transporte urbano inteligente T+Plus',
    app_display_name: process.env.APP_DISPLAY_NAME || 'TmasPlus',
    icon_app: './assets/images/logo-Preview.png',
    app_identifier: process.env.APP_IDENTIFIER || 'com.tmasplus.tmasplus',
    app_identifier_ios: process.env.APP_IDENTIFIER_IOS || 'tmasplus.tmasplus',
    ios_app_version: process.env.APP_VERSION || '1.10.3',
    runtime_Version: process.env.EXPO_RUNTIME_VERSION || '1.0.4',
    android_app_version: parseInt(process.env.ANDROID_APP_VERSION || '1', 10),
    expo_owner: process.env.EXPO_OWNER || 'tmasplus',
    expo_slug: process.env.EXPO_SLUG || 'tmasplus',
    expo_project_id: process.env.EXPO_PROJECT_ID || '16f8e33a-1dda-48f1-84a6-eeb3c8c5c51f'
};

    const SUPABASE_URL = process.env.SUPABASE_URL || '';
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

    const API_KEY = process.env.GOOGLE_MAPS_API_KEY_ANDROID || process.env.GOOGLE_MAPS_API_KEY_IOS || '';
    const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || '';
    const RNMAPBOX_MAPS_DOWNLOAD_TOKEN = process.env.RNMAPBOX_MAPS_DOWNLOAD_TOKEN || process.env.MAPBOX_DOWNLOAD_TOKEN || '';

module.exports = {
    name: AppConfig.app_name,
    description: AppConfig.app_description,
    owner: "tmasplus", 
    sdkVersion: '54.0.0',
    slug: AppConfig.expo_slug,
    scheme: AppConfig.expo_slug,
    privacy: "public",

    runtimeVersion: AppConfig.runtime_Version,

    platforms: [
        "ios",
        "android"
    ],
    androidStatusBar: {
        hidden: true,
        translucent: true
    },
    version: AppConfig.ios_app_version,
    orientation: "portrait",
    icon: AppConfig.icon_app,
    splash: {
        "image": "./assets/images/splash.png",
        "resizeMode": 'cover',
        "backgroundColor": "#ffffff"
    },
    updates: {
        "fallbackToCacheTimeout": 0,
        "url": "https://u.expo.dev/" + AppConfig.expo_project_id,
    },
    extra: {
        eas: {
            projectId: AppConfig.expo_project_id
        },
        APP_NAME: AppConfig.app_name,
        APP_DISPLAY_NAME: AppConfig.app_display_name,
        APP_IDENTIFIER: AppConfig.app_identifier,
        EXPO_PROJECT_ID: AppConfig.expo_project_id,
        SUPABASE_URL: process.env.SUPABASE_URL || '',
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || '',
        SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        SUPABASE_EMAIL_REDIRECT_TO: process.env.SUPABASE_EMAIL_REDIRECT_TO || (process.env.NODE_ENV === 'production' ? 'https://dashboard.tmasplus.com/register-driver' : 'http://localhost:5173/register-driver'),
        GOOGLE_MAPS_API_KEY_ANDROID: process.env.GOOGLE_MAPS_API_KEY_ANDROID || '',
        GOOGLE_MAPS_API_KEY_IOS: process.env.GOOGLE_MAPS_API_KEY_IOS || '',
        MAPBOX_ACCESS_TOKEN: MAPBOX_ACCESS_TOKEN
    },
    assetBundlePatterns: [
        "**/*"
    ],
    packagerOpts: {
        config: "metro.config.js"
    },
    ios: {
        supportsTablet: true,
        usesAppleSignIn: true,
        bundleIdentifier: AppConfig.app_identifier_ios,
        entitlements: {
            "com.apple.developer.devicecheck.appattest-environment": "production"
        },
        infoPlist: {
            "NSMotionUsageDescription": "Esta aplicación utiliza el giroscopio para mejorar la experiencia del usuario.",
            "NSUserTrackingUsageDescription": "Para brindar un servicio de transporte confiable...",
            "NSLocationAlwaysUsageDescription": "This app uses the always location access...",
            "NSLocationAlwaysAndWhenInUseUsageDescription": "This app uses the always location access...",
            "NSLocationWhenInUseUsageDescription": "For a reliable ride...",
            "NSCameraUsageDescription": "This app uses the camera to take your profile picture.",
            "NSPhotoLibraryUsageDescription": "This app uses Photo Library for uploading your profile picture.",
            "ITSAppUsesNonExemptEncryption": false,
            "UIBackgroundModes": [
                "location",
                "fetch",
                "remote-notification"
            ]
        },
        "privacyManifests": {
            "NSPrivacyAccessedAPITypes": [
                {
                    "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryUserDefaults",
                    "NSPrivacyAccessedAPITypeReasons": ["CA92.1"]
                },
                {
                    "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryFileTimestamp",
                    "NSPrivacyAccessedAPITypeReasons": ["3B52.1"]
                },
                {
                    "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategoryDiskSpace",
                    "NSPrivacyAccessedAPITypeReasons": ["E174.1"]
                },
                {
                    "NSPrivacyAccessedAPIType": "NSPrivacyAccessedAPICategorySystemBootTime",
                    "NSPrivacyAccessedAPITypeReasons": ["35F9.1"]
                }
            ]
        },
        config: {
            googleMapsApiKey: API_KEY
        },
        googleServicesFile: "./GoogleService-Info.plist",
        buildNumber: AppConfig.ios_app_version
    },
    android: {
        compileSdkVersion: 34,
        targetSdkVersion: 34,
        buildToolsVersion: "34.0.0",
        package: AppConfig.app_identifier,
        versionCode: AppConfig.android_app_version,
        "permissions": [
            "CAMERA",
            "READ_EXTERNAL_STORAGE",
            "READ_MEDIA_IMAGES",
            "WRITE_EXTERNAL_STORAGE",
            "ACCESS_FINE_LOCATION",
            "ACCESS_COARSE_LOCATION",
            "CAMERA_ROLL",
            "FOREGROUND_SERVICE",
            "FOREGROUND_SERVICE_LOCATION",
            "ACCESS_BACKGROUND_LOCATION",
            "SCHEDULE_EXACT_ALARM",
            "BODY_SENSORS",
            "ACTIVITY_RECOGNITION"
        ],
        blockedPermissions: ["com.google.android.gms.permission.AD_ID"],
        config: {
            googleMaps: {
                apiKey: API_KEY
            }
        }
    },
    "plugins": [
        "expo-asset",
        "expo-localization",
        // "@react-native-firebase/app",
        // "@react-native-firebase/auth",
        // "react-native-background-fetch",
        [
            "expo-notifications",
            {
                "icon": "./assets/images/logo1024x1024.png",
                "sounds": [
                    "./assets/sounds/notifi.mpeg"
                ]
            }
        ],
        [
            "expo-build-properties",
            {
                "ios": {
                    "useFrameworks": "static"
                },
                "android": {
                    "enableHermes": false
                }
            }
        ],
        [
            "expo-image-picker",
            {
                "photosPermission": "This app uses Photo Library for uploading your profile picture.",
                "cameraPermission": "This app uses the camera to take your profile picture."
            }
        ],
        [
            "expo-location",
            {
                "locationAlwaysAndWhenInUsePermission": "This app uses the always location access in the background...",
                "locationAlwaysPermission": "This app uses the always location access in the background...",
                "locationWhenInUsePermission": "For a reliable ride, App collects location data from the time you open the app until a trip ends...",
                "isIosBackgroundLocationEnabled": true,
                "isAndroidBackgroundLocationEnabled": true,
                "isAndroidForegroundServiceEnabled": true
            }
        ],
        [
            "expo-tracking-transparency",
            {
                "userTrackingPermission": "This identifier will be used to deliver personalized ads to you."
            }
        ],
        // [
        //     "@rnmapbox/maps",
        //     {
        //         "RNMapboxMapsVersion": "11.0.0",
        //         "RNMapboxMapsImpl": "mapbox",
        //         "RNMapboxMapsDownloadToken": RNMAPBOX_MAPS_DOWNLOAD_TOKEN
        //     }
        // ],
        "expo-router"
    ]
}