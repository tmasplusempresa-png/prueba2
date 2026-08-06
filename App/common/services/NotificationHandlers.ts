/**
 * NotificationHandlers.ts
 * Maneja las respuestas de notificaciones (cuando el usuario toca una notificación)
 * Navega al siguiente pantalla correcta (viaje activo, modo conductor, etc)
 */

import { NavigationProp } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationData {
  type:
    | 'active-trip'
    | 'driver-active'
    | 'incoming-call'
    | 'booking-update'
    | 'otp'
    // Nuevos tipos push transaccionales (backend: bookingWebhookDispatcher)
    | 'new-service-loop'   // driver: nueva reserva immediate — sonido en loop hasta aceptar
    | 'booking-scheduled'  // driver: servicio programado (reservation)
    | 'booking-taken'      // driver: otro conductor tomó el booking — silenciar loop
    | 'unknown';
  bookingId?: string;
  role?: 'driver' | 'customer';
  callerId?: string;
  newStatus?: string;  // presente en booking-update: 'ACCEPTED' | 'ARRIVED' | 'COMPLETE'
  [key: string]: any;
}

/**
 * Parsea los datos de una notificación
 */
export const parseNotificationData = (data: any): NotificationData => {
  return {
    type: (data?.type || 'unknown') as NotificationData['type'],
    bookingId: data?.bookingId,
    role: data?.role,
    callerId: data?.callerId,
    ...data,
  };
};

/**
 * Maneja el toque en una notificación
 * Se llama desde el componente RootLayout cuando se verifica addNotificationResponseReceivedListener
 */
export const handleNotificationResponse = async (
  response: Notifications.NotificationResponse,
  navigation: NavigationProp<any>,
): Promise<void> => {
  try {
    const data = parseNotificationData(
      response.notification.request.content.data
    );

    console.log('[NotificationHandlers] Manejo de notificación:', {
      type: data.type,
      bookingId: data.bookingId,
      role: data.role,
    });

    switch (data.type) {
      case 'active-trip':
        await handleActiveTripNotification(data, navigation);
        break;

      case 'driver-active':
        await handleDriverActiveNotification(navigation);
        break;

      case 'incoming-call':
        await handleIncomingCallNotification(data, navigation);
        break;

      case 'booking-update':
        await handleBookingUpdateNotification(data, navigation);
        break;

      case 'new-service-loop':
        await handleNewServiceLoopNotification(data, navigation);
        break;

      case 'booking-scheduled':
        await handleBookingScheduledNotification(data, navigation);
        break;

      case 'booking-taken':
        // Silencioso: el móvil ya usa este type internamente para cancelar el
        // loop de sonido (ver DriverNotificationService.stopNewServiceLoop).
        // Cuando llega por push, es porque el backend detectó que otro conductor
        // tomó el booking mientras este conductor tenía la app cerrada — al
        // reabrirla, el loop debería cancelarse. No requiere navegación.
        console.log('[NotificationHandlers] booking-taken recibido, sin acción de navegación');
        break;

      default:
        console.log('[NotificationHandlers] Tipo de notificación no manejado:', data.type);
        break;
    }
  } catch (error) {
    console.error('[NotificationHandlers] Error manejando respuesta de notificación:', error);
  }
};

/**
 * Maneja notificación de viaje activo
 * - Cliente: navega a CustomerActiveTripScreen
 * - Conductor: navega a DriverActiveTripScreen
 */
const handleActiveTripNotification = async (
  data: NotificationData,
  navigation: NavigationProp<any>,
): Promise<void> => {
  if (!data.bookingId) {
    console.warn('[NotificationHandlers] Active trip sin bookingId');
    return;
  }

  // Guardar en storage para verificación
  await AsyncStorage.setItem('notification_active_trip', data.bookingId);

  const screenMap = {
    customer: 'CustomerActiveTrip',
    driver: 'DriverActiveTrip',
  };

  const screen = screenMap[data.role || 'customer'] || 'HomeScreen';

  // Navegar con delay para asegurar que la app esté lista
  setTimeout(() => {
    try {
      navigation.navigate('HomeScreen', {
        screen: screen,
        params: { bookingId: data.bookingId },
      });
    } catch (error) {
      console.warn('[NotificationHandlers] Error navegando a viaje activo:', error);
      // Fallback a HomeScreen
      navigation.navigate('HomeScreen');
    }
  }, 500);

  console.log(`[NotificationHandlers] Navegado a viaje activo: ${data.role}/${data.bookingId}`);
};

/**
 * Maneja notificación de conductor activo
 * Navega a HomeScreen pero el conductor ya ve la pantalla correcta
 */
