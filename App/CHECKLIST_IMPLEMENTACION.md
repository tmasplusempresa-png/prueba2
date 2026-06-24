# ✅ CHECKLIST DE IMPLEMENTACIÓN: Notificaciones Persistentes

## 📍 Ubicación de Cambios Necesarios

### 🎯 PRIORIDAD 1: Integración del Cliente

#### 1. `app/(tabs)/CustomerActiveTripScreen.tsx` o `app/(tabs)/ReservationTripScreen.tsx`

**Cuándo:** Cuando el viaje pasa a estado `ACCEPTED`, `ARRIVED`, `STARTED`, `IN_PROGRESS`, `TRIP_STARTED`

```typescript
// 1. Importar
import { setActiveTripId } from '@/common/services/AppStateRestoration';
import { scheduleActiveTripNotification } from '@/common/services/ActiveTripNotificationService';

// 2. En el useEffect que suscribe a cambios de booking:
useEffect(() => {
  if (!booking) return;
  
  // Cuando el viaje es aceptado por el conductor
  if (['ACCEPTED', 'ARRIVED', 'STARTED', 'IN_PROGRESS', 'TRIP_STARTED'].includes(booking.status)) {
    (async () => {
      await setActiveTripId(booking.id);
      await scheduleActiveTripNotification(booking, 'customer');
    })();
  }
}, [booking?.status, booking?.id]);
```

**Validación:**
- [ ] Notificación aparece cuando viaje es ACCEPTED
- [ ] Notificación es sticky (no se puede descartar)
- [ ] Al tocar, navega de vuelta a esta pantalla
- [ ] Notificación se actualiza con el estado

---

#### 2. `app/(tabs)/BookingCabScreen.tsx` o completionHandler

**Cuándo:** Cuando el viaje se completa (`COMPLETED`)

```typescript
// 1. Importar
import { clearActiveTripId } from '@/common/services/AppStateRestoration';
import { cancelActiveTripNotification } from '@/common/services/ActiveTripNotificationService';

// 2. En la función que completa el viaje:
async function handleTripCompletion(booking: any) {
  try {
    // ... tu código de completar viaje ...
    
    // Limpiar notificación
    await clearActiveTripId();
    await cancelActiveTripNotification();
    
    console.log('✅ Viaje completado y notificación limpiada');
  } catch (error) {
    console.error('Error:', error);
  }
}
```

**Validación:**
- [ ] Notificación desaparece tras completar
- [ ] No hay "ghost" de viajes anteriores
- [ ] Historial muestra el viaje completado

---

#### 3. `app/(tabs)/BookingCabScreen.tsx` - Cancelación

**Cuándo:** Cuando el cliente cancela un viaje

```typescript
// En la función de cancelación:
async function handleTripCancellation(booking: any) {
  try {
    // ... tu código de cancelar viaje ...
    
    // Limpiar notificación
    await clearActiveTripId();
    await cancelActiveTripNotification();
    
    console.log('✅ Viaje cancelado y notificación limpiada');
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

### 🚗 PRIORIDAD 2: Integración del Conductor

#### 4. `app/(tabs)/index.tsx` o componente de Modo Conductor

**Cuándo:** Al activar el toggle "Modo Conductor"

```typescript
// 1. Importar
import { setDriverModeActive } from '@/common/services/AppStateRestoration';
import { showDriverActiveNotification, setupDriverNotificationChannel } from '@/hooks/DriverNotificationService';

