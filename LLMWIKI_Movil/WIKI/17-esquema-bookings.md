# Esquema `bookings` + `booking_tracking`

> ⚠️ **Página con fuentes fantasma detectadas 2026-07-04.** Los 6 archivos
> `App/sql/*.sql` citados en `## Fuentes` **no existen en el repo** — esa
> carpeta nunca se creó (confirmado repetidamente en sesión 2026-07-04). El
> contenido de abajo probablemente se escribió a partir de esos archivos
> asumidos o de una versión anterior/planeada del repo, nunca verificado
> contra el dump real. Corregidas las secciones donde se detectó
> discrepancia contra `App/supabase/BBDDRemota.sql` (dump real de
> producción); el resto de esta página **sigue sin reconciliar
> completamente** — tratar cualquier detalle no marcado con ⚠️ como
> no-verificado, no como confirmado.

---
tags: [bd, esquema, bookings, rls]
entidades: [bookings, booking_tracking, active_bookings, booking_stats]
---

## Tabla `bookings`

### Identidad / referencia
| Columna | Tipo | Default |
|---------|------|---------|
| `id` | `UUID PK` | `gen_random_uuid()` |
| `reference` | `VARCHAR(10) UNIQUE NOT NULL` | trigger `generate_booking_reference` (6 chars `[A-Z0-9]`) |
| `booking_date` | `TIMESTAMPTZ` | `NOW()` |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | `NOW()` + trigger |

### Cliente
`customer UUID FK → users(id) ON DELETE SET NULL`,
`customer_name VARCHAR(255)`, `customer_email`, `customer_token TEXT`,
`customer_contact VARCHAR(20)`, `customer_city VARCHAR(100)`,
`customer_status VARCHAR(50) DEFAULT 'NEW'`.

⚠️ **Corrección 2026-07-04:** existen AMBAS columnas, `customer_id uuid` (FK
formal a `users`) y `customer uuid` (la que el código de la app realmente
usa/lee: `booking.customer`, `WHERE customer = auth.uid()`, etc.). No es
"customer, no customer_id" — es un caso de columnas duplicadas/paralelas
(mismo patrón que `car_type` vs `car_type_id`, ver abajo). Verificado contra
`App/supabase/BBDDRemota.sql:161-286`.

### Conductor
`driver UUID FK → users(id) ON DELETE SET NULL`,
`driver_name`, `driver_contact`, `driver_token`, `driver_status`,
`driver_image`, `driver_arrived_time TIMESTAMPTZ`,
`driver_active_status BOOLEAN DEFAULT false`.

### Ubicaciones (NOT NULL en schema original; ALTER las afloja luego)
`pickup_address TEXT`, `pickup_lat DECIMAL(10,8)`, `pickup_lng DECIMAL(11,8)`,
`drop_address TEXT`, `drop_lat`, `drop_lng`.

Constraint `valid_coordinates`: lat ∈ [-90,90], lng ∈ [-180,180].

### Vehículo y viaje
`car_type VARCHAR(50)` (nombre, el que usa el código) + `car_type_id UUID FK
→ car_types(id)` (columna paralela, poco usada en código de la app),
`car_model VARCHAR(100)`, `car_image TEXT`,
`plate_number VARCHAR(20)`, `vehicle_number VARCHAR(20)`,
`distance DECIMAL(10,2)`, `duration INTEGER` (min),
`trip_type VARCHAR(50) DEFAULT 'Solo Ida'`,
`trip_urban VARCHAR(50) DEFAULT 'Urbano'`,
`booking_type VARCHAR(20) DEFAULT 'immediate'` (`'immediate'`/`'reservation'`
— no documentado antes en esta página, columna real confirmada en
`BBDDRemota.sql:241`).

⚠️ **Nuevo (2026-07-04):** `min_fare_snapshot NUMERIC(10,2)` — piso de cobro
capturado al crear la reserva, usado por `calculate_total_cost`. Ver
[[22-plan-fix-bug-min-fare]] y [[21-calculo-tarifa]].

### Pago
`estimate`, `trip_cost`, `convenience_fees DEFAULT 0`, `discount DEFAULT 0`,
`total_cost` (calculado por trigger), `driver_share`,
`payment_mode VARCHAR(50) DEFAULT 'cash'`, `payment_gateway`.

Trigger `calculate_total_cost` — **actualizado 2026-07-04** (piso `min_fare_snapshot`,
verificado contra `pg_get_functiondef` real antes de reemplazar):
```sql
NEW.total_cost := GREATEST(
  COALESCE(NEW.trip_cost, 0) + COALESCE(NEW.convenience_fees, 0) - COALESCE(NEW.discount, 0),
  COALESCE(NEW.min_fare_snapshot, 0)
);
```
Versión anterior (sin piso) documentada en [[22-plan-fix-bug-min-fare]] BUG-2.

### Estado y tiempos
```
status VARCHAR(20) DEFAULT 'NEW' CHECK (
  status IN ('NEW','PENDING','ACCEPTED','STARTED','ARRIVED','REACHED','COMPLETE','PAID','CANCELLED')
)
```

⚠️ **Corregido 2026-07-04:** faltaban `PENDING` y `REACHED` en el enum
documentado. `REACHED` en particular **no estaba permitido en el constraint
real de producción** hasta que se migró explícitamente el 2026-07-04 (bug
confirmado — 13 archivos del código ya escribían `status='REACHED'` desde
antes, los UPDATEs fallaban silenciosos). Ver [[10-deuda-tecnica]] #27
(cerrado). `COMPLETE` (no `COMPLETED`) sigue siendo correcto.

