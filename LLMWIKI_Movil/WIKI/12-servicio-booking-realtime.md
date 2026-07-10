# Servicio BookingRealtimeService

> Suscripciones Supabase Realtime sobre `bookings` y `booking_tracking` +
> CRUD asíncrono asociado. Clase con `Map<string, RealtimeChannel>` estático
> que evita canales duplicados.

---
tags: [movil, servicio, realtime, supabase]
entidades: [BookingRealtimeService, bookings, booking_tracking]
---

## Ubicación

`App/common/services/BookingRealtimeService.ts` — clase con métodos estáticos.

## Tres canales que abre

| Método | Tabla | Evento | Filtro | Nombre canal |
|--------|-------|--------|--------|--------------|
| `subscribeToNewBookings(city, cb, driverId?)` | `bookings` | `INSERT` | `customer_city=eq.{city}` | `new-bookings-{city}` o `new-bookings-{city}-{driverId}` |
| `subscribeToBookingUpdates(bookingId, cb)` | `bookings` | `UPDATE` | `id=eq.{bookingId}` | `booking-{bookingId}` |
| `subscribeToLocationTracking(bookingId, cb)` | `booking_tracking` | `INSERT` | `booking_id=eq.{bookingId}` | `tracking-{bookingId}` |

Antes de crear canal, llama `supabase.removeChannel(existingChannel)` si ya
existe — previene fugas.

## Filtrado adicional en cliente

`subscribeToNewBookings` recibe **todas** las INSERT por ciudad pero el
callback solo dispara si `payload.new.status === 'NEW'`. Otros estados
iniciales (raros) se ignoran.

## Métodos REST (no realtime)

| Método | Qué hace |
|--------|----------|
| `getActiveBookings(userId, userType)` | `select * from bookings where {customer\|driver}=userId and status in ('NEW','ACCEPTED','STARTED','ARRIVED') order by created_at desc` |
| `updateBooking(bookingId, updates)` | `update bookings set ... where id=bookingId` con `.select().single()` |
| `insertTracking(bookingId, driverId, {lat,lng,speed?,heading?})` | Insert en `booking_tracking` |

⚠️ **Bug latente:** `getActiveBookings` arma el filtro con
`const column = userType === 'customer' ? 'customer' : 'driver';`. Coincide
con schema real (`bookings.customer`, `bookings.driver`). Pero la doc oficial
`ENDPOINTS_Y_CONSULTAS.md` dice `customer_id`/`driver_id` → docs mienten.
Ver [[10-deuda-tecnica]] §11.

## Limpieza

- `unsubscribe(channelName)` — un canal.
- `unsubscribeAll()` — todos. Llamar al hacer logout o cerrar viaje.

## Estados que mueven UI

```
NEW (cliente crea)
 → ACCEPTED (driver acepta)
   → ARRIVED (driver llega)
     → STARTED (OTP validado)
       → COMPLETE
         → PAID
CANCELLED (en cualquier punto)
```

Definidos en `bookings_status_check` constraint.

## RLS

`booking_tracking` insert requiere `auth.uid()::text = driver_id::text`. Si
publicas tracking sin el JWT del conductor asignado, falla. Para SELECT debe
existir reserva con `customer` o `driver` = `auth.uid()`.

## Requisito de Realtime en Postgres

Las tablas deben estar en `publication supabase_realtime`. Script:
`App/sql/enable-realtime-tracking.sql`.

## Fuentes
- `App/common/services/BookingRealtimeService.ts`
- `App/sql/bookings-schema.sql` (RLS, estados, triggers)
- `App/sql/enable-realtime-tracking.sql`
