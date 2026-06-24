# ✅ Verificación: OTP Visible en Notificaciones

**Estado:** ✅ IMPLEMENTADO Y INSTALADO EN EMULADOR  
**Fecha:** 19 de abril de 2026  
**Build:** app-release.apk con integraciones de notifyTripStateChange

---

## 🎯 Objetivo

Verificar que el código OTP se muestra en la notificación cuando el conductor llega al punto de recogida, tanto para el cliente como para el conductor.

---

## 📱 Archivos Modificados

### 1. **CustomerActiveTripScreen.tsx**
```
✅ Importación: notifyTripStateChange
✅ useRef: previousStatusRef para trackear estado anterior
✅ useEffect: Llama notifyTripStateChange() cuando status cambia
```

### 2. **BookingCabScreen.tsx** 
```
✅ Importación: notifyTripStateChange
✅ useRef: previousStatusRef para trackear estado anterior
✅ useEffect: Llama notifyTripStateChange() para driver y customer
```

### 3. **ActiveTripNotificationService.ts** (Previo)
```
✅ buildTitle() con emojis: ✅ 🚗 📍 ▶️ 🎯
✅ buildBody() extrae: otp_code, driver_name, prices
✅ notifyTripStateChange() nueva función de transiciones
```

---

## 🧪 Plan de Verificación

### Test Case 1: Cliente ve OTP al Llegar Conductor
**Escenario:** Cliente solicita viaje → Conductor acepta → Conductor llega

**Pasos:**
1. Login como cliente
2. Solicitar viaje a destino
3. Conductor acepta (desde otra sesión/dispositivo)
4. Conductor llega al origen

**Verificar:**
```
ESPERADO - Notificación Cliente:
┌─────────────────────────────────────┐
│ 🚗 Tu conductor ha llegado           │
├─────────────────────────────────────┤
│ ¡Llegó!                             │
│ Muestra código: 1234 ← OTP 🎯        │
│ ¡Comienza tu viaje!                 │
└─────────────────────────────────────┘

VERIFICAR EN LOGS:
🔔 [NOTIFICACIÓN CLIENTE] Estado cambió: ACCEPTED → ARRIVED
```

**Validación:** ✅ PASS si el OTP (1234 o similar) aparece en la notificación

---

### Test Case 2: Conductor ve OTP al Llegar
**Escenario:** Conductor acepta → Llega a origen

**Pasos:**
1. Login como conductor
2. Aceptar solicitud de cliente
3. Ir al origen
4. Cambiar status a ARRIVED

**Verificar:**
```
ESPERADO - Notificación Conductor:
┌─────────────────────────────────────┐
│ 📍 Cliente en punto                  │
├─────────────────────────────────────┤
│ Cliente (Código: 1234) [OTP]         │
│ esperando.                          │
│ Confirma y comienza.                │
└─────────────────────────────────────┘

VERIFICAR EN LOGS:
🔔 [NOTIFICACIÓN DRIVER] Estado cambió: ACCEPTED → ARRIVED
```

**Validación:** ✅ PASS si conductor ve el código OTP del cliente

---

### Test Case 3: Flujo Completo de Estados
**Verificar todas las transiciones:**

```
1. PENDING → ACCEPTED
   Conductor ve: "🎯 Servicio Aceptado | REF001 | $35,000"

2. ACCEPTED → ARRIVED  
   Conductor ve: "📍 Cliente en punto | Código: 1234"
   Cliente ve: "🚗 Tu conductor ha llegado | Muestra: 1234"

3. ARRIVED → STARTED
   Ambos ven: "▶️ Viaje en curso | En camino"

4. STARTED → COMPLETED
   Notificación desaparece automáticamente
```

---

## 🔍 Cómo Verificar en Emulador

### Opción 1: Usar Logs en Android Logcat
```bash
# En terminal, capturar logs de notificaciones
adb logcat | grep -i "NOTIFICACIÓN\|otp_code\|notifyTripStateChange"

# Output esperado:
# 🔔 [NOTIFICACIÓN CLIENTE] Estado cambió: ACCEPTED → ARRIVED
# ¡Llegó! Muestra código: 1234. ¡Comienza tu viaje!
```

### Opción 2: Revisar Notificaciones en UI
```
1. Abrir app en emulador
2. Deslizar desde arriba (Android notification shade)
3. Buscar notificación de T+Plus
4. Verificar que el OTP aparece en el cuerpo del mensaje
```

### Opción 3: Hacer Pull Request en Base de Datos
```sql
-- En Supabase, verificar que bookings tienen estos campos:
SELECT id, status, otp_code, driver_name, reference, trip_cost 
FROM bookings 
WHERE status IN ('ACCEPTED', 'ARRIVED', 'STARTED')
LIMIT 5;

-- Ejemplo esperado:
id          | status   | otp_code | driver_name | reference | trip_cost
abc123      | ARRIVED  | 1234     | Juan        | REF001    | 35000
```

---

## 📊 Tabla de Mensajes Generados