`trip_start_time`, `trip_end_time`, `total_trip_time INTEGER` (min).

### OTP (tras `EJECUTAR_PRIMERO_OTP_SETUP.sql`)
| Columna | Tipo |
|---------|------|
| `otp` | `VARCHAR(4)` (era 6) |
| `otp_verified` | `BOOLEAN DEFAULT false` |
| `otp_generated_at` | `TIMESTAMPTZ` |
| `otp_verified_at` | `TIMESTAMPTZ` |

### Promos
`promo_applied BOOLEAN DEFAULT false`, `promo_code VARCHAR(50)`,
`promo_details JSONB`.

### Misc
`observations TEXT`, `requested_drivers JSONB DEFAULT '{}'`,
`driver_estimates JSONB DEFAULT '{}'`, `waypoints JSONB DEFAULT '[]'`,
`coords JSONB`.

## Índices

```
idx_bookings_customer, idx_bookings_driver,
idx_bookings_status, idx_bookings_created_at DESC,
idx_bookings_customer_status, idx_bookings_driver_status,
idx_bookings_reference, idx_bookings_customer_city,
idx_bookings_status_created (compuesto),
idx_bookings_driver_status_created (compuesto),
idx_bookings_otp_status, idx_bookings_otp_generated_at (parcial)
```

## RLS

| Policy | Operación | Condición |
|--------|-----------|-----------|
| `Users can view their own bookings` | SELECT | `auth.uid()=customer OR auth.uid()=driver OR user_type='admin'` |
| `Customers can create bookings` | INSERT | `auth.uid()=customer AND user_type IN ('customer','company')` |
| `Drivers can update their bookings` | UPDATE | `auth.uid()=driver OR auth.uid()=customer OR user_type='admin'` |
| `Only admins can delete bookings` | DELETE | `user_type='admin'` |

## Triggers

- `trigger_bookings_updated_at` BEFORE UPDATE → `update_bookings_updated_at`.
- `trigger_generate_booking_reference` BEFORE INSERT.
- `trigger_calculate_total_cost` BEFORE INSERT/UPDATE.
- `trigger_notify_new_booking` AFTER INSERT → `pg_notify('new_booking', ...)`
  con `booking_id, customer_city, pickup_address, drop_address, car_type, trip_cost, distance`.

## Tabla `booking_tracking`

⚠️ **Sección reescrita 2026-07-04** — la versión anterior citaba columnas
`speed`, `heading` y `timestamp` que **no existen**. Verificado contra
`App/supabase/BBDDRemota.sql:139-158` (dump real):

```sql
id BIGSERIAL PK
booking_id UUID NOT NULL FK → bookings(id) ON DELETE CASCADE
driver_id UUID NULL
lat NUMERIC(10,8) NOT NULL          -- ⚠️ NO 'latitude'
lng NUMERIC(11,8) NOT NULL          -- ⚠️ NO 'longitude'
accuracy REAL NULL                  -- NO existe 'speed' ni 'heading'
created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
```

**No existe columna `timestamp`** — solo `created_at`/`updated_at`. Este
error concreto causó un bug real: `addActualsToBooking`
(`App/common/other/sharedFunctions.ts`) pedía `select('lat, lng,
timestamp')` y ordenaba por `timestamp` — PostgREST rechazaba la consulta
(columna inexistente), el error no se chequeaba, y la recalculación de
distancia al finalizar viaje siempre devolvía 0 sin ningún error visible.
Corregido 2026-07-04 a `created_at`. Ver [[21-calculo-tarifa]] §Actualización
2026-07-04 (2).

Índices reales: `idx_booking_tracking_booking_id(booking_id)`,
`idx_booking_tracking_driver_id(driver_id)`,
`idx_booking_tracking_created_at(created_at DESC)`,
`idx_tracking_booking(booking_id)` (duplicado del primero).

### RLS booking_tracking

⚠️ No verificado en esta pasada — el comentario en
`App/common/services/driverLocationTask.ts:92` dice *"RLS está desactivado
en booking_tracking — anon key es suficiente"*, lo cual contradice las
policies de abajo (heredadas de la versión anterior de esta página, no
re-verificadas). Confirmar directamente contra Supabase antes de asumir
cualquiera de las dos versiones:

- `Users can view tracking for their bookings` SELECT — EXISTS booking con
  customer o driver = `auth.uid()`.
- `Drivers can insert tracking` INSERT WITH CHECK `auth.uid()=driver_id`.

## Vistas

- `active_bookings` — JOIN con `users` (cliente y conductor), filtra status ∈
  `(NEW, ACCEPTED, STARTED, ARRIVED)`.
- `booking_stats` — agregados por `customer`.

## Fuentes
- `App/supabase/BBDDRemota.sql` (dump real — única fuente verificada, líneas 139-286)
- `App/common/other/sharedFunctions.ts` (`addActualsToBooking`, uso real de `booking_tracking`)
- `App/common/services/driverLocationTask.ts` (insert real de tracking points)
- [[22-plan-fix-bug-min-fare]], [[21-calculo-tarifa]] (columnas `min_fare_snapshot`, trigger actualizado)
- ⚠️ Los 6 archivos `App/sql/*.sql` citados antes **no existen en el repo** — no se puede verificar RLS/índices/constraints que solo estaban documentados ahí sin confirmación independiente.
