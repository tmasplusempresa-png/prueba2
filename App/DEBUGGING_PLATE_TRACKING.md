# 🔍 Guía de Debugging: Placa de Rastreo Se Queda Cargando

## Problema Reportado
"Se queda cargando el botón y no puedo ver la ubicación del conductor en tiempo real"

## 1️⃣ Verificación en Consola

Abre la pantalla "Seguir servicio" y busca una placa. En los **DevTools/Console** deberías ver logs como estos:

### ✅ Pasos esperados (éxito):
```
[PlateTracking] Searching for plate: ABC123
[PlateTracking] RPC response: [{booking_id: "xxx", driver_name: "Juan", ...}]
[PlateTracking] Found booking: {
  bookingId: "xxx",
  status: "ACCEPTED",
  hasLat: true,
  hasLng: true
}
[PlateTracking] Setting initial location: {lat: 4.7123, lng: -74.0456}
[PlateTracking] Subscription status: SUBSCRIBED
```

### ❌ Si ves esto, hay problemas:

**CASO 1: No se ve `[PlateTracking] Searching for plate`**
- El botón no está reaccionando al click
- Verifica que el botón no esté deshabilitado (vacío)
- Asegúrate de escribir una placa válida

**CASO 2: Ves error `[PlateTracking] RPC error`**
```
[PlateTracking] RPC error: XXXXX
```
- **Si dice "permission denied"** → Problema de RLS policies en la BD
- **Si dice "relation does not exist"** → La tabla `booking_tracking` no existe
- **Si dice "function does not exist"** → El RPC `get_active_booking_by_plate` no existe

**CASO 3: Ves `[PlateTracking] No active booking found for plate`**
- La placa no existe en la BD, O
- No hay una RESERVA ACTIVA con esa placa
- La reserva debe estar en estado: `ACCEPTED`, `ARRIVED`, o `STARTED`

**CASO 4: Ves `No initial location data from booking_tracking`**
- La reserva existe pero NO HAY DATOS DE GPS
- El conductor no ha registrado su ubicación
- El hook `useDriverTracking` no está activo en el conductor

**CASO 5: NO ves `Subscription status: SUBSCRIBED`**
- La suscripción en tiempo real falla
- Problema de permisos RLS
- El realtime de Supabase no está funcionando

---

## 2️⃣ Verificación en Supabase (Panel de Control)

### Paso A: Verificar que la tabla existe
1. Ve a **SQL Editor**
2. Ejecuta:
```sql
SELECT COUNT(*) as cantidad_registros 
FROM booking_tracking;
```
Si da error **"relation 'booking_tracking' does not exist"**, necesitas crear la tabla:
- Ejecuta: `sql/001_create_booking_tracking_table.sql`
- Ejecuta: `sql/002_plate_tracking_rpc.sql`

### Paso B: Verificar que hay datos de tracking
```sql
SELECT * 
FROM booking_tracking 
ORDER BY created_at DESC 
LIMIT 5;
```

Si está vacío → El conductor NO está registrando ubicación

### Paso C: Verificar que hay reservas activas
```sql
SELECT id, plate_number, status, driver_name
FROM bookings
WHERE status IN ('ACCEPTED', 'ARRIVED', 'STARTED')
ORDER BY created_at DESC
LIMIT 5;
```

Si está vacío → No hay viajes activos. Necesitas crear una reserva de prueba.

### Paso D: Verificar que el RPC funciona
```sql
SELECT * FROM get_active_booking_by_plate('ABC123');
```
(Reemplaza ABC123 con una placa real)

Si da error → El RPC está roto. Ejecuta: `sql/002_plate_tracking_rpc.sql` de nuevo.

### Paso E: Verificar las RLS Policies
1. Ve a **Authentication** → **Policies**
2. Busca tabla **booking_tracking**
3. Verifica que exista la policy **`auth_view_active_bookings_tracking`**
4. Asegúrate que permite **SELECT** para usuarios **authenticated**

---

## 3️⃣ Verificación en la App del Conductor

El problema podría estar en que **el conductor NO está rastreando activamente**.

### Verificar si el conductor está mandando ubicación:
1. Abre la app como conductor
2. Acepta una reserva
3. Ve a los **DevTools/Console** y busca logs como:
```
[useDriverTracking] effect run { isActive: true, bookingId: "xxx" }
[useDriverTracking] permission status (read): granted
[useDriverTracking] starting watchPositionAsync
[useDriverTracking] inserted { lat: 4.7123, lng: -74.0456 }
```

Si **NO ves estos logs**:
- El hook `useDriverTracking` no se está ejecutando
- Verifica que `isTrackingActive` sea `true` en `BookingCabScren.tsx`
- Verifica que los permisos de localización estén **granted**

Si **SÍ ves los logs**:
- El conductor SÍ está enviando datos
- Verifica que aparezcan en `booking_tracking` (Paso B anterior)

---

## 4️⃣ Checklist Completo

- [ ] ¿La tabla `booking_tracking` existe?
- [ ] ¿Hay datos en `booking_tracking`?
- [ ] ¿El RPC `get_active_booking_by_plate` retorna resultados?
- [ ] ¿Las RLS policies permiten SELECT en `booking_tracking`?
- [ ] ¿El conductor tiene permiso de localización otorgado?
- [ ] ¿El conductor está en estado ACCEPTED/ARRIVED/STARTED?
- [ ] ¿El conductor está viendo logs de `[useDriverTracking] inserted`?
- [ ] ¿La placa de búsqueda es exacta (mayúsculas, sin espacios)?

---

## 5️⃣ Soluciones Rápidas

### 🚀 Si nada funciona, ejecuta TODOS estos SQL en orden:

```sql
-- 1. Crear tabla de tracking
-- Ejecuta contenido de: sql/001_create_booking_tracking_table.sql

-- 2. Crear RPC y policies
-- Ejecuta contenido de: sql/002_plate_tracking_rpc.sql

-- 3. Llenar info de vehículos
-- Ejecuta contenido de: sql/003_fill_vehicle_on_driver_assign.sql

-- 4. Verificar que todo funciona
SELECT COUNT(*) FROM booking_tracking;
SELECT * FROM bookings WHERE status IN ('ACCEPTED', 'ARRIVED', 'STARTED') LIMIT 5;
```

### 📱 Si el conductor no envía ubicación:
1. Verifica que la app tenga **permisos de localización**
2. En el simulador, habilita "Mock Location" (Android)
3. En iOS, ve a Development Settings → Location

### 🔐 Si ves "permission denied":
1. Ve a **Authentication** → **Policies**
2. Asegúrate que la policy `auth_view_active_bookings_tracking` existe
3. Ejecuta nuevamente: `sql/002_plate_tracking_rpc.sql`

---

## 6️⃣ Logs Clave para Pegar en Help

Cuando reportes el problema, **copia estos logs**:

**Del cliente buscando placa:**
```
[PlateTracking] Searching for plate: ABC123
[PlateTracking] RPC response: ???
[PlateTracking] RPC error: ???
```

**Del conductor enviando ubicación:**
```
[useDriverTracking] effect run { isActive: ???, bookingId: "???" }
[useDriverTracking] inserted { lat: ???, lng: ??? }
```

**Del SQL (en Supabase):**
```sql
SELECT COUNT(*) FROM booking_tracking;
SELECT * FROM bookings WHERE status IN ('ACCEPTED') LIMIT 1;
SELECT * FROM get_active_booking_by_plate('ABC123');
```

---

**Última actualización:** 2 de mayo de 2026  
**Versión:** 1.0