### Cliente
| Estado | Título | Cuerpo |
|--------|--------|--------|
| **ACCEPTED** | ✅ Viaje Aceptado | Juan en camino. Precio: $35,000. Abre app para ver. |
| **ARRIVED** | 🚗 Tu conductor ha llegado | ¡Llegó! **Muestra código: 1234**. ¡Comienza tu viaje! |
| **STARTED** | ▶️ Viaje en curso | En camino. **REF001** \| $35,000. Abre para tracking. |
| **COMPLETED** | ✅ Completado | (DESAPARECE) |

### Conductor
| Estado | Título | Cuerpo |
|--------|--------|--------|
| **ACCEPTED** | 🎯 Servicio Aceptado | **REF001** \| $35,000. Abre app para detalles. |
| **ARRIVED** | 📍 Cliente en punto | Cliente (**Código: 1234**) esperando. Confirma y comienza. |
| **STARTED** | ▶️ Viaje Iniciado | Conduciendo a destino. **REF001** \| $35,000 |
| **COMPLETED** | 🎉 Completado | (LIMPIADA) |

---

## 🔧 Debugging: Campos Requeridos en Booking

Para que el OTP aparezca, la tabla `bookings` debe tener:

```typescript
// Campo OTP (uno de estos):
otp_code: string             // Preferido
verification_code: string   // Alternativa

// Campos adicionales para contexto:
driver_name: string          // Nombre del conductor
reference: string            // REF001
trip_cost: number            // Precio en pesos
status: string               // ACCEPTED, ARRIVED, etc.
```

**Si el OTP no aparece:**
1. Verificar que el campo existe en Supabase
2. Verificar que tiene un valor (no null)
3. Revisar logs: `adb logcat | grep otp_code`
4. Usar Supabase dashboard para ver valores reales

---

## ✅ Checklist de Validación

- [ ] Cliente recibe notificación cuando conductor acepta
- [ ] Cliente recibe notificación cuando conductor llega CON OTP VISIBLE
- [ ] Conductor recibe notificación cuando acepta
- [ ] Conductor recibe notificación cuando llega CON OTP DEL CLIENTE VISIBLE
- [ ] Ambos reciben notificación cuando viaje comienza
- [ ] Notificaciones desaparecen al completar
- [ ] Logs muestran transiciones de estado
- [ ] App no crashea con cambios de estado rápidos
- [ ] Notificaciones persisten incluso con app en background

---

## 🚀 Siguiente Paso

Una vez verificado que el OTP se ve:

1. ✅ Compilar build final
2. ✅ Instalar en dispositivo físico (o dejar en emulador)
3. ✅ Documentar en README (usuario verá OTP directo en notificación)
4. ✅ Deploy a producción

---

## 📝 Notas de Implementación

### Donde se Llama notifyTripStateChange()

**CustomerActiveTripScreen.tsx** (Línea ~250):
```typescript
if (previousStatusRef.current !== booking?.status) {
  console.log(`🔔 [NOTIFICACIÓN CLIENTE] Estado cambió: ...`);
  await notifyTripStateChange(booking, 'customer', previousStatusRef.current);
  previousStatusRef.current = booking?.status;
}
```

**BookingCabScreen.tsx** (Línea ~132):
```typescript
if (previousStatusRef.current !== currentBooking?.status) {
  const role = user?.usertype === 'driver' ? 'driver' : 'customer';
  console.log(`🔔 [NOTIFICACIÓN ${role.toUpperCase()}] Estado cambió: ...`);
  await notifyTripStateChange(currentBooking, role, previousStatusRef.current);
  previousStatusRef.current = currentBooking?.status;
}
```

### Como Funciona notifyTripStateChange()

```typescript
// En ActiveTripNotificationService.ts
export const notifyTripStateChange = async (
  booking: any,
  role: 'customer' | 'driver',
  previousStatus?: string
): Promise<void> => {
  // 1. Obtiene descripción del nuevo estado
  const stateDesc = getTripStateDescription(booking.status, role);
  
  // 2. Genera título con emoji: "🚗 Tu conductor ha llegado"
  const title = buildTitle(booking, role);
  
  // 3. Genera cuerpo CON OTP: "¡Llegó! Muestra código: 1234"
  const body = buildBody(booking, role);
  
  // 4. Programa notificación o la dispara inmediatamente
  // (usa expo-notifications para mostrar)
};
```

---

## 🎓 Referencia: Campo OTP en buildBody()

En **ActiveTripNotificationService.ts**, función `buildBody()`:

```typescript
const otp = booking.otp_code || booking.verification_code || '';

if (role === 'customer') {
  if (booking.status === 'ARRIVED') {
    return `¡Llegó! ${otp ? `Muestra código: ${otp}` : 'Presenta tu código'}. ¡Comienza tu viaje!`;
  }
}

if (role === 'driver') {
  if (booking.status === 'ARRIVED') {
    return `Cliente (Código: ${otp}) esperando. Confirma y comienza.`;
  }
}
```

---

**Última actualización:** 19 de abril, 2026  
**Versión:** 1.0 - OTP Visible en Notificaciones  
**Status:** ✅ LISTO PARA TESTING