// 2. En el manejador del toggle:
const handleDriverModeToggle = async (enabled: boolean) => {
  try {
    if (enabled) {
      // Setup channel (una sola vez)
      await setupDriverNotificationChannel();
      
      // Obtener nombre del conductor
      const driverName = `${userProfile.first_name} ${userProfile.last_name}`.trim();
      
      // Marcar como activo
      await setDriverModeActive(true);
      
      // Mostrar notificación persistente
      await showDriverActiveNotification(driverName);
      
      console.log('✅ Modo conductor activado - Notificación visible');
    } else {
      // Desactivar
      await setDriverModeActive(false);
      await dismissDriverNotification();
      
      console.log('✅ Modo conductor desactivado');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

**Validación:**
- [ ] Notificación aparece cuando modo ON
- [ ] Notificación es sticky (no dismissable)
- [ ] Notificación desaparece cuando modo OFF
- [ ] Cambio persiste tras cerrar app

---

#### 5. `app/(tabs)/CustomerActiveTripScreen.tsx` (Conductor) - Durante Viaje del Conductor

**Cuándo:** El estado del viaje del conductor cambia

```typescript
// 1. Importar
import { updateDriverNotification } from '@/hooks/DriverNotificationService';

// 2. En useEffect que monitorea cambios de viaje:
useEffect(() => {
  if (!activeTrip?.booking) return;
  
  (async () => {
    const status = activeTrip.booking.status;
    
    let title = '';
    if (status === 'ACCEPTED') title = '🎯 Servicio aceptado';
    else if (status === 'ARRIVED') title = '📍 Cliente en punto de encuentro';
    else if (['STARTED', 'IN_PROGRESS', 'TRIP_STARTED'].includes(status)) {
      title = '🚗 Viaje en curso';
    }
    
    if (title) {
      const body = `${activeTrip.booking.reference} - $${activeTrip.booking.trip_cost}`;
      await updateDriverNotification(title, body, {
        bookingId: activeTrip.booking.id,
        status: status,
      });
    }
  })();
}, [activeTrip?.booking?.status]);
```

**Validación:**
- [ ] Notificación muestra título según estado
- [ ] Se actualiza sin crear notificaciones nuevas
- [ ] Precio y referencia son correctos

---

#### 6. `app/(tabs)/BookingCabScreen.tsx` (Conductor) - Fin del Viaje

**Cuándo:** El conductor completa un viaje

```typescript
// En la función de completar viaje:
async function handleDriverTripCompletion(booking: any) {
  try {
    // ... tu código de completar viaje ...
    
    // Limpiar pero MANTENER modo conductor activo
    await clearActiveTripId();
    
    // La notificación se actualiza o se resetea
    // (El conductor sigue recibiendo solicitudes)
    
    console.log('✅ Viaje completado - Modo conductor sigue activo');
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

#### 7. `app/(tabs)/BookingCabScreen.tsx` (Conductor) - Cancelación

**Cuándo:** El conductor cancela un viaje

```typescript
// En la función de cancelación:
async function handleDriverTripCancellation(booking: any) {
  try {
    // ... tu código de cancelar viaje ...
    
    // Limpiar estado del viaje, mantener modo conductor
    await clearActiveTripId();
    
    console.log('✅ Viaje cancelado - Modo conductor sigue activo');
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

### 🔄 PRIORIDAD 3: Integración del Sistema Global

#### 8. `app/(tabs)/_layout.tsx` - ✅ YA HECHO

**Estado:** ✅ Completado

- [x] Importaciones añadidas
- [x] Llamada a `restoreAppState()` al login
- [x] Limpieza al logout
- [x] Logging mejorado en notificationResponse

---

#### 9. `RootLayout.tsx` o `app.tsx` - Integración Inicial

**Nota:** Ya está integrado en `_layout.tsx`, pero si necesitas debugging:

```typescript
// En el initialEffect, agregar:
useEffect(() => {
  (async () => {
    // Clear any stale app state on app startup
    await clearActiveTripId();
    await dismissDriverNotification();
  })();
}, []);
```

---

## 🧪 TESTING DESPUÉS DE CADA INTEGRACIÓN

### Para Cliente
```
1. Solicita viaje
2. ¿Aparece notificación? ✅
3. ¿Es sticky? ✅
4. ¿Tapping lleva a pantalla correcta? ✅
5. ¿Se actualiza con estados? ✅
6. ¿Desaparece al completar? ✅
```

### Para Conductor
```
1. Activa modo conductor
2. ¿Aparece notificación sticky? ✅
3. ¿Se puede cerrar app? ✅
4. ¿Notificación sigue visible? ✅
5. ¿Al aceptar viaje, se actualiza? ✅
6. ¿Desaparece al desactivar modo? ✅
```

---

## 📋 ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **First:** Integración en _layout.tsx (✅ HECHO)
2. **Second:** Cliente - CustomerActiveTripScreen (Prioridad 1.1)
3. **Third:** Cliente - Cancelación/Completado (Prioridad 1.2)
4. **Fourth:** Conductor - Modo toggle (Prioridad 2)
5. **Fifth:** Conductor - Actualizaciones durante viaje (Prioridad 2.5)

---

## 🆘 TROUBLESHOOTING

### "Notificación no aparece después de integrar"

**Checklist:**
- [ ] ¿Importaste las funciones correctamente?
- [ ] ¿Estás llamándolas en el lugar correcto (useEffect)?
- [ ] ¿El booking tiene un `id` válido?
- [ ] ¿Revisa los logs: `adb logcat | grep -i notif`?

**Debug:**
```typescript
// Agrega logging
console.log('[DEBUG] Calling setActiveTripId:', booking.id);
await setActiveTripId(booking.id);
console.log('[DEBUG] Calling scheduleActiveTripNotification');
await scheduleActiveTripNotification(booking, 'customer');
```

---

### "Notificación persiste después de completar"

**Checklist:**
- [ ] ¿Estás llamando `clearActiveTripId()`?
- [ ] ¿Estás llamando `cancelActiveTripNotification()`?
- [ ] ¿La condición se cumple (status === COMPLETED)?

---

## 📞 GUÍA RÁPIDA DE IMPORTS

```typescript
// Para viajes del cliente
import { setActiveTripId, clearActiveTripId } from '@/common/services/AppStateRestoration';
import { scheduleActiveTripNotification, cancelActiveTripNotification } from '@/common/services/ActiveTripNotificationService';

// Para modo conductor
import { setDriverModeActive } from '@/common/services/AppStateRestoration';
import { showDriverActiveNotification, updateDriverNotification, dismissDriverNotification, setupDriverNotificationChannel } from '@/hooks/DriverNotificationService';

// Para debugging
import { getRestorationLogs, clearRestorationLogs } from '@/common/services/AppStateRestoration';
```

