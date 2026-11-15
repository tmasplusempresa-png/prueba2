import { Alert, Linking, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BATTERY_HINT_KEY = 'driver_tracking_battery_hint_shown';
let permissionAlertVisible = false;

/**
 * Avisa al conductor que el viaje quedó sin tracking porque falta el permiso
 * de ubicación "Siempre" (o el consentimiento). Se muestra una sola vez a la
 * vez; el hook vuelve a evaluar y puede repetirlo si el problema sigue.
 */
export function showTrackingPermissionNotice(): void {
  if (permissionAlertVisible) return;
  permissionAlertVisible = true;
  Alert.alert(
    'Ubicación en segundo plano requerida',
    'Para registrar el recorrido del viaje aunque la pantalla se bloquee, activa el permiso de ubicación "Siempre" para T+Plus en los ajustes.',
    [
      { text: 'Ahora no', style: 'cancel', onPress: () => { permissionAlertVisible = false; } },
      {
        text: 'Abrir ajustes',
        onPress: () => {
          permissionAlertVisible = false;
          Linking.openSettings().catch(() => {});
        },
      },
    ],
    { onDismiss: () => { permissionAlertVisible = false; } },
  );
}

/**
 * Guía (una sola vez) para quitar la optimización de batería en Android: en
 * Xiaomi/Samsung/etc. el sistema mata el servicio de ubicación. Abre la lista de
 * ajustes de optimización; no usa el permiso restringido
 * REQUEST_IGNORE_BATTERY_OPTIMIZATIONS.
 */
export async function showBatteryOptimizationHintOnce(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    if (await AsyncStorage.getItem(BATTERY_HINT_KEY)) return;
    await AsyncStorage.setItem(BATTERY_HINT_KEY, '1');
  } catch {
    return;
  }
  Alert.alert(
    'Mantén el recorrido activo',
    'Para que el recorrido no se corte con la pantalla bloqueada, busca T+Plus en la lista y elige "No optimizar" (o "Sin restricciones" en batería).',
    [
      { text: 'Más tarde', style: 'cancel' },
      {
        text: 'Abrir ajustes',
        onPress: () => {
          Linking.sendIntent('android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS').catch(() => {
            Linking.openSettings().catch(() => {});
          });
        },
      },
    ],
  );
}
