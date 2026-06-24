# 🎯 ACTUALIZACIÓN: Notificaciones con OTP y Estado Completo

## ¿QUÉ CAMBIÓ?

### ✨ Nuevas Funciones

1. **`notifyTripStateChange(booking, role, previousStatus)`**
   - Notifica cada cambio de estado del viaje automaticamente
   - Se llama cuando status: ACCEPTED → ARRIVED → STARTED → IN_PROGRESS
   - Generta mensajes dinámicos según el estado

2. **`getTripStateDescription(status, role)`**
   - Retorna emoji, nombre corto y descripción larga de cada estado
   - Útil para UI y logs

### 🔄 Mejoras a Mensajes

**Antes:**
```
"Tu viaje fue aceptado"
"Tu conductor está en camino. Precio estimado $35,000."
```

**Ahora:**
```
"✅ Tu viaje fue aceptado"
"Juan en camino. Precio: $35,000. Abre app para ver."
```

**Con OTP:**
```
"🚗 Tu conductor ha llegado"
"¡Llegó! Muestra código: 1234. ¡Comienza tu viaje!"
```

### 📊 Campos Utilizados

El sistema ahora lee del booking:
- ✅ `otp_code` o `verification_code` - **Código OTP del cliente**
- ✅ `driver_name` - **Nombre del conductor (para cliente)**
- ✅ `reference` - Referencia del viaje (REF001, etc)
- ✅ `trip_cost` - Precio del viaje
- ✅ `status` - Estado actual

---

## 🚀 CÓMO USAR

### Opción 1: Integración Rápida (Copy-Paste)

En **`CustomerActiveTripScreen.tsx`** o donde manejes el booking:

```typescript
import { notifyTripStateChange } from '@/common/services/ActiveTripNotificationService';
import { setActiveTripId } from '@/common/services/AppStateRestoration';

// En tu componente:
const previousStatusRef = useRef(booking?.status);

useEffect(() => {
  if (!booking || booking.status === previousStatusRef.current) return;
  
  (async () => {
    await setActiveTripId(booking.id);
    await notifyTripStateChange(booking, 'customer', previousStatusRef.current);
  })();
  
  previousStatusRef.current = booking.status;
}, [booking?.status]);
```

En **`DriverActiveBookingScreen.tsx`** o donde manejes viajes de conductor:

```typescript
import { notifyTripStateChange } from '@/common/services/ActiveTripNotificationService';

const previousStatusRef = useRef(activeTrip?.booking?.status);

useEffect(() => {
  if (!activeTrip?.booking || activeTrip.booking.status === previousStatusRef.current) return;
  
  (async () => {
    await notifyTripStateChange(activeTrip.booking, 'driver', previousStatusRef.current);
  })();
  
  previousStatusRef.current = activeTrip.booking.status;
}, [activeTrip?.booking?.status]);
```

### Opción 2: Con Estados Personalizados

```typescript
import { getTripStateDescription } from '@/common/services/ActiveTripNotificationService';

// Obtener descripción del estado
const stateDesc = getTripStateDescription(booking.status, 'customer');

// Usar en UI
<Text>{stateDesc.emoji} {stateDesc.shortName}</Text>
<Text>{stateDesc.longDescription}</Text>
```

---

## 🧪 TESTING RÁPIDO

### Test 1: OTP en Notificación
```
1. Conductor: Abre app
2. Cliente: Solicita viaje  
3. Conductor: Acepta
4. Conductor: "He llegado"
5. ✅ Cliente ve: "¡Llegó! Muestra código: 1234"
```

### Test 2: Flujo Completo
```
ACCEPTED:  "Juan en camino. Precio: $35,000"
ARRIVED:   "¡Llegó! Muestra código: 1234"  ← OTP VISIBLE
STARTED:   "En camino. REF001 | $35,000"
COMPLETED: [Notificación desaparece]
```

### Test 3: Conductor
```
ACCEPTED:  "REF001 | $35,000 | Abre app para detalles"
ARRIVED:   "Cliente (Código: 1234) esperando. Confirma y comienza."
IN_PROGRESS: "En viaje a destino. REF001 | $35,000"
```

---

## 🔧 REQUISITOS EN SUPABASE

El booking **DEBE** tener estos campos o la notificación no mostrará OTP:

```sql
-- En tabla bookings:
ALTER TABLE bookings ADD COLUMN otp_code VARCHAR(10);
ALTER TABLE bookings ADD COLUMN driver_name VARCHAR(100);

-- O si ya tiene verification_code, eso sirve también:
ALTER TABLE bookings ADD COLUMN driver_name VARCHAR(100);
```

**Si los campos no existen**, el sistema igualmente funciona pero no mostrará el OTP o nombre.

---

## 📋 CAMBIOS ESPECÍFICOS

### `ActiveTripNotificationService.ts`

**Actualizado:**
```typescript
// ✅ Títulos con emojis
"✅ Tu viaje fue aceptado"
"📍 Tu conductor ha llegado"
"▶️ Viaje en curso"
"🚗 Viaje en curso"

// ✅ Cuerpo con OTP, precio y nombre
"Juan en camino. Precio: $35,000. Abre app para ver."
"¡Llegó! Muestra código: 1234. ¡Comienza tu viaje!"
"En camino. REF001 | $35,000. Abre para tracking."

// ✅ Nuevas funciones
+ notifyTripStateChange(booking, role, previousStatus)
+ getTripStateDescription(status, role)
```

---

## 🎨 EJEMPLOS DE MENSAJES FINALES

### Cliente en cada estado:

| Estado | Título | Cuerpo |
|--------|--------|--------|
| ACCEPTED | ✅ Tu viaje fue aceptado | Juan en camino. Precio: $35,000 |
| ARRIVED | 🚗 Tu conductor ha llegado | ¡Llegó! Muestra código: 1234 |
| STARTED | ▶️ Viaje en curso | En camino. REF001 \| $35,000 |
| IN_PROGRESS | 🚗 Viaje en curso | En camino. REF001 \| $35,000 |

### Conductor en cada estado:

| Estado | Título | Cuerpo |
|--------|--------|--------|
| ACCEPTED | 🎯 Servicio aceptado | REF001 \| $35,000 |
| ARRIVED | 📍 Cliente en punto | Cliente (Código: 1234) esperando |
| STARTED | ▶️ Viaje iniciado | Conduciendo a destino |
| IN_PROGRESS | 🚗 Viaje en curso | En viaje a destino. REF001 \| $35,000 |

---

## ✅ CHECKLIST

- [ ] Importar `notifyTripStateChange` en componentes
- [ ] Agregar `useRef(booking?.status)` para rastrear cambios
- [ ] Llamar función cuando `status` cambia
- [ ] Verificar que booking tiene `otp_code` o `verification_code`
- [ ] Verificar que booking tiene `driver_name`
- [ ] Test: Ver código OTP en notificación
- [ ] Test: Ver flujo completo de estados
- [ ] Test: Verificar mensajes son claros y útiles

---

## 📞 SOPORTE

**Documentación completa:** `NOTIFICACIONES_MEJORADAS.md`

**Preguntas:**
- "¿Cómo muestro el OTP?" → Ver Test 1
- "¿Qué mensajes se ven?" → Ver tabla de ejemplos
- "¿Qué campos necesito?" → Ver requisitos en Supabase
- "¿Cómo integro?" → Ver Copy-Paste arriba

---

$\\textbf{\\text{¡Lista para usar! 🚀}}$

