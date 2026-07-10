# Servicio DriverTrackingService

> Lectura de última posición + suscripción Realtime al canal del conductor +
> helpers de distancia/ETA (Haversine con factor urbano).

---
tags: [movil, servicio, tracking, mapas]
entidades: [DriverTrackingService, booking_tracking, Mapbox]
---

## Ubicación

`App/common/services/DriverTrackingService.ts` — funciones top-level
(no clase).

## Tipos

```ts
interface DriverLocation { lat: number; lng: number; timestamp: number; accuracy?: number; }
type DistanceEtaState = 'VERY_CLOSE' | 'NORMAL' | 'FAR';
interface DistanceEtaResult { distanciaTexto: string; etaTexto: string; estado: DistanceEtaState; }
```

## API

| Función | Qué hace |
|---------|----------|
| `getLatestTrackingPoint(bookingId)` | `select lat, lng, created_at from booking_tracking where booking_id=eq.{id} order by created_at desc limit 1`. Devuelve `DriverLocation \| null`. |
| `subscribeToDriverTracking(bookingId, onUpdate, onError?)` | Suscripción Realtime INSERT a `booking_tracking` filtrada por `booking_id`. Config `broadcast.self: true` + `presence`. Devuelve unsubscribe `() => void`. |
| `calculateDistance(lat1, lng1, lat2, lng2)` | Haversine puro, km. |
| `haversineKm(...)` | Alias exportado de `calculateDistance`. |
| `calcEtaLocal(driver, pickup)` | Aplica **factor urbano 1.35**, velocidad 25 km/h. Devuelve `{ distanceKm, etaMin }`. |
| `formatDistanceAndEta(linearKm)` | Variante con **factor variable por rango**, ver tabla abajo. |
| `getEstimatedTime(originLat, originLng, destLat, destLng, mapboxToken)` | Mapbox Directions API (`/directions/v5/mapbox/driving/...`). 5 parámetros posicionales (no un par de objetos `o, d`). Devuelve `{ distance, duration }` o `null`. |

## Factor urbano por rango (`formatDistanceAndEta`)

| Distancia lineal | Factor | Velocidad | Estado |
|------------------|--------|-----------|--------|
| `< 0.2 km` | — | — | `VERY_CLOSE` ("Conductor muy cerca", `1 min`) |
| `< 1 km` | 1.5 | 15 km/h | `NORMAL` |
| `1–5 km` | 1.35 | 25 km/h | `NORMAL` |
| `> 5 km` | 1.25 | 35 km/h | `NORMAL` o `FAR` |
| Ajustada `> 15 km` | — | — | `FAR` (ETA redondea múltiplos de 5 min, formato `~Xh Ym`) |

Razón: compensar distancia lineal Haversine vs calles reales en tráfico
urbano Bogotá. Sin llamada externa.

## Cuándo usar cuál

- **ETA visible en card del conductor:** `formatDistanceAndEta(haversineKm(...))`.
- **ETA precisa al iniciar viaje:** `getEstimatedTime` (Mapbox) — consume cuota.
- **Cálculo silencioso (logs, métricas):** `calcEtaLocal`.

## Diferencia con `BookingRealtimeService.subscribeToLocationTracking`

Ambos suscriben al mismo INSERT en `booking_tracking`. La diferencia:

| | `BookingRealtimeService` | `DriverTrackingService` |
|--|--------------------------|-------------------------|
| Estructura | Clase + `Map` de canales | Función standalone |
| Config canal | default | `broadcast.self: true` + `presence` |
| Tipado callback | `any` | `DriverLocation` |
| Manejo error | Solo log | `onError` callback explícito |

Convergen en infraestructura. Candidato a unificación — ver [[10-deuda-tecnica]].

## Fuentes
- `App/common/services/DriverTrackingService.ts`
- `App/supabase/BBDDRemota.sql` (`booking_tracking`, dump de referencia — `App/sql/` y `App/REAL_TIME_TRACKING_SETUP.md` citados antes no existen en el repo)
