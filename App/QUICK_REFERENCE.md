# 🚀 QUICK REFERENCE: Imports & Functions

## 📋 Copy-Paste Imports

### Para Cliente

```typescript
// Restauración de estado
import { setActiveTripId, clearActiveTripId } from '@/common/services/AppStateRestoration';

// Notificaciones persistentes
import { 
  scheduleActiveTripNotification, 
  cancelActiveTripNotification 
} from '@/common/services/ActiveTripNotificationService';
```

### Para Conductor

```typescript
// Restauración de estado
import { setDriverModeActive } from '@/common/services/AppStateRestoration';

// Notificaciones persistentes
import { 
  showDriverActiveNotification, 
  updateDriverNotification, 
  dismissDriverNotification,
  setupDriverNotificationChannel
} from '@/hooks/DriverNotificationService';
```

### Para Debugging

```typescript
import { 
  getRestorationLogs, 
  clearRestorationLogs 
} from '@/common/services/AppStateRestoration';

import { 
  parseNotificationData, 
  handleNotificationResponse 
} from '@/common/services/NotificationHandlers';
```

---

## 🎯 Copy-Paste Code Snippets

### 1️⃣ CLIENTE: Al Aceptar Viaje

```typescript
// En: CustomerActiveTripScreen.tsx
// Cuándo: booking.status === 'ACCEPTED'

useEffect(() => {
  if (!booking) return;
  
  if (['ACCEPTED', 'ARRIVED', 'STARTED', 'IN_PROGRESS', 'TRIP_STARTED'].includes(booking.status)) {
    (async () => {
      try {
        await setActiveTripId(booking.id);
        await scheduleActiveTripNotification(booking, 'customer');
        console.log('✅ Notificación de viaje configurada');
      } catch (error) {
        console.error('❌ Error:', error);
      }
    })();
  }
}, [booking?.status, booking?.id]);
```

---

### 2️⃣ CLIENTE: Al Completar Viaje

```typescript
// En: BookingCabScreen.tsx
// Cuándo: viaje.status === 'COMPLETED'

async function handleTripCompletion() {
  try {
    // ... tu código de completar viaje ...
    
    // Limpiar notificación
    await clearActiveTripId();
    await cancelActiveTripNotification();
    
    console.log('✅ Viaje completado y notificación limpiada');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}
```

---

### 3️⃣ CONDUCTOR: Activar Modo

```typescript
// En: Home.tsx o DriverModeToggle.tsx
// Cuándo: Usuario activa toggle "Modo Conductor"

const handleDriverModeToggle = async (enabled: boolean) => {
  try {
    if (enabled) {
      // Setup channel (una sola vez)
      await setupDriverNotificationChannel();
      
      // Obtener nombre
      const driverName = `${userProfile.first_name} ${userProfile.last_name}`.trim();
      
      // Activar
      await setDriverModeActive(true);
      await showDriverActiveNotification(driverName);
      
      console.log('✅ Modo conductor ON');
    } else {
      // Desactivar
      await setDriverModeActive(false);
      await dismissDriverNotification();
      
      console.log('✅ Modo conductor OFF');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};
```

---

### 4️⃣ CONDUCTOR: Actualizar Durante Viaje

```typescript
// En: DriverActiveBookingScreen.tsx (o similar)
// Cuándo: activeTrip.booking.status cambia

useEffect(() => {
  if (!activeTrip?.booking) return;
  
  (async () => {
    const status = activeTrip.booking.status;
    
    const titles: Record<string, string> = {
      'ACCEPTED': '🎯 Servicio aceptado',
      'ARRIVED': '📍 Cliente en punto',
      'STARTED': '▶️ Viaje iniciado',
      'IN_PROGRESS': '🚗 Viaje en curso',
      'TRIP_STARTED': '🚗 Viaje en curso',
    };
    
    if (titles[status]) {
      const body = `${activeTrip.booking.reference} - $${activeTrip.booking.trip_cost}`;
      await updateDriverNotification(titles[status], body);
    }
  })();
}, [activeTrip?.booking?.status]);
```

---

### 5️⃣ CONDUCTOR: Completar Viaje

```typescript
// En: BookingCabScreen.tsx (Conductor)
// Cuándo: Viaje completado

async function handleDriverTripCompletion() {
  try {
    // ... tu código de completar viaje ...
    
    // Limpiar viaje pero mantener modo conductor ON
    await clearActiveTripId();
    
    console.log('✅ Viaje completado - Modo conductor sigue activo');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}
```

---

## 🧪 Testing Helpers

### Debug: Ver Logs de Restauración

```typescript
import { getRestorationLogs } from '@/common/services/AppStateRestoration';

const logs = await getRestorationLogs();
console.log('=== Restoration Timeline ===');
logs.forEach((log: any) => {
  console.log(`[${log.timestamp}] ${log.message}`);
});
```

### Debug: Simular Viaje de Prueba

```typescript
import { setActiveTripId } from '@/common/services/AppStateRestoration';
import { scheduleActiveTripNotification } from '@/common/services/ActiveTripNotificationService';

const mockBooking = {
  id: 'test-123',
  reference: 'TEST001',
  trip_cost: 35000,
  status: 'ACCEPTED',
};

await setActiveTripId(mockBooking.id);
await scheduleActiveTripNotification(mockBooking, 'customer');
console.log('✅ Notificación de prueba creada');
```

### Debug: Limpiar Todo

```typescript
import { clearActiveTripId, setDriverModeActive } from '@/common/services/AppStateRestoration';
import { cancelActiveTripNotification } from '@/common/services/ActiveTripNotificationService';
import { dismissDriverNotification } from '@/hooks/DriverNotificationService';

await clearActiveTripId();
await setDriverModeActive(false);
await cancelActiveTripNotification();
await dismissDriverNotification();
console.log('✅ Todas las notificaciones limpiadas');
```

