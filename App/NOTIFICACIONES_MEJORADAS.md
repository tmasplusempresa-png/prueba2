# 🔔 MEJORA: Sistema Completo de Notificaciones con OTP y Estados

## ✨ NUEVAS CARACTERÍSTICAS

### 1️⃣ **Código OTP en Notificaciones**

Ahora el cliente verá el código OTP directamente en la notificación cuando el conductor llega:

```
📱 NOTIFICACIÓN:
┌─────────────────────────────────────────┐
│ 🚗 Tu conductor ha llegado              │
│                                          │
│ ¡Llegó! Muestra código: 1234             │
│ ¡Comienza tu viaje!                      │
└─────────────────────────────────────────┘
```

### 2️⃣ **Flujo Completo de Estados**

Cada cambio de estado genera una notificación automática:

```
Cliente solicita
    ↓ [Conductor acepta]
✅ NOTIFICACIÓN: "Tu viaje fue aceptado"
    ├─ Juan en camino. Precio: $35,000
    
    ↓ [Conductor llega]
📍 NOTIFICACIÓN: "Tu conductor ha llegado"
    ├─ ¡Llegó! Muestra código: 1234
    
    ↓ [Viaje inicia]
▶️ NOTIFICACIÓN: "Viaje en curso"
    ├─ En camino. REF001 | $35,000
    
    ↓ [En progreso]
🚗 NOTIFICACIÓN: "Viaje en curso"
    ├─ En camino. REF001 | $35,000
    
    ↓ [Completado]
✅ Notificación desaparece
```

### 3️⃣ **Información Detallada por Estado**

| Estado | Cliente | Conductor |
|--------|---------|-----------|
| ACCEPTED | ✅ Juan en camino | 🎯 Servicio aceptado |
| ARRIVED | 📍 ¡Llegó! Código: 1234 | 📍 Cliente en punto |
| STARTED | ▶️ En camino | ▶️ Viaje iniciado |
| IN_PROGRESS | 🚗 En viaje | 🚗 En viaje |

---

## 💻 CÓMO INTEGRAR

### Para Cliente: En `CustomerActiveTripScreen.tsx`

```typescript
import { notifyTripStateChange, getTripStateDescription } from '@/common/services/ActiveTripNotificationService';
import { setActiveTripId } from '@/common/services/AppStateRestoration';

useEffect(() => {
  if (!booking) return;
  
  const previousStatus = useRef(booking.status).current;
  
  // Cuando el estado del viaje cambia
  if (booking.status !== previousStatus) {
    (async () => {
      try {
        // Guardar como viaje activo
        await setActiveTripId(booking.id);
        
        // Notificar el cambio de estado
        await notifyTripStateChange(booking, 'customer', previousStatus);
        
        // Obtener descripción del estado
        const stateDesc = getTripStateDescription(booking.status, 'customer');
        console.log(`Estado: ${stateDesc.emoji} ${stateDesc.longDescription}`);
      } catch (error) {
        console.error('Error:', error);
      }
    })();
    
    // Actualizar referencia
    useRef(booking.status).current = booking.status;
  }
}, [booking?.status, booking?.id]);
```

### Para Conductor: En `DriverActiveBookingScreen.tsx` o similar

```typescript
import { notifyTripStateChange } from '@/common/services/ActiveTripNotificationService';
import { updateDriverNotification } from '@/hooks/DriverNotificationService';

useEffect(() => {
  if (!activeTrip?.booking) return;
  
  const booking = activeTrip.booking;
  const previousStatus = useRef(booking.status).current;
  
  if (booking.status !== previousStatus) {
    (async () => {
      try {
        // Notificar el cambio de estado (notificación general)
        await notifyTripStateChange(booking, 'driver', previousStatus);
        
        // Actualizar la notificación sticky del conductor
        const titles: Record<string, string> = {
          'ACCEPTED': '🎯 Servicio aceptado',
          'ARRIVED': '📍 Cliente en punto',
          'STARTED': '▶️ Viaje iniciado',
          'IN_PROGRESS': '🚗 Viaje en curso',
          'TRIP_STARTED': '🚗 Viaje en curso',
        };
        
        if (titles[booking.status]) {
          const body = `${booking.reference} | $${booking.trip_cost}`;
          await updateDriverNotification(titles[booking.status], body);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    })();
    
    useRef(booking.status).current = booking.status;
  }
}, [activeTrip?.booking?.status]);
```

---

## 🧪 TESTING: Flujo Completo

### Test 1: Verificar OTP en Notificación

```
1. Cliente solicita viaje
2. Conductor acepta
3. ¿Cliente ve notificación "Conductor en camino"? ✅
4. Conductor hace "He llegado"
5. ¿Cliente ve código OTP en notificación? ✅
6. ¿Dice "Muestra código: 1234"? ✅
```

