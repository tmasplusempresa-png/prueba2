// Load .env early so environment variables are available
require('dotenv').config();

// Construct AppConfig from environment variables directly instead of requiring a JS file.
const AppConfig = {
    // OJO: app_name NO se lee de .env a proposito. Este valor define el nombre
    // del target de Xcode (sanitizado: "T+Plus" -> "TPlus"), y como .env esta
    // en .easignore no llega al servidor de EAS. Si cada lado calcula un nombre
    // distinto, la build muere en CONFIGURE_XCODE_PROJECT con
    // "Could not find target 'X' in project.pbxproj". Debe ser deterministico.
    app_name: 'TmasPlus',
    app_description: process.env.APP_DESCRIPTION || 'Sistema de transporte urbano inteligente T+Plus',
    app_display_name: process.env.APP_DISPLAY_NAME || 'TmasPlus',
    icon_app: './assets/images/logo-Preview.png',
    app_identifier: process.env.APP_IDENTIFIER || 'com.releaseunocero',
    app_identifier_ios: process.env.APP_IDENTIFIER_IOS || 'tmasplus.tmasplus',
    ios_app_version: process.env.APP_VERSION || '1.10.5',
    runtime_Version: process.env.EXPO_RUNTIME_VERSION || '1.0.4',
    android_app_version: parseInt(process.env.ANDROID_APP_VERSION || '1', 10),
    expo_owner: process.env.EXPO_OWNER || 'tmasplus',
    expo_slug: process.env.EXPO_SLUG || 'tmasplus',
    expo_project_id: process.env.EXPO_PROJECT_ID || '16f8e33a-1dda-48f1-84a6-eeb3c8c5c51f'
};

    const SUPABASE_URL = process.env.SUPABASE_URL || '';
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

    // Claves separadas por plataforma: react-native-maps usa PROVIDER_GOOGLE en
    // varias pantallas, y una clave restringida a apps Android deja el mapa en
    // gris dentro del iPhone. Cada plataforma cae a la otra solo como respaldo.
    const API_KEY_ANDROID = process.env.GOOGLE_MAPS_API_KEY_ANDROID || process.env.GOOGLE_MAPS_API_KEY_IOS || '';
    const API_KEY_IOS = process.env.GOOGLE_MAPS_API_KEY_IOS || process.env.GOOGLE_MAPS_API_KEY_ANDROID || '';
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
    // El splash se configura abajo con el plugin expo-splash-screen. La clave
    // "splash" heredada no permite controlar el tamano de la imagen: con
    // resizeMode contain sobre un PNG de 1024x1024 el logo ocupaba casi todo
    // el ancho, y como logo1024x1024.png no tiene alfa se veia un cuadro
    // blanco recortado sobre el fondo oscuro.
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
        SUPABASE_EMAIL_REDIRECT_TO: process.env.SUPABASE_EMAIL_REDIRECT_TO || 'https://dashboard.tmasplus.com/welcome',
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
        // Solo iPhone: evita tener que publicar capturas de iPad 13" y el rechazo
        // por layout roto en tablet. Volver a activarlo es cambiar este flag.
        supportsTablet: false,
        bundleIdentifier: AppConfig.app_identifier_ios,
        // El ícono global (logo-Preview.png) mide 1028x1032; Apple exige 1024x1024
        // exacto y sin canal alfa, que es justo lo que cumple este archivo.
        icon: './assets/images/logo1024x1024.png',
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
            googleMapsApiKey: API_KEY_IOS
        },
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
            "ACCESS_FINE_LOCATION",
            "ACCESS_COARSE_LOCATION",
            "FOREGROUND_SERVICE",
            "FOREGROUND_SERVICE_LOCATION",
            "ACCESS_BACKGROUND_LOCATION",
            "SCHEDULE_EXACT_ALARM",
            "BODY_SENSORS",
            "ACTIVITY_RECOGNITION",
            "POST_NOTIFICATIONS"
        ],
        blockedPermissions: ["com.google.android.gms.permission.AD_ID"],
        config: {
            googleMaps: {
                apiKey: API_KEY_ANDROID
            }
        },
        // Android App Links (https verificado) para el reset de contraseña.
        // autoVerify + assetlinks.json en dashboard.tmasplus.com hacen que el
        // enlace del correo abra la app DIRECTO, sin depender de que el navegador
        // respete el esquema propio tmasplus:// (incompatibilidad en Firefox,
        // Samsung Internet, MIUI y webviews de Gmail/Outlook). El esquema propio
        // sigue existiendo (scheme global) como respaldo.
        intentFilters: [
            {
                action: "VIEW",
                autoVerify: true,
                data: [
                    {
                        scheme: "https",
                        host: "dashboard.tmasplus.com",
                        pathPrefix: "/reset-password"
                    }
                ],
                category: ["BROWSABLE", "DEFAULT"]
            }
        ]
    },
    "plugins": [
        "expo-asset",
        "expo-localization",
        "expo-secure-store",
        // "@react-native-firebase/app",
        // "@react-native-firebase/auth",
        // "react-native-background-fetch",
        [
            "expo-splash-screen",
            {
                // splash-icon.png es logo1024x1024.png con las esquinas
                // recortadas en alfa, asi que sobre el fondo oscuro se lee como
                // la misma tarjeta blanca redondeada que usa la pantalla de
                // login, en vez de un cuadro blanco a sangre.
                "image": "./assets/images/splash-icon.png",
                // En puntos. La pantalla mas comun ronda los 430pt de ancho, asi
                // que 200pt deja el logo a poco menos de la mitad, con aire.
                "imageWidth": 200,
                "resizeMode": "contain",
                "backgroundColor": "#051A26",
                "dark": {
                    "backgroundColor": "#051A26"
                }
            }
        ],
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
                // Sin useFrameworks a proposito. Con use_frameworks! los pods se
                // compilan como framework modules y react-native-maps incluye
                // headers no modulares de React-Core (RCTComponent.h, RCTView.h,
                // RCTViewManager.h); -Werror convierte ese warning en error y la
                // compilacion de Xcode muere. Se puso "static" cuando estaban
                // activos @react-native-firebase/app y /auth, que si lo exigian;
                // hoy estan comentados y solo se usa el firebase de JS, sin pods.
                // @rnmapbox/maps soporta ambos modos, no requiere frameworks.
                "android": {
                    "enableHermes": true
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
        [
            "@rnmapbox/maps",
            {
                "RNMapboxMapsVersion": "11.18.2",
                "RNMapboxMapsImpl": "mapbox",
                "RNMapboxMapsDownloadToken": RNMAPBOX_MAPS_DOWNLOAD_TOKEN
            }
        ],
        "expo-router"
    ]
}