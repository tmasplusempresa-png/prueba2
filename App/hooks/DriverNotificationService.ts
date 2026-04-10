/**
 * DriverNotificationService.ts
 * Manages persistent Android/iOS notifications for the driver mode.
 * - Shows an ongoing (sticky) notification when the driver is online
 * - Updates content during trip phases (navigating, arrived, in-trip)
 * - Tapping the notification brings the app to the foreground
 * - Dismissed automatically when the driver goes offline
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';

let Notifications: typeof import('expo-notifications') | null = null;

async function getNotifications() {
  // Skip entirely in Expo Go — push notifications are not supported
  if (Constants.appOwnership === 'expo') return null;
  if (!Notifications) {
    try {
      Notifications = await import('expo-notifications');
    } catch {
      console.warn('DriverNotificationService: expo-notifications not available');
      return null;
    }
  }
  return Notifications;
}

const DRIVER_NOTIFICATION_ID = 'driver-active-notification';
const DRIVER_CHANNEL_ID = 'driver-active';

/* ── Setup the persistent notification channel (Android only, call once) ── */
export async function setupDriverNotificationChannel() {
  if (Platform.OS !== 'android') return;
  const N = await getNotifications();
  if (!N) return;
  await N.setNotificationChannelAsync(DRIVER_CHANNEL_ID, {
    name: 'Conductor Activo',
    importance: N.AndroidImportance.LOW,          // Low = no sound, still shows in bar
    description: 'Notificación persistente cuando estás en modo conductor',
    lightColor: '#00E5FF',
    lockscreenVisibility: N.AndroidNotificationVisibility.PUBLIC,
    showBadge: false,
    enableVibrate: false,
  });
}

/* ── Show the initial "driver is online" persistent notification ── */
export async function showDriverActiveNotification(driverName?: string) {
  const N = await getNotifications();
  if (!N) return;
  await N.scheduleNotificationAsync({
    identifier: DRIVER_NOTIFICATION_ID,
    content: {
      title: '🚗 T+Plus — Conductor Activo',
      body: driverName
        ? `${driverName}, estás en línea recibiendo solicitudes`
        : 'Estás en línea recibiendo solicitudes',
      data: { type: 'driver-active', screen: 'Home' },
      sound: false,
      sticky: true,                              // Android: non-dismissable
      autoDismiss: false,
      ...(Platform.OS === 'android' ? { channelId: DRIVER_CHANNEL_ID } : {}),
    },
    trigger: null,                                // Show immediately
  });
}

/* ── Update the persistent notification (e.g. during a trip) ── */
export async function updateDriverNotification(
  title: string,
  body: string,
  extraData?: Record<string, unknown>,
) {
  const N = await getNotifications();
  if (!N) return;
  await N.scheduleNotificationAsync({
    identifier: DRIVER_NOTIFICATION_ID,           // Same ID → replaces existing
    content: {
      title,
      body,
      data: { type: 'driver-active', ...(extraData || {}) },
      sound: false,
      sticky: true,
      autoDismiss: false,
      ...(Platform.OS === 'android' ? { channelId: DRIVER_CHANNEL_ID } : {}),
    },
    trigger: null,
  });
}

/* ── Dismiss the persistent notification (driver goes offline) ── */
export async function dismissDriverNotification() {
  const N = await getNotifications();
  if (!N) return;
  try {
    await N.dismissNotificationAsync(DRIVER_NOTIFICATION_ID);
  } catch {
    // Notification might not exist — safe to ignore
  }
}
