# Realtime channels — inventario

> Tres canales Supabase Realtime activos en producción. Patrón postgres_changes
> + filtro `=eq.<valor>`. Servidor publica en `supabase_realtime` publication.

---
tags: [realtime, supabase, canales]
entidades: [BookingRealtimeService, DriverTrackingService, bookings, booking_tracking]
---

## Canales

| # | Nombre canal | Tabla | Evento | Filtro | Suscriptor | Servicio |
|---|--------------|-------|--------|--------|------------|----------|
| 1 | `new-bookings-{city}[-{driverId}]` | `bookings` | INSERT | `customer_city=eq.{city}` | Conductor (recibe solicitudes) | [[12-servicio-booking-realtime]] `subscribeToNewBookings` |
| 2 | `booking-{bookingId}` | `bookings` | UPDATE | `id=eq.{bookingId}` | Ambos (sigue el viaje) | [[12-servicio-booking-realtime]] `subscribeToBookingUpdates` |
| 3 | `tracking-{bookingId}` (o `tracking_{bookingId}`) | `booking_tracking` | INSERT | `booking_id=eq.{bookingId}` | Cliente (ve al conductor) | [[12-servicio-booking-realtime]] **y** [[13-servicio-driver-tracking]] |

## Configuración Realtime en BD

Las tablas deben estar listadas en la publicación `supabase_realtime`. Script
de habilitación: `App/sql/enable-realtime-tracking.sql`.

```sql
-- conceptual; ver script real
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_tracking;
```

## Reglas de oro

- **Antes de suscribir**, remover canal existente con mismo nombre
  (`supabase.removeChannel`). El `Map<string, RealtimeChannel>` en
  `BookingRealtimeService` evita fugas.
- **Filtrar también en cliente** el `status === 'NEW'` cuando suscribes a
  nuevas reservas — INSERT puede llegar con otros estados (rare).
- **No suscribir desde un componente sin cleanup**. Usar el `unsubscribe` que
  devuelve `subscribeToDriverTracking` en `useEffect` return.
- **JWT del usuario** debe estar activo. Realtime también respeta RLS.

## Patrón canal de llamadas (Agora)

No es realtime Supabase — usa Agora RTC con channelId determinista
`call_{minUserId}_{maxUserId}` ([[15-servicio-call]]). Push de entrante sí va
por Edge Function `notifyIncomingCall`.

## pg_notify

Trigger `notify_new_booking` emite `pg_notify('new_booking', json)` después de
cada INSERT en `bookings` (status NEW). Hoy nadie lo escucha desde el cliente
(Edge Function podría); el filtro Realtime de la tabla cubre el caso.

## Duplicación a resolver

⚠️ **Confirmado 2026-07-04** (no solo sospecha): los nombres de canal
literalmente difieren — `BookingRealtimeService.ts:116` usa `tracking-${bookingId}`
(guion) y `DriverTrackingService.ts:56` usa `tracking_${bookingId}`
(guion bajo). Al ser nombres de canal **distintos**, Supabase los trata como
dos suscripciones independientes al mismo INSERT filtrado por
`booking_id=eq.{id}` — ambas reciben el evento por separado (no es que
compartan un canal y dupliquen adentro; son dos canales distintos que
casualmente escuchan lo mismo). Si una pantalla monta ambos servicios a la
vez, procesa cada actualización de posición dos veces. Cliente debe usar
uno solo o se reciben eventos duplicados. Ver [[10-deuda-tecnica]].

## Fuentes
- `App/common/services/BookingRealtimeService.ts`
- `App/common/services/DriverTrackingService.ts`
- `App/supabase/BBDDRemota.sql` (trigger `notify_new_booking`, líneas 374-376)
- ⚠️ `App/sql/enable-realtime-tracking.sql` y `App/sql/bookings-schema.sql` citados antes **no existen en el repo**
