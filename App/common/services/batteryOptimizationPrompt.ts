import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Sin esto, Android (especialmente OEMs como Xiaomi/MIUI, Huawei/EMUI,
// Oppo/ColorOS, OnePlus/OxygenOS) matan el foreground service de tracking
// GPS silenciosamente. El síntoma observado: booking_tracking queda vacío
// para ~18% de los servicios COMPLETE. Diagnóstico en la sesión 2026-07-31.
//
// Requiere `expo-intent-launcher` (opcional): sin él, hace fallback a
// Linking.openSettings() y el conductor debe navegar manualmente a
// Batería > No optimizar. Para habilitar el flujo directo:
//   npx expo install expo-intent-launcher

const STORAGE_KEY = 'battery_opt_prompt_shown_v1';
const RE_PROMPT_DAYS = 30;

let IntentLauncher: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  IntentLauncher = require('expo-intent-launcher');
} catch {
  IntentLauncher = null;
}

interface PromptStorage {
  shownAt: number;
  dismissed: boolean;
}

export async function requestIgnoreBatteryOptimization(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const state: PromptStorage = JSON.parse(raw);
      if (state.dismissed) return;
      const daysSince = (Date.now() - state.shownAt) / (1000 * 60 * 60 * 24);
      if (daysSince < RE_PROMPT_DAYS) return;
    }
  } catch {
    // continuar; si el read falla mostramos igual el prompt
  }

  return new Promise((resolve) => {
    Alert.alert(
      'Optimización de batería',
      'Para que TmasPlus no pierda tu ubicación mientras trabajas, necesitamos que desactives la optimización de batería para la app.\n\nAndroid puede cerrar el rastreo GPS cuando pasan minutos sin usar la pantalla.',
      [
        {
          text: 'No molestar',
          style: 'cancel',
          onPress: async () => {
            await persistPromptState({ shownAt: Date.now(), dismissed: true });
            resolve();
          },
        },
        {
          text: 'Después',
          onPress: async () => {
            await persistPromptState({ shownAt: Date.now(), dismissed: false });
            resolve();
          },
        },
        {
          text: 'Configurar',
          onPress: async () => {
            await openBatterySettings();
            await persistPromptState({ shownAt: Date.now(), dismissed: true });
            resolve();
          },
        },
      ],
      { cancelable: false },
    );
  });
}

async function persistPromptState(state: PromptStorage): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[batteryOptimization] persist falló:', e);
  }
}

async function openBatterySettings(): Promise<void> {
  const packageName =
    (Constants.expoConfig as any)?.android?.package ||
    (Constants as any).manifest?.android?.package ||
    'com.releaseunocero';

  if (IntentLauncher) {
    try {
      await IntentLauncher.startActivityAsync(
        'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
        { data: `package:${packageName}` },
      );
      return;
    } catch (e) {
      console.warn('[batteryOptimization] intent falló, fallback a openSettings:', e);
    }
  }

  try {
    await Linking.openSettings();
  } catch (e) {
    console.error('[batteryOptimization] no se pudo abrir settings:', e);
  }
}

// Utilidad para debugging / tests: permite forzar que el prompt vuelva a
// aparecer en el próximo `requestIgnoreBatteryOptimization()`. NO usar en
// producción sin propósito claro.
export async function resetBatteryPromptState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('[batteryOptimization] reset falló:', e);
  }
}