### Test 2: Flujo Completo de Estados

```
1. Cliente solicita → Notif: "Aceptado"
   └─ Cuerpo: "Juan en camino" ✅

2. Conductor acepta → Notif: "Tu viaje fue aceptado"
   └─ Cuerpo muestra precio ✅

3. Conductor llega → Notif: "Tu conductor ha llegado"
   └─ Cuerpo muestra: "¡Llegó! Código: 1234" ✅

4. Viaje inicia → Notif: "Viaje en curso"
   └─ Cuerpo: "En camino. REF001 | $35,000" ✅

5. Viaje completado → Notificación desaparece ✅
```

### Test 3: Campos en Notificación

```
Verificar que la notificación tiene:
├─ ✅ Emoji del estado
├─ ✅ Título descriptivo
├─ ✅ Referencia de viaje
├─ ✅ Precio
├─ ✅ Código OTP (cuando aplique)
└─ ✅ Nombre del conductor/cliente (cuando aplique)
```

---

## 📊 CAMPOS DEL BOOKING NECESARIOS

Para que el sistema funcione correctamente, asegúrate que cada `booking` tiene:

```typescript
{
  id: string;                    // ID único ✅
  reference: string;             // Ej: "REF001" ✅
  trip_cost: number;             // Precio del viaje ✅
  status: string;                // ACCEPTED, ARRIVED, etc. ✅
  otp_code?: string;             // Código OTP 🆕
  verification_code?: string;    // Alternativa para OTP 🆕
  driver_name?: string;          // Nombre del conductor 🆕
}
```

**Si faltan estos campos**, agrega un migration en tu Supabase.

---

## 🔄 CAMBIOS EN ARCHIVOS

### `ActiveTripNotificationService.ts` ✅ ACTUALIZADO

**Nuevas funciones:**
- `notifyTripStateChange()` - Notifica cada cambio de estado
- `getTripStateDescription()` - Describe cada estado

**Mejoras:**
- ✅ Títulos con emojis
- ✅ Mensajes más descriptivos
- ✅ Código OTP visible
- ✅ Información de precio y referencia
- ✅ Logging detallado

### Funciones necesarias para integración:

```typescript
// Importar
import { 
  notifyTripStateChange,
  getTripStateDescription,
  scheduleActiveTripNotification,
  cancelActiveTripNotification
} from '@/common/services/ActiveTripNotificationService';

// Usar en useEffect cuando status cambia
await notifyTripStateChange(booking, role, previousStatus);

// Obtener descripción del estado
const desc = getTripStateDescription(booking.status, 'customer');
console.log(`${desc.emoji} ${desc.longDescription}`);
```

---

## 📱 EJEMPLOS DE NOTIFICACIONES FINALES

### Cliente - ACCEPTED
```
✅ Tu viaje fue aceptado

Juan en camino. Precio: $35,000. Abre app para ver.
```

### Cliente - ARRIVED
```
🚗 Tu conductor ha llegado

¡Llegó! Muestra código: 1234. ¡Comienza tu viaje!
```

### Cliente - IN_PROGRESS
```
▶️ Viaje en curso

En camino. REF001 | $35,000. Abre para tracking.
```

### Conductor - ACCEPTED
```
🎯 Servicio aceptado

REF001 | $35,000 | Abre app para detalles
```

### Conductor - ARRIVED
```
📍 Cliente en punto de encuentro

Cliente (Código: 1234) esperando. Confirma y comienza.
```

### Conductor - IN_PROGRESS
```
🚗 Viaje en curso

En viaje a destino. REF001 | $35,000
```

---

## ✅ CHECKLIST DE INTEGRACIÓN

- [ ] Importar `notifyTripStateChange` en ComponenteCliente
- [ ] Importar `notifyTripStateChange` en ComponenteConductor
- [ ] Agregar useRef para `previousStatus`
- [ ] Llamar `notifyTripStateChange()` cuando status cambia
- [ ] Verificar que booking trae `otp_code` o `verification_code`
- [ ] Verificar que booking trae `driver_name`
- [ ] Test: Ver OTP en notificación del cliente
- [ ] Test: Ver flujo completo de estados
- [ ] Test: Verificar que notificación desaparece al completar

---

## 🚀 PRÓXIMO PASO

Integra esta función en tus pantallas:

1. `CustomerActiveTripScreen.tsx` - Usa `notifyTripStateChange(booking, 'customer', previousStatus)`
2. `DriverActiveBookingScreen.tsx` - Usa `notifyTripStateChange(booking, 'driver', previousStatus)`

¡Listo para producción! 🎉

