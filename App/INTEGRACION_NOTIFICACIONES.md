/**
 * GUÍA DE INTEGRACIÓN: Notificaciones Persistentes
 * 
 * Este archivo muestra cómo usar los nuevos servicios de notificaciones
 * en tus componentes de viajes (conductor y cliente)
 */

// =====================================================
// 📱 PARA CLIENTE: Al solicitar viaje
// =====================================================

/**
 * Ejemplo en: CustomerActiveTripScreen.tsx o BookingScreen.tsx
 * Cuando el cliente solicita un viaje que es ACEPTADO por conductor
 */

import { setActiveTripId } from '@/common/services/AppStateRestoration';
import { scheduleActiveTripNotification } from '@/common/services/ActiveTripNotificationService';

// Cuando el viaje pasa a estado ACCEPTED (cliente recibe notificacion del conductor)
async function onTripAccepted(booking: any) {
  try {
    // 1. Guardar que hay un viaje activo
    await setActiveTripId(booking.id);
    
    // 2. Mostrar notificación persistente
    await scheduleActiveTripNotification(booking, 'customer');
    
    console.log('✅ Cliente: Viaje aceptado y notificación configurada');
  } catch (error) {
    console.error('❌ Error al configurar notificación de cliente:', error);
  }
}

// Cuando el viaje se COMPLETA o CANCELA
async function onTripCompleted(booking: any) {
  try {
    // 1. Limpiar viaje activo
    await clearActiveTripId();
    
    // 2. Cancelar notificación persistente
    await cancelActiveTripNotification();
    
    console.log('✅ Cliente: Viaje completado y notificación limpiada');
  } catch (error) {
    console.error('❌ Error al limpiar notificación de cliente:', error);
  }
}

// =====================================================
// 🚗 PARA CONDUCTOR: Al iniciar modo conductor
// =====================================================

/**
 * Ejemplo en: DriverModeToggle o Home screen
 * Cuando el conductor activa el "Modo Conductor"
 */

import { setDriverModeActive } from '@/common/services/AppStateRestoration';
import { showDriverActiveNotification, updateDriverNotification, dismissDriverNotification } from '@/hooks/DriverNotificationService';

// Al activar modo conductor
async function enableDriverMode(driverName: string) {
  try {
    // 1. Marcar modo conductor como activo en persistencia
    await setDriverModeActive(true);
    
    // 2. Mostrar notificación persistente (sticky)
    await showDriverActiveNotification(driverName);
    
    console.log('✅ Conductor: Modo activo - Notificación persistente visible');
  } catch (error) {
    console.error('❌ Error activando modo conductor:', error);
  }
}

// Durante el viaje: actualizar notificación según estado
async function updateTripStatus(status: string, booking: any) {
  try {
    const titles: Record<string, string> = {
      ACCEPTED: '🎯 Servicio aceptado',
      ARRIVED: '📍 Cliente en punto de encuentro',
      STARTED: '▶️ Viaje iniciado',
      IN_PROGRESS: '🚗 Viaje en curso',
      TRIP_STARTED: '🚗 Viaje en curso',
    };
    
    const title = titles[status] || 'Viaje activo';
    const body = `${booking.reference} - Presupuesto: $${booking.trip_cost}`;
    
    await updateDriverNotification(title, body, {
      bookingId: booking.id,
      status: status,
    });
    
    console.log(`✅ Conductor: Notificación actualizada (${status})`);
  } catch (error) {
    console.error('❌ Error actualizando notificación:', error);
  }
}

// Al completar viaje o desactivar modo
async function disableDriverMode() {
  try {
    // 1. Limpiar persistencia
    await setDriverModeActive(false);
    await clearActiveTripId();
    
    // 2. Remover notificación sticky
    await dismissDriverNotification();
    
    console.log('✅ Conductor: Modo desactivado - Notificación removida');
  } catch (error) {
    console.error('❌ Error desactivando modo conductor:', error);
  }
}

// =====================================================
// 🔍 CHECKLIST DE INTEGRACIÓN
// =====================================================

/**
 * Lugares en el código donde DEBES integrar estas funciones:
 * 
 * 1. ✅ CustomerActiveTripScreen.tsx
 *    - Efecto: Cuando booking.status === 'ACCEPTED'
 *    - Llamar: await setActiveTripId(booking.id)
 *              await scheduleActiveTripNotification(booking, 'customer')
 * 
 * 2. ✅ BookingCabScreen.tsx
 *    - Efecto: Cuando se completa el pago (COMPLETED)
 *    - Llamar: await clearActiveTripId()
 *              await cancelActiveTripNotification()
 * 
 * 3. ✅ Home.tsx o DriverModeToggle
 *    - Efecto: Al toggle de "Modo Conductor" ON
 *    - Llamar: await setDriverModeActive(true)
 *              await showDriverActiveNotification(driverName)
 * 
 *    - Efecto: Al toggle de "Modo Conductor" OFF
 *    - Llamar: await setDriverModeActive(false)
 *              await dismissDriverNotification()
 * 
 * 4. ✅ DriverActiveBookingScreen.tsx (o similar)
 *    - Efecto: Cuando booking.status cambia
 *    - Llamar: await updateDriverNotification(title, body, {...extraData})
 * 
 * 5. ✅ Cancelación de viaje (por cliente o conductor)
 *    - Efecto: Cuando se cancela antes de completar
 *    - Llamar: await clearActiveTripId()
 *              await cancelActiveTripNotification()
 * 
 * =====================================================
 */

// =====================================================
// 📊 TESTING: Funciones helper para pruebas
// =====================================================

/**
 * Para testing en Expo Go o Dev Client
 * Copiar en un Debug Screen
 */

import { getRestorationLogs, clearRestorationLogs } from '@/common/services/AppStateRestoration';

async function DEBUG_showRestorationLogs() {
  const logs = await getRestorationLogs();
  console.log('=== RESTORATION LOGS ===');
  logs.forEach((log: any) => {
    console.log(`[${log.timestamp}] ${log.message}`);
  });
}

async function DEBUG_clearAllNotifications() {
  await cancelActiveTripNotification();
  await dismissDriverNotification();
  await clearActiveTripId();
  console.log('✅ Todas las notificaciones limpiadas');
}

// Simular viaje aceptado
async function DEBUG_simulateAcceptedTrip() {
  const mockBooking = {
    id: 'test-booking-123',
    reference: 'TEST001',
    trip_cost: 35000,
    status: 'ACCEPTED',
  };
  
  await setActiveTripId(mockBooking.id);
  await scheduleActiveTripNotification(mockBooking, 'customer');
  console.log('✅ Viaje de prueba creado. Revisa la notificación.');
}

// Simular modo conductor
async function DEBUG_simulateDriverMode() {
  await setDriverModeActive(true);
  await showDriverActiveNotification('Conductor Prueba');
  console.log('✅ Modo conductor simulado. Revisa la notificación persistente.');
}