const handleDriverActiveNotification = async (
  navigation: NavigationProp<any>,
): Promise<void> => {
  // El conductor ya está en la pantalla correcta gracias a la notificación sticky
  // Solo aseguramos que la app esté en foreground
  setTimeout(() => {
    try {
      navigation.navigate('HomeScreen');
    } catch (error) {
      console.warn('[NotificationHandlers] Error navegando a home:', error);
    }
  }, 500);

  console.log('[NotificationHandlers] Conductor activo - app en foreground');
};

/**
 * Maneja notificación de llamada entrante
 * Naveja a pantalla de llamada aceptada
 */
const handleIncomingCallNotification = async (
  data: NotificationData,
  navigation: NavigationProp<any>,
): Promise<void> => {
  console.log('[NotificationHandlers] Llamada entrante desde:', data.callerId);
  // Implementar cuando tengamos el sistema de llamadas integrado
};

/**
 * Maneja actualizaciones de reserva
 */
const handleBookingUpdateNotification = async (
  data: NotificationData,
  navigation: NavigationProp<any>,
): Promise<void> => {
  if (!data.bookingId) return;

  setTimeout(() => {
    try {
      navigation.navigate('HomeScreen', {
        screen: 'BookingDetails',
        params: { bookingId: data.bookingId },
      });
    } catch (error) {
      console.warn('[NotificationHandlers] Error navegando a detalles de reserva:', error);
    }
  }, 500);

  console.log('[NotificationHandlers] Actualización de reserva:', data.bookingId);
};

/**
 * Maneja notificación "Nueva reserva inmediata" para conductor.
 * El conductor tocó la push (probablemente con la app en background).
 * Lo llevamos a la pantalla donde puede aceptar/rechazar.
 */
const handleNewServiceLoopNotification = async (
  data: NotificationData,
  navigation: NavigationProp<any>,
): Promise<void> => {
  if (!data.bookingId) {
    console.warn('[NotificationHandlers] new-service-loop sin bookingId');
    return;
  }

  // Guardar para que la pantalla de destino pueda resaltar el booking
  await AsyncStorage.setItem('notification_new_service', data.bookingId);

  setTimeout(() => {
    try {
      navigation.navigate('HomeScreen', {
        screen: 'DriverReservations',
        params: { highlightBookingId: data.bookingId },
      });
    } catch (error) {
      console.warn('[NotificationHandlers] Error navegando a DriverReservations:', error);
      // Fallback
      try {
        navigation.navigate('HomeScreen');
      } catch {
        // ignore
      }
    }
  }, 500);

  console.log('[NotificationHandlers] Nuevo servicio (loop) — bookingId:', data.bookingId);
};

/**
 * Maneja notificación "Servicio programado" para conductor.
 * Similar a new-service-loop pero es una reservation (no immediate).
 */
const handleBookingScheduledNotification = async (
  data: NotificationData,
  navigation: NavigationProp<any>,
): Promise<void> => {
  if (!data.bookingId) {
    console.warn('[NotificationHandlers] booking-scheduled sin bookingId');
    return;
  }

  await AsyncStorage.setItem('notification_scheduled_booking', data.bookingId);

  setTimeout(() => {
    try {
      navigation.navigate('HomeScreen', {
        screen: 'DriverReservations',
        params: { bookingId: data.bookingId },
      });
    } catch (error) {
      console.warn('[NotificationHandlers] Error navegando a DriverReservations (programado):', error);
      try {
        navigation.navigate('HomeScreen');
      } catch {
        // ignore
      }
    }
  }, 500);

  console.log('[NotificationHandlers] Servicio programado — bookingId:', data.bookingId);
};

/**
 * Verifica si hay una notificación pendiente de viaje activo
 * (usado cuando la app se abre desde una notificación)
 */
export const checkPendingNotifications = async (
  navigation: NavigationProp<any>,
): Promise<void> => {
  try {
    const activeTripId = await AsyncStorage.getItem('notification_active_trip');
    if (activeTripId) {
      // Limpiar y navegar
      await AsyncStorage.removeItem('notification_active_trip');
      
      // Esperar a que la app esté lista
      setTimeout(() => {
        try {
          navigation.navigate('HomeScreen', {
            screen: 'CustomerActiveTrip',
            params: { bookingId: activeTripId },
          });
        } catch (error) {
          console.warn('[NotificationHandlers] Error con notificación pendiente:', error);
        }
      }, 1000);

      console.log('[NotificationHandlers] Notificación pendiente procesada:', activeTripId);
    }
  } catch (error) {
    console.warn('[NotificationHandlers] Error verificando notificaciones pendientes:', error);
  }
};
