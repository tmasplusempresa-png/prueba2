import { Platform } from 'react-native';
import * as Location from 'expo-location';

const ACTIVE_TRIP_CHANNEL_ID = 'tmasplus-active-trip';
const BACKGROUND_LOCATION_TASK_NAME = 'background-location-task';
let currentNotificationId: string | null = null;

export const isActiveTripStatus = (status?: string): boolean => {
  return [
    'ACCEPTED',
    'ARRIVED',
    'STARTED',
    'IN_PROGRESS',
    'TRIP_STARTED',
  ].includes(status || '');
};

const buildTitle = (booking: any, role: 'customer' | 'driver'): string => {
  if (!booking) return 'Viaje activo';
  if (role === 'driver') {
    if (booking.status === 'ACCEPTED') return '🎯 Servicio aceptado';
    if (booking.status === 'ARRIVED') return '📍 Cliente en punto de encuentro';
    if (booking.status === 'STARTED' || booking.status === 'IN_PROGRESS' || booking.status === 'TRIP_STARTED') return '🚗 Viaje en curso';
    return 'Viaje activo';
  }
  if (role === 'customer') {
    if (booking.status === 'ACCEPTED') return '✅ Tu viaje fue aceptado';
    if (booking.status === 'ARRIVED') return '🚗 Tu conductor ha llegado';
    if (booking.status === 'STARTED' || booking.status === 'IN_PROGRESS' || booking.status === 'TRIP_STARTED') return '▶️ Viaje en corso';
    return 'Viaje activo';
  }
  return 'Viaje activo';
};

const buildBody = (booking: any, role: 'customer' | 'driver'): string => {
  if (!booking) return 'Abre la app para ver el estado completo de tu viaje.';
  const price = booking.trip_cost || booking.estimate || booking.price || 0;
  const displayPrice = Number(price).toLocaleString('es-CO');
  const otp = booking.otp_code || booking.verification_code || '';

  if (role === 'driver') {
    if (booking.status === 'ACCEPTED') {
      return `${booking.reference || 'REF'} | $${displayPrice} | Abre app para detalles`;
    }
    if (booking.status === 'ARRIVED') {
      return `Cliente ${otp ? `(Código: ${otp})` : ''} esperando. Confirma y comienza.`;
    }
    if (booking.status === 'STARTED' || booking.status === 'IN_PROGRESS' || booking.status === 'TRIP_STARTED') {
      return `En viaje a destino. ${booking.reference || ''} | $${displayPrice}`;
    }
    return `Viaje activo: ${booking.reference || ''}. Presupuesto $${displayPrice}.`;
  }

  if (role === 'customer') {
    if (booking.status === 'ACCEPTED') {
      const driverName = booking.driver_name || 'Tu conductor';
      return `${driverName} en camino. Precio: $${displayPrice}. Abre app para ver.`;
    }
    if (booking.status === 'ARRIVED') {
      return `¡Llegó! ${otp ? `Muestra código: ${otp}` : 'Presenta tu código'}. ¡Comienza tu viaje!`;
    }
    if (booking.status === 'STARTED' || booking.status === 'IN_PROGRESS' || booking.status === 'TRIP_STARTED') {
      return `En camino. ${booking.reference || ''} | $${displayPrice}. Abre para tracking.`;
    }
    return `Viaje activo. Abre la app para ver detalles.`;
  }

  return `Abre la app para ver el estado del viaje.`;
};

const ensureActiveTripChannel = async () => {
  if (Platform.OS !== 'android') return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.setNotificationChannelAsync(ACTIVE_TRIP_CHANNEL_ID, {
      name: 'T+Plus Viaje Activo',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#15e5e9',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  } catch (error) {
    console.warn('ActiveTripNotificationService: failed to create channel', error);
  }
};

export const scheduleActiveTripNotification = async (
  booking: any,
  role: 'customer' | 'driver'
): Promise<string | null> => {
  if (!booking?.id) return null;
  try {
    const Notifications = await import('expo-notifications');
    await ensureActiveTripChannel();

    if (currentNotificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(currentNotificationId);
      } catch (error) {
        console.warn('ActiveTripNotificationService: failed to cancel previous notification', error);
      }
      currentNotificationId = null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: buildTitle(booking, role),
        body: buildBody(booking, role),
        data: {
          type: 'active-trip',
          bookingId: booking.id,
          role,
        },
        channelId: ACTIVE_TRIP_CHANNEL_ID,
        sound: 'default',
      },
      trigger: null,
    });

    currentNotificationId = notificationId;
    return notificationId;
  } catch (error) {
    console.warn('ActiveTripNotificationService: schedule failed', error);
    return null;
  }
};

