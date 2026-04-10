import { Platform, Linking } from "react-native";
import Constants from 'expo-constants';
import { updateProfile } from "@/common/actions/authactions";

export const checkAppVersion = async (dispatch: any) => {
    console.log('checkAppVersion------ Iniciando verificación de versión');
    try {
        // Prefer runtime manifest if available, otherwise use config/AppConfig
        const manifestVersion = Constants.expoConfig?.version || Constants.manifest?.version;
        let currentVersion: any = manifestVersion;

        // preferir la configuración de AppConfig.ts si está disponible
        try {
            // importar dinámicamente para evitar problemas en el bundler
            const { AppConfig } = await import('../config/AppConfig');
            if (!currentVersion) currentVersion = AppConfig.ios_app_version || AppConfig.runtime_Version;
            console.log('AppConfig cargado desde config:', AppConfig?.app_name);
        } catch (e) {
            console.warn('No se pudo cargar config/AppConfig dinámicamente, usando manifest si está disponible');
        }

        console.log('Versión Actual de la App:', currentVersion);

        // URLs de las tiendas configuradas según la plataforma
        const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.treasapp.treas22';
        const appleStoreUrl = 'https://apps.apple.com/app/treasapp/id6456222848';

        dispatch(updateProfile({ AppVersion: currentVersion }));

        if (Platform.OS === 'android') {
            try {
                const { AppConfig } = await import('../config/AppConfig');
                const settingsVersion = parseInt(String(AppConfig.android_app_version || 0), 10);
                if (currentVersion < settingsVersion) {
                    Linking.openURL(playStoreUrl);
                }
            } catch (e) {
                console.warn('No se pudo obtener android_app_version de AppConfig dinámicamente:', e);
            }
        } else if (Platform.OS === 'ios') {
            const appleStoreVersion = await fetchAppleStoreVersion();
            if (appleStoreVersion && currentVersion < appleStoreVersion) {
                Linking.openURL(appleStoreUrl);
            }
        }

    } catch (error) {
        console.error("Error al verificar la versión de la aplicación:", error);
    }
};

export const fetchPlayStoreVersion = async () => {
    console.log('fetchPlayStoreVersion------ Iniciando fetch de Play Store');
    try {
        const response = await fetch('https://play.google.com/store/apps/details?id=com.treasapp.treas22');
        console.log('Respuesta de Play Store recibida:', response.status);
        if (!response.ok) {
            console.error('Error al fetch de Play Store:', response.statusText);
            return null;
        }
        const text = await response.text();
        const versionMatch = text.match(/Current Version<\/div><span class="htlgb">([^<]*)<\/span>/);
        const playStoreVersion = versionMatch ? versionMatch[1].trim() : null;
        console.log('Versión extraída de Play Store:', playStoreVersion);
        return playStoreVersion;
    } catch (error) {
        console.error('Error al obtener la versión de Play Store:', error);
        return null;
    }
};

export const fetchAppleStoreVersion = async () => {
    console.log('fetchAppleStoreVersion------ Iniciando fetch de Apple Store');
    try {
        const response = await fetch('https://itunes.apple.com/lookup?bundleId=com.treasapp.treas24');
        console.log('Respuesta de Apple Store recibida:', response.status);
        if (!response.ok) {
            console.error('Error al fetch de Apple Store:', response.statusText);
            return null;
        }
        const data = await response.json();
        const appleStoreVersion = data.results[0]?.version || null;
        console.log('Versión extraída de Apple Store:', appleStoreVersion);
        return appleStoreVersion;
    } catch (error) {
        console.error('Error al obtener la versión de Apple Store:', error);
        return null;
    }
};

