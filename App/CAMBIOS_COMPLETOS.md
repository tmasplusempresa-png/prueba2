# 🎯 Resumen de cambios - Diferenciación Reservas vs Inmediatos

## ✅ Lo que ya está hecho en el código:

### 1. **CreateReservationScreen.tsx** - ¿Cómo se guardan?
```typescript
// Si usuario selecciona "⚡ Inmediato":
booking_type: 'immediate'
status: 'NEW'
customer_status: 'SEARCHING'

// Si usuario selecciona "📅 Programado" + fecha futura:
booking_type: 'reservation'
status: 'PENDING'
customer_status: 'NEW'
```

### 2. **DriverReservationsScreen.tsx** - ¿Cómo se muestran?

**Tab "📅 Reservas":**
```sql
booking_type = 'reservation' AND status = 'PENDING'
```
- Muestra solo reservas programadas

**Tab "⚡ Inmediatos":**
```sql
booking_type = 'immediate' AND status = 'NEW'
```
- Muestra solo servicios ASAP
- Botón "GO" para buscar en rango (3km, +3km c/5min)

### 3. **Flujo después de aceptar** - ¿A dónde va?
Ambos (inmediato y reserva) van a:
```
ReservationTripScreen
↓
Mapa + Ruta
↓
Botones: Iniciar Viaje, Llamar, Cancelar
```

### 4. **RPC geoespacial** - ¿Cómo busca inmediatos?
```
sql/search-immediate-bookings.sql
- Calcula distancia desde driver a cada pickup
- Filtra por rango_km (3, 6, 9, 12... km)
- Ordena por más cercano primero
- Máx 50 resultados
```

---

## ⚠️ LO QUE FALTA (CRÍTICO):

### Ejecutar en Supabase SQL Editor:

**Archivo 1: Crear la columna**
```
masterchiefpar1/sql/add-booking-mode-column.sql
```
❌ Sin esto → La BD no sabe diferenciar

**Archivo 2: Crear la función RPC**
```
masterchiefpar1/sql/search-immediate-bookings.sql
```
❌ Sin esto → No busca inmediatos por rango

---

## 📋 Archivos modificados:

| Archivo | Cambio |
|---------|--------|
| `app/(tabs)/CreateReservationScreen.tsx` | Guardar booking_type correcto |
| `app/(tabs)/DriverReservationsScreen.tsx` | Tabs separados + búsqueda inmediatos |
| `sql/add-booking-mode-column.sql` | Migración mejorada (backfill + logs) |
| `sql/search-immediate-bookings.sql` | RPC geoespacial |
| `sql/diagnose-booking-type-v2.sql` | Script de diagnóstico |

---

## 🚀 PRÓXIMOS PASOS:

1. **Ve a Supabase → SQL Editor**
2. **Ejecuta:**
   - `sql/add-booking-mode-column.sql`
   - `sql/search-immediate-bookings.sql`
3. **Reinicia la app**
4. **Prueba:**
   - Crea inmediato + reserva
   - Verifica que aparezcan en tabs diferentes
   - Acepta uno de cada
   - Verifica que vaya a pantalla de viaje

---

## 🐛 Si no funciona:

**Verifica en Supabase → SQL Editor:**

```sql
-- ¿Existe booking_type?
\d bookings
-- Busca: booking_type | character varying(20)

-- ¿Hay datos?
SELECT booking_type, COUNT(*) FROM bookings GROUP BY booking_type;
-- Esperado: immediate=X, reservation=Y

-- ¿La RPC existe?
SELECT * FROM information_schema.routines WHERE routine_name = 'search_immediate_bookings';
-- Esperado: 1 resultado
```

---

## 📝 Estados exactos:

```
Cliente crea con "⚡ Inmediato"
↓
bookings: booking_type='immediate', status='NEW'
↓
Conductor ve en tab "Inmediatos"
↓
Conductor presiona "GO" (busca en rango 3km)
↓
Se muestra en lista de inmediatos
↓
Conductor presiona "Aceptar"
↓
bookings: status='ACCEPTED', driver=conductor_id
↓
Va a ReservationTripScreen (mapa + ruta)
↓
Conductor presiona "Iniciar Viaje"
↓
bookings: status='STARTED'
↓
(continúa flujo...)
```

---

**¿Necesitas ayuda ejecutando las migraciones?** Dime y te guío paso a paso 🚀
