import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

export type DriverGoPermissionResult = {
  ok: boolean;
  title: string;
  message: string;
  /** Si true, conviene ofrecer botón para abrir Ajustes del sistema. */
  openSettings?: boolean;
};

const TITLE = 'Permisos necesarios para GO';

const MSG_LOCATION_FOREGROUND =
  'Para activar GO necesitamos acceso a su ubicación mientras usa la aplicación. ' +
  'Así podemos mostrarle en el mapa y ofrecerle servicios cercanos de forma segura.\n\n' +
  'Por favor, permita el acceso a la ubicación y vuelva a intentar.';

const MSG_LOCATION_ALWAYS =
  'Para activar GO es necesario que la ubicación esté configurada en «Siempre» ' +
  '(también en segundo plano), no solo mientras usa la aplicación.\n\n' +
  'De este modo podemos enviarle solicitudes cercanas y compartir su posición ' +
  'con el pasajero durante el servicio, incluso si la aplicación está en segundo plano.\n\n' +
  'Le pedimos amablemente que, en los ajustes del dispositivo, seleccione ' +
  '«Permitir todo el tiempo» / «Siempre» para T+Plus y luego active GO de nuevo.';

const MSG_NOTIFICATIONS =
  'Para activar GO también necesitamos el permiso de notificaciones.\n\n' +
  'Así podrá recibir a tiempo las solicitudes de servicio y avisos importantes ' +
  'de su operación. Por favor, active las notificaciones para T+Plus y vuelva a intentar.';

/**
 * Valida (y solicita) lo obligatorio para activar GO:
 * - Ubicación en primer plano
 * - Ubicación «Siempre» / segundo plano
 * - Notificaciones
 *
 * No pide overlay ni otros permisos avanzados.
 */
export async function ensureDriverGoPermissions(): Promise<DriverGoPermissionResult> {
  // 1) Ubicación mientras usa la app
  let fg = await Location.getForegroundPermissionsAsync();
  if (fg.status !== Location.PermissionStatus.GRANTED) {
    fg = await Location.requestForegroundPermissionsAsync();
  }
  if (fg.status !== Location.PermissionStatus.GRANTED) {
    return {
      ok: false,
      title: TITLE,
      message: MSG_LOCATION_FOREGROUND,
      openSettings: fg.canAskAgain === false,
    };
  }

  // 2) Ubicación Siempre (background). En Android equivale a «Permitir todo el tiempo».
  let bg = await Location.getBackgroundPermissionsAsync();
  if (bg.status !== Location.PermissionStatus.GRANTED) {
    bg = await Location.requestBackgroundPermissionsAsync();
  }
  if (bg.status !== Location.PermissionStatus.GRANTED) {
    return {
      ok: false,
      title: TITLE,
      message: MSG_LOCATION_ALWAYS,
      openSettings: true,
    };
  }

  // iOS: comprobar scope explícito «always» si el API lo expone
  const iosScope = (fg as any)?.ios?.scope || (bg as any)?.ios?.scope;
  if (Platform.OS === 'ios' && iosScope && iosScope !== 'always') {
    return {
      ok: false,
      title: TITLE,
      message: MSG_LOCATION_ALWAYS,
      openSettings: true,
    };
  }

  // 3) Notificaciones
  let notif = await Notifications.getPermissionsAsync();
  if (!notif.granted) {
    notif = await Notifications.requestPermissionsAsync();
  }
  if (!notif.granted) {
    return {
      ok: false,
      title: TITLE,
      message: MSG_NOTIFICATIONS,
      openSettings: notif.canAskAgain === false,
    };
  }

  return { ok: true, title: '', message: '' };
}

export function openAppSettings(): void {
  Linking.openSettings().catch(() => {});
}