---

## 📍 Ubicaciones de Integración

```
Project: /Users/tplussas/Desktop/PruebaLink+APK/prueba2/App/

✅ DONE (Modificado):
└── app/(tabs)/_layout.tsx

✅ CREATED (Nuevo):
├── common/services/AppStateRestoration.ts
├── common/services/NotificationHandlers.ts
├── GUIA_TESTING_NOTIFICACIONES.md
├── INTEGRACION_NOTIFICACIONES.md
├── CHECKLIST_IMPLEMENTACION.md
├── NOTIFICACIONES_RESUMEN.md
├── FLUJOS_SISTEMA.md
├── CAMBIOS_REALIZADOS.md
└── QUICK_REFERENCE.md (este archivo)

⏳ TODO (Integración):
├── app/(tabs)/CustomerActiveTripScreen.tsx [2 funciones]
├── app/(tabs)/BookingCabScreen.tsx [2 funciones]
├── app/(tabs)/index.tsx [2 funciones]
└── app/(tabs)/DriverActiveBookingScreen.tsx [1 función]
```

---

## ⚡ Quick API Reference

### AppStateRestoration.ts

```typescript
// Restaurar todo al abrir app
await restoreAppState(userId: string)

// Guardar viaje activo
await setActiveTripId(bookingId: string)

// Limpiar viaje activo
await clearActiveTripId()

// Marcar modo conductor
await setDriverModeActive(active: boolean)

// Debug: Ver logs
const logs = await getRestorationLogs()

// Debug: Limpiar logs
await clearRestorationLogs()
```

### ActiveTripNotificationService.ts

```typescript
// Crear/actualizar notificación de viaje
await scheduleActiveTripNotification(booking: any, role: 'customer' | 'driver')

// Cancelar/limpiar notificación
await cancelActiveTripNotification()

// Check estado
isActiveTripStatus(status?: string) // Returns boolean
```

### DriverNotificationService.ts

```typescript
// Setup (llamar una vez)
await setupDriverNotificationChannel()

// Mostrar inicial
await showDriverActiveNotification(driverName?: string)

// Actualizar contenido
await updateDriverNotification(title: string, body: string, extraData?: Record<string, unknown>)

// Remover
await dismissDriverNotification()
```

---

## 🎨 Notificación Ejemplos

### Cliente - ACCEPTED
```
Título: "Tu viaje fue aceptado"
Cuerpo: "Tu conductor está en camino. Precio estimado $35,000. Toca para más detalles."
```

### Cliente - ARRIVED
```
Título: "Tu conductor ha llegado"
Cuerpo: "Tu conductor ha llegado. Presenta tu código y comienza el viaje."
```

### Cliente - IN_PROGRESS
```
Título: "Tu viaje está en curso"
Cuerpo: "Tu viaje está activo. Abre la app para ver el estado y control de llegada."
```

### Conductor - ACTIVE
```
Título: "🚗 T+Plus — Conductor Activo"
Cuerpo: "[Nombre], estás en línea recibiendo solicitudes"
```

### Conductor - ACCEPTED
```
Título: "🎯 Servicio aceptado"
Cuerpo: "Servicio REF123. Precio estimado $35,000. Abre la app para iniciar."
```

### Conductor - ARRIVED
```
Título: "📍 Cliente en punto de encuentro"
Cuerpo: "Confirma tu llegada y avanza."
```

---

## 🔐 AsyncStorage Keys

```typescript
// Cliente
'active_trip_id' // booking ID
'notification_active_trip' // booking ID (temporal)
'restore_state_log' // JSON array de logs

// Conductor
'driver_mode_active' // 'true' o undefined
'active_trip_id' // booking ID (si hay viaje)
'restore_state_log' // JSON array de logs
```

---

## 🚨 Common Mistakes

❌ **Olvidar importar:** 
```typescript
// ❌ WRONG
await setActiveTripId(booking.id); // ERROR: not imported

// ✅ CORRECT
import { setActiveTripId } from '@/common/services/AppStateRestoration';
await setActiveTripId(booking.id);
```

❌ **Olvidar limpiar:**
```typescript
// ❌ WRONG
// Viaje completado pero no limpias
// Resultado: Notificación fantasma persiste

// ✅ CORRECT
await clearActiveTripId();
await cancelActiveTripNotification();
```

❌ **Olvidar restauración:**
```typescript
// ❌ WRONG
// Usuario abre app tras cerrar
// Resultado: Pierde contexto de viaje

// ✅ CORRECT
// Ya hecho en _layout.tsx!
// const user = session?.user;
// await restoreAppState(user.id);
```

---

## ✅ Checklist Rápido

- [ ] Imports correctos
- [ ] Función en lugar correcto
- [ ] Se llama en useEffect o callback correcto
- [ ] Condicional correcto (ej: status === 'ACCEPTED')
- [ ] Try/catch para manejo de errores
- [ ] Logging agregado (console.log)
- [ ] Test caso verificado
- [ ] No hay crashes en console

---

## 📞 Referencia Rápida

Documentación completa:
- 🧪 Testing: `GUIA_TESTING_NOTIFICACIONES.md`
- 📝 Integración: `INTEGRACION_NOTIFICACIONES.md`
- ✅ Checklist: `CHECKLIST_IMPLEMENTACION.md`
- 📊 Flujos: `FLUJOS_SISTEMA.md`
- 📦 Cambios: `CAMBIOS_REALIZADOS.md`