export const cancelActiveTripNotification = async () => {
  if (!currentNotificationId) return;
  try {
    const Notifications = await import('expo-notifications');
    await Notifications.cancelScheduledNotificationAsync(currentNotificationId);
    if (typeof Notifications.dismissNotificationAsync === 'function') {
      await Notifications.dismissNotificationAsync(currentNotificationId);
    }
  } catch (error) {
    console.warn('ActiveTripNotificationService: cancel failed', error);
  } finally {
    currentNotificationId = null;
  }
};

export const stopBackgroundLocationUpdatesAsync = async () => {
  try {
    const hasStarted = await Location.hasStartedLocationUpdatesAsync(
      BACKGROUND_LOCATION_TASK_NAME
    );
    if (hasStarted) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK_NAME);
    }
  } catch (error) {
    console.warn('ActiveTripNotificationService: stop location updates failed', error);
  }
};

/**
 * ✅ MEJORADO: Notifica cada cambio de estado del viaje
 * Se llama cuando hay transiciones: ACCEPTED → ARRIVED → STARTED → IN_PROGRESS → COMPLETED
 */
export const notifyTripStateChange = async (
  booking: any,
  role: 'customer' | 'driver',
  previousStatus?: string
): Promise<void> => {
  if (!booking?.id) return;
  
  try {
    const Notifications = await import('expo-notifications');
    await ensureActiveTripChannel();

    const title = buildTitle(booking, role);
    const body = buildBody(booking, role);

    // Log del cambio de estado
    console.log(`[TripNotification] ${role} - ${previousStatus} → ${booking.status}`);
    console.log(`[TripNotification] Title: ${title}`);
    console.log(`[TripNotification] Body: ${body}`);

    // Mostrar notificación de estado
    const notification = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          type: 'active-trip',
          bookingId: booking.id,
          role,
          status: booking.status,
          previousStatus: previousStatus || '',
        },
        channelId: ACTIVE_TRIP_CHANNEL_ID,
        sound: 'default',
        badge: 1,
      },
      trigger: null,
    });

    console.log(`[TripNotification] Notificación programada: ${notification}`);
  } catch (error) {
    console.warn('[TripNotification] Error:', error);
  }
};

/**
 * ✅ MEJORADO: Estados que requieren definición en la notificación
 */
export const getTripStateDescription = (status: string, role: 'customer' | 'driver'): {
  emoji: string;
  shortName: string;
  longDescription: string;
} => {
  const descriptions: Record<string, Record<string, any>> = {
    'ACCEPTED': {
      customer: { emoji: '✅', shortName: 'Aceptado', longDescription: 'Tu conductor fue asignado y está en camino' },
      driver: { emoji: '✅', shortName: 'Aceptado', longDescription: 'Has aceptado el servicio, ve en camino del cliente' },
    },
    'ARRIVED': {
      customer: { emoji: '📍', shortName: 'Llegó', longDescription: 'Tu conductor ha llegado al punto de encuentro' },
      driver: { emoji: '📍', shortName: 'Llegué', longDescription: 'Has llegado al punto de encuentro del cliente' },
    },
    'STARTED': {
      customer: { emoji: '▶️', shortName: 'Iniciado', longDescription: 'El viaje ha comenzado, en camino a destino' },
      driver: { emoji: '▶️', shortName: 'Iniciado', longDescription: 'Viaje iniciado, conduciendo a destino' },
    },
    'IN_PROGRESS': {
      customer: { emoji: '🚗', shortName: 'En Curso', longDescription: 'Tu viaje está en progreso, tracking en vivo' },
      driver: { emoji: '🚗', shortName: 'En Viaje', longDescription: 'Viaje en progreso, ubicación actualizada' },
    },
    'TRIP_STARTED': {
      customer: { emoji: '🚗', shortName: 'En Curso', longDescription: 'Tu viaje está en progreso, tracking en vivo' },
      driver: { emoji: '🚗', shortName: 'En Viaje', longDescription: 'Viaje en progreso, ubicación actualizada' },
    },
  };

  return (
    descriptions[status]?.[role] || {
      emoji: '❓',
      shortName: 'Estado Desconocido',
      longDescription: 'Estado no identificado del viaje',
    }
  );
};
