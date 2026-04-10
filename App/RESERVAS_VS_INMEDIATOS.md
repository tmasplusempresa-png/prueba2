# 🚀 Diferenciación: Reservas vs Servicios Inmediatos

## Resumen Implementado

Se ha creado un sistema completo de diferenciación entre **RESERVAS** (pedir para más adelante) e **INMEDIATOS** (pedir ASAP) con búsqueda geoespacial y rango dinámico.

---

## 1. Base de Datos - Campo `booking_type`

### SQL Query a ejecutar en Supabase:

```sql
-- Si no existe, agregar la columna
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) DEFAULT 'immediate' 
  CHECK (booking_type IN ('immediate', 'reservation'));

-- Actualizar registros existentes
UPDATE public.bookings 
  SET booking_type = 'immediate' 
  WHERE booking_type IS NULL;

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_bookings_type_status 
  ON public.bookings(booking_type, status);
```

### Valores:
- **`immediate`** = Servicio ASAP (aparece en "Buscar Servicios")
- **`reservation`** = Reserva programada para después (aparece en "Reservas Disponibles")

---

## 2. CreateReservationScreen - Guardar con tipo correcto

### Cambio implementado:

```typescript
// bookingMode: 'immediate' → booking_type: 'immediate', status: 'NEW'
// bookingMode: 'scheduled' → booking_type: 'reservation', status: 'PENDING'

const isImmediate = bookingMode === 'immediate';
const body = {
  booking_type: isImmediate ? 'immediate' : 'reservation',
  status: isImmediate ? 'NEW' : 'PENDING',
  customer_status: isImmediate ? 'SEARCHING' : 'NEW',
  // ... resto de campos
};
```

### Estados por tipo:
| Modo | booking_type | status | customer_status | Visible en |
|------|-------------|--------|-----------------|-----------|
| 🟡 Inmediato | `immediate` | `NEW` | `SEARCHING` | "Buscar Servicios" |
| 📅 Programado | `reservation` | `PENDING` | `NEW` | "Reservas Disponibles" |

---

## 3. DriverReservationsScreen - Búsqueda geoespacial

### Nuevo componente: Tabs con búsqueda de inmediatos

**Tabs disponibles:**
1. **Reservas** (📅)
   - Muestra reservas con `status=PENDING` y `booking_type=reservation`
   - Visible para futuras fechas

2. **Inmediatos** (⚡)
   - Muestra servicios con `status=NEW` y `booking_type=immediate`
   - Botón **"GO"** para buscar en rango actual
   - Indicador de rango dinámico: `Inmediatos (3km)`, `Inmediatos (6km)`, etc.

### SQL RPC - Buscar servicios inmediatos

**Función: `search_immediate_bookings(driver_lat, driver_lng, range_km, driver_id)`**

```sql
-- Ubicación: sql/search-immediate-bookings.sql

-- Dentro de la función se:
-- 1. Calcula distancia Haversine desde driver a cada pickup
-- 2. Filtra por rango_km
-- 3. Excluye si el driver ya rechazó o pidió el booking
-- 4. Ordena por distancia (más cercanos primero)
-- 5. Retorna máximo 50 resultados

-- Uso en app:
const result = await rpcs.search_immediate_bookings({
  driver_lat: 4.7110,      // Ubicación actual del driver
  driver_lng: -74.0721,
  range_km: 3,             // Rango inicial
  driver_id: driverId
});
```

---

## 4. Lógica de Rango Dinámico

### Aumento automático cada 5 minutos:

```
⏰ Segunda 0:     Rango 3 km  → "Inmediatos (3km)"
⏰ Segundo 5 min: Rango 6 km  → "Inmediatos (6km)"
⏰ Segundo 10 min: Rango 9 km → "Inmediatos (9km)"
⏰ Segundo 15 min: Rango 12 km → "Inmediatos (12km)"
... (+3km cada 5 minutos)
```

### Implementado en:
- Timer que dispara cada 5 minutos
- `setRangeKm(prev => prev + 3)`
- Se reinicia cuando el conductor alterna tabs

---

## 5. Aceptación de Servicios

### Ambos tipos funcionan igual:

```typescript
// Validación adaptada
const expectedStatus = isImmediate ? 'NEW' : 'PENDING';
const checkUrl = `...bookings?id=...&status=eq.${expectedStatus}&booking_type=eq.${type}`;

// Update: status → ACCEPTED, driver → driverId
// Notificaciones personalizadas por tipo
```

**Notificaciones:**
- 🟡 **Inmediato**: "¡Conductor en camino! 🚗" (sin fecha/hora)
- 📅 **Reserva**: "¡Reserva Aceptada! ✅" (con fecha/hora)

---

## 6. Estados de Booking

### Ciclo completo:

**INMEDIATO:**
```
CLIENTE crea → booking_type='immediate', status='NEW', customer_status='SEARCHING'
CONDUCTOR acepta → status='ACCEPTED', driver=driver_id
VIAJE comienza → status='STARTED'
VIAJE termina → status='COMPLETE' → PAID
```

**RESERVA:**
```
CLIENTE crea → booking_type='reservation', status='PENDING', customer_status='NEW'
CONDUCTOR acepta → status='ACCEPTED', driver=driver_id
FECHA/HORA llega → status='STARTED'
VIAJE termina → status='COMPLETE' → PAID
```

---

## 7. Archivos Modificados

✅ **sql/add-booking-mode-column.sql** (creado)
✅ **sql/search-immediate-bookings.sql** (creado) - RPC geoespacial
✅ **app/(tabs)/CreateReservationScreen.tsx** - Guardar con booking_type correcto
✅ **app/(tabs)/DriverReservationsScreen.tsx** - Tabs + búsqueda inmediatos

---

## 8. PRÓXIMOS PASOS - Ejecutar en Supabase

### 1️⃣ Ejecutar migraciones en SQL Editor:

```bash
# Archivo 1: Agregar columna
sql/add-booking-mode-column.sql

# Archivo 2: RPC geoespacial
sql/search-immediate-bookings.sql
```

### 2️⃣ Verificar indexación:

```sql
-- Confirmar índices existen
SELECT indexname FROM pg_indexes 
WHERE tablename = 'bookings' 
AND indexname LIKE '%immediate%';
```

### 3️⃣ Testear en app:

1. Crear reserva con modo **"📅 Programado"** (future date)
   - Debe guardar con `booking_type='reservation'`

2. Crear servicio con modo **"⚡ Inmediato"** (NOW)
   - Debe guardar con `booking_type='immediate'`

3. En pantalla de conductor:
   - Tab "Reservas" muestra solo reservas programadas
   - Tab "Inmediatos" muestra servicios ASAP con botón GO
   - Rango inicia en 3km, aumenta cada 5 min

4. Aceptar ambos tipos debe funcionar

---

## 9. Validación

```typescript
// Para validar en desarrollo:
console.log(`${booking.booking_type} - ${booking.status} - ${booking.customer_status}`);

// Expected:
// "immediate - NEW - SEARCHING" ← Inmediato creado
// "reservation - PENDING - NEW" ← Reserva creada
```

---

## 📝 Notas importantes

1. ⚠️ **El rango se reinicia a 3km cada vez que se cambia de tab**
2. ⚠️ **Los inmediatos solo se buscan al presionar GO** (no automático)
3. ⚠️ **La RPC necesita ubicación del conductor** (usar ubicación guardada o Bogotá default)
4. ⚠️ **Verificar que Mapbox token esté configurado** para calcular rutas
