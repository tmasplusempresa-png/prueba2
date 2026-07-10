# Cálculo de tarifa del servicio

> Algoritmo real producción de TmasPlus para fijar precio cliente y precio
> conductor. Fórmula alineada con hoja Excel `board`. Vive en
> `App/common/actions/FareCalculator.tsx`. **Fuente única de verdad**.

---
tags: [movil, tarifa, calculo, dominio]
entidades: [FareCalculator, car_types, VehicleCategory, CarDetails]
---

## Ubicación

`App/common/actions/FareCalculator.tsx` — función pura, 113 líneas. Exporta
`FareCalculator(distance, time, rateDetails, instructionData, _decimal, context)`.

## Inputs

| Parámetro | Unidad | Origen |
|-----------|--------|--------|
| `distance` | km (número) | Distancia Mapbox / Google Directions |
| `time` | **segundos** | Duración Mapbox / Google Directions |
| `rateDetails` | objeto | Fila de tabla `car_types` (móvil) |
| `instructionData` | objeto / null | Selecciones extras (parcelas, opciones) |
| `_decimal` | ignorado | Legacy, siempre se pasa `2` |
| `context` | objeto | Flags y costos externos (ver abajo) |

> ⚠️ **Sección reescrita 2026-07-04.** Las tablas de abajo describían el
> algoritmo previo al refactor "Actualización 2026-06-27" (ver más abajo en
> este documento) y quedaron desactualizadas respecto al código real durante
> más de una semana — **el apéndice de actualización ya tenía la versión
> correcta, este bloque no**. Contenido ahora alineado con
> `FareCalculator.tsx` actual.

### `context`

| Flag | Tipo | Efecto |
|------|------|--------|
| `isAirport` | boolean | Suma constante `DELTA_AEROPUERTO=12.000` (fija, **ya no lee `car_types.delta_aeropuerto`**) |
| `isScheduled` | boolean | Suma constante `DELTA_PROGRAMADO=4.800` (independiente de `isAirport`, ya no hay rama condicional) |
| `isProtocol` | boolean | Suma constante `DELTA_PROTOCOLO=5.000` |
| `tollsTotal` | número | Total peajes ya sumado (COP) |
| `parking` | número | Costo parqueadero (COP) |
| `isIntermunicipal` | boolean | Si true, usa columnas `*_inter` en vez de urbanas |

Las 3 constantes viven en `App/constants/fare.ts` (compartido con Web/backendRemoto), no en BD.

## Columnas de `car_types` consumidas

| Urbana | Intermunicipal | Tipo | Rol |
|--------|----------------|------|-----|
| `base_fare` | `base_fare_inter` | número | Tarifa fija arranque |
| `rate_per_unit_distance` | `rate_per_unit_distance_inter` | número | COP/km |
| `valor_hora` | — | número | **COP/hora**, fuente canónica del precio por minuto (`valor_hora / 60`) |
| `rate_per_hour` | `rate_per_hour_inter` | número | Fallback legacy si `valor_hora` ausente/0. ⚠️ es **COP/minuto**, no por hora |
| `min_fare` | `min_fare_inter` | número | Cobro mínimo |
| `convenience_fees` | — | número | Comisión (% o flat) |
| `convenience_fee_type` | — | `'flat'` o porcentaje | Tipo de comisión |
| `umbral_intermunicipal_km` | — | número (default 29, ver `DEFAULT_UMBRAL_INTERMUNICIPAL_KM`) | Umbral para flag intermunicipal |

`delta_aeropuerto` y `delta_aeropuerto_prog` **ya NO se consumen** en el
cálculo canónico — quedaron como columnas vestigiales en `car_types` desde el
refactor 2026-06-27. Siguen existiendo en el schema y en algunos fallbacks de
UI (`CreateReservationScreen.tsx`) pero no alimentan `FareCalculator`.

⚠️ **Comportamiento sin documentar hasta ahora:** si `isIntermunicipal=true`,
el precio por minuto derivado de `valor_hora` se **duplica** (`/0.5`) en vez
de leer un `valor_hora_inter` (no existe ese campo en BD). Ver
`FareCalculator.tsx:73-77`. Verificar con negocio si es la política correcta
o un supuesto no confirmado del refactor.

## Selección urbana vs intermunicipal

```ts
const pick = (urban, inter) =>
  isIntermunicipal && inter != null ? inter : urban;
```

Corregido en refactor 2026-06-27: antes usaba `inter` truthy (un `0` legítimo
caía a urbano). `isIntermunicipal` lo decide el llamador con
`distance_km > (rateDetails.umbral_intermunicipal_km || DEFAULT_UMBRAL_INTERMUNICIPAL_KM)`.
Constante unificada en `App/constants/fare.ts` (antes había fallbacks 29 y 50
km inconsistentes entre archivos — cerrado por Fix 6 de
[[22-plan-fix-bug-min-fare]]).

## Algoritmo paso a paso

```
1. Convierte y redondea todas las tarifas (Math.round + parseFloat):
   ratePerUnitDistance, ratePerMinute (valor_hora/60, o rate_per_hour
   legacy si valor_hora=0), baseFare, minFare, convenienceFees.

2. Si minFare<=0 → console.warn (visible en Sentry, categoría mal seedeada).

3. Si algún input es NaN → retorna { totalCost: 0, grandTotal: 0,
   clientTotal: 0, convenience_fees: 0 }.

4. sumaComponentes = round(ratePerUnitDistance × distance
                          + ratePerMinute × (time / 60))   // time/60 = minutos

5. if baseFare > 0:                        sumaComponentes += baseFare
6. if instructionData.parcelTypeSelected:  sumaComponentes += parcelType.amount
7. if instructionData.optionSelected:      sumaComponentes += option.amount

8. Recargos — conceptos independientes y aditivos (si coinciden, suman):
   if isAirport:    sumaComponentes += DELTA_AEROPUERTO   (12.000, constante)
   if isScheduled:  sumaComponentes += DELTA_PROGRAMADO   (4.800, constante)
   if isProtocol:   sumaComponentes += DELTA_PROTOCOLO    (5.000, constante)
   if tollsTotal>0: sumaComponentes += tollsTotal
   if parking>0:    sumaComponentes += parking

9. totalConductor = ceil(sumaComponentes / 100) * 100     // ROUNDUP centena PRIMERO
10. if totalConductor < minFare: totalConductor = minFare  // piso min_fare DESPUÉS del roundup

11. clientTotal = ceil(totalConductor × (1 + MARGEN_CLIENTE) / 100) * 100
                  // margen 25% SOBRE totalConductor post-roundup, no sobre rawTotal

12. convenienceFee:
    if convenience_fee_type === 'flat':
        convenienceFee = convenienceFees
    else:
        convenienceFee = round(totalConductor × convenienceFees / 100)

13. grand = totalConductor + convenienceFee
```

Orden roundup→min_fare y margen sobre post-roundup son el cambio principal
del refactor 2026-06-27 respecto a la versión previa de este documento (que
aplicaba min_fare antes del roundup y margen sobre `rawTotal` pre-roundup).

## Outputs

```ts
{
  totalCost: total,         // Precio conductor (rawTotal redondeado al 100 arriba)
  grandTotal: grand,        // Conductor + fee conveniencia
  clientTotal,              // Precio cliente final (margen 25%)
  convenience_fees: round(convenienceFee)
}
```

⚠️ **Decisión crítica:** `clientTotal` usa `rawTotal × 1.25`, NO `total × 1.25`.
Comentario del código:
> Usar `rawTotal` evita redondear doble (+$100 de error cuando suma no es múltiplo de 100).

## Pipeline de invocación real

### Lista de categorías (selección de vehículo) — `components/CarDetails.tsx:53-80`

```ts
const vehicle = { base_fare, rate_per_unit_distance, rate_per_hour, ... };
const distKm = parseFloat(distance) / 1000;        // viene en metros
const durMin = parseFloat(duration) / 60;          // viene en segundos
const isIntermunicipal = distKm > vehicle.umbral_intermunicipal_km;

const { grandTotal } = FareCalculator(
  distKm,
  durMin * 60,        // re-multiplica por 60 → entra en segundos otra vez
  vehicle,
  null,
  2,
  { isScheduled, isIntermunicipal }
);
// muestra grandTotal como `estimatedPrice` en la card
```

### Pricing con peajes — `components/CarDetails.tsx:92-118` (`getPrice`)

```ts
const tollsCost = tolls.reduce((acc, t) => acc + t.PriceToll, 0);
const isIntermunicipal = roundedDistance > (carType.umbral_intermunicipal_km || 29);

const { totalCost, grandTotal, clientTotal, convenience_fees } = FareCalculator(
  roundedDistance,
  durationMinutes * 60,
  carType,
  {},
  2,
  { isScheduled, isIntermunicipal, tollsTotal: tollsCost }
);
```

### Persistencia — `common/actions/saveBooking.ts`

Guarda en `bookings` columnas:
- `trip_cost = totalCost` (precio conductor)
- `total_cost` (calculado por trigger `calculate_total_cost` = `trip_cost + convenience_fees - discount`)
- `driver_share` (compartido conductor)
- `estimate` (estimado mostrado)

Ver [[17-esquema-bookings]] §Pago.

## Tests

`App/scripts/test-fare.js` — script Node que valida casos sintéticos contra
fórmula. Si tocas `FareCalculator`, corre ese antes de PR.

## Discrepancias entre canales

| Aspecto | App móvil (`car_types`) | Agente WhatsApp (`VehicleCategory` backend remoto) |
|---------|-------------------------|----------------------------------------------------|
| Columna base | `base_fare` | `base_fare` ✓ |
| Por km | `rate_per_unit_distance` | `valor_distancia` |
| Por minuto | `rate_per_hour` (engaña, es /min) | `valor_hora` (parece /h) |
| Mín | `min_fare` | `min_fare` ✓ |
| Aeropuerto | constante `DELTA_AEROPUERTO=12.000` en código (columnas BD `delta_aeropuerto`/`delta_aeropuerto_prog` vestigiales, ya no leídas) | vía BD `VehicleCategory` |
| Comisión | `convenience_fees` + `convenience_fee_type` | ❌ no existe |
| Intermunicipal | `*_inter` columnas + `umbral_intermunicipal_km` | ❌ no existe |
| Protocolo | flag context → +$5.000 fijo | ❌ no existe |
| Margen cliente | `× 1.25` hardcoded | ❌ no existe |
| Recargo programado sin aeropuerto | +$4.000 fijo | ❌ no existe |

**Conclusión:** la fórmula del Excel `board` está implementada **solo en el
móvil**. El agente WhatsApp NO calcula tarifa — por eso `Agente/llm-wiki/` deja
explícito *"el agente no registra servicios; la comparación se calcula durante
la reserva"*. La reserva ocurre en el backend VPS (no ingerido aquí) que
debería replicar este algoritmo o reusar el del móvil.

⚠️ **Riesgo operacional:** si admin cambia precios en `VehicleCategory`
(backend remoto) pero no en `car_types` (Supabase móvil), mismo viaje cuesta
distinto según canal. Ver [[10-deuda-tecnica]] §15 (nuevo ítem).

## Constantes hardcodeadas que viven solo en código

Todas centralizadas en `App/constants/fare.ts` desde el refactor 2026-06-27
(antes dispersas e inconsistentes por archivo):

| Constante | Valor | Fuente |
|-----------|-------|--------|
| Recargo aeropuerto | $12.000 COP | `DELTA_AEROPUERTO` |
| Recargo programado | $4.800 COP | `DELTA_PROGRAMADO` |
| Recargo protocolo | $5.000 COP | `DELTA_PROTOCOLO` |
| Margen cliente sobre `totalConductor` post-roundup | × 1.25 (`0.25`) | `MARGEN_CLIENTE` |
| Redondeo centena | `Math.ceil(x/100)*100` | `FareCalculator.tsx:127,131` |
| Umbral intermunicipal default | 29 km | `DEFAULT_UMBRAL_INTERMUNICIPAL_KM` |

Cambiar cualquiera requiere PR — no son parámetros de BD.

## Ejemplo numérico

Datos:
- `base_fare = 3.000`, `rate_per_unit_distance = 1.500`, `rate_per_hour = 80`
- `min_fare = 8.000`, `delta_aeropuerto = 12.000`, `convenience_fees = 500`
- `convenience_fee_type = 'flat'`
- distancia = 12 km, tiempo = 1.800 s (30 min)
- contexto: urbano, no aeropuerto, no programado, no protocolo, sin peajes

```
baseCalculated = round(1500 × 12 + 80 × 30) = 18000 + 2400 = 20400
                + 3000 (base_fare)         = 23400
rawTotal       = max(23400, 8000)          = 23400
total          = ceil(23400/100) × 100     = 23400 (ya múltiplo)
convenienceFee = 500 (flat)
grand          = 23400 + 500 = 23900       ← precio conductor + fee
clientTotal    = ceil(23400 × 1.25 / 100) × 100
               = ceil(29250 / 100) × 100
               = ceil(292.5) × 100
               = 293 × 100 = 29300         ← precio cliente
```

## Actualización 2026-06-27 — Alineación al modelo canónico

Refactor del motor móvil para igualar al de Web Dashboard (`28-tarifa-web-dashboard` (ver LLMWIKITmasPlus/ raíz del workspace, no existe en esta copia)) y backendRemoto Agente ([[27-tarifa-backendremoto-agente]]).

### Cambios aplicados a `FareCalculator.tsx`
- **`pick()`** ahora usa `inter != null` (no truthy) — `0` legítimo no cae a urbano.
- **Precio por minuto** derivado de `valor_hora / 60` (fuente canónica). Fallback a `rate_per_hour` legacy si `valor_hora=0`.
- **Constantes oficiales** importadas de `App/constants/fare.ts` (`DELTA_AEROPUERTO=12000`, `DELTA_PROGRAMADO=4800`, `DELTA_PROTOCOLO=5000`, `MARGEN_CLIENTE=0.25`).
- **`DELTA_PROGRAMADO` 4000→4800** alineado con Excel oficial (era hardcode con valor erróneo).
- **Conceptos independientes**: `airport`, `programado`, `protocolo` se suman naturalmente. Eliminada rama `isAirport ? delta_aeropuerto_prog : 4000`.
- **min_fare aplicado DESPUÉS de ROUNDUP centena** (alineado con backendRemoto, antes antes-roundup).
- **Margen 25% sobre `totalConductor` post-roundup** (alineado con Excel `Tapa!F14`, antes sobre `rawTotal`).
- **Warn cuando `min_fare<=0`** — alerta categoría mal seedeada (visible en Sentry).
- **Early return incluye `clientTotal: 0`** (antes undefined).

### Output retorna 4 campos
```ts
{
  totalCost,     // precio conductor (post-roundup, post-min)
  grandTotal,    // totalCost + convenience fee
  clientTotal,   // ceil(totalCost × 1.25 / 100) * 100
  convenience_fees
}
```

### Aeropuerto: detección Haversine
Nuevo módulo `App/common/utils/airports.{ts,json}` portado de [[27-tarifa-backendremoto-agente]] (40 aeropuertos Colombia, radio 1 km, bbox pre-filter). Reemplaza string-matching `.includes("Aero")` en:
- `BookingScreen.tsx` (helper `detectAirport()` reutilizado 4×)
- `CreateReservationScreen.tsx`
- `TripPreviewScreen.tsx`
- `sharedFunctions.ts`

### `BookingScreen.tsx pendingBookingRef` corregido
Antes:
```ts
estimate: estimate,    // ← variable undefined (BUG-1)
trip_cost: estimate,   // ← undefined → trigger pisa total_cost a fees
```
Después:
```ts
estimate: fd.estimateFare,
trip_cost: fd.totalCost,
convenience_fees: fd.convenienceFees,
driver_share: fd.driverShare,
discount: promoDiscount || 0,
promo_applied: !!selectedPromo,
promo_code: selectedPromo?.promo_code || null,
promo_details: selectedPromo || null,
```

Cierra BUG-1, BUG-3 del plan [[22-plan-fix-bug-min-fare]].

## Actualización 2026-06-27 (2) — "Cobro inicial" = mínimo del rango

Alineación con web (`28-tarifa-web-dashboard` (ver LLMWIKITmasPlus/ raíz del workspace, no existe en esta copia) §Implementación 3): el cobro inicial es el **mínimo** del rango (`totalCost` = precio conductor). El máximo (`clientFare` = `totalCost × 1.25`) queda como estimación superior; sistema puede ajustar al finalizar servicio dentro del rango.

### Estado semántico móvil
Móvil ya cotizaba al mínimo por diseño: `getVehiclePrice` retorna `grandTotal = totalCost + convenienceFee`. Solo faltaba corregir `estimate` persistido y añadir nota UI.

### Cambio `pendingBookingRef` (BookingScreen.tsx:881)
```ts
// Antes:
estimate: fd.estimateFare,   // = grandTotal (mínimo + fee)
// Después:
estimate: fd.clientFare,     // = clientTotal (máximo esperado, referencia)
```

`trip_cost = fd.totalCost` (mínimo) sin cambio — ya estaba bien.
`driver_share = fd.driverShare = totalCost` (mínimo) sin cambio.

### Nota UI cerca del precio ajustable
```
Cobro inicial estimado. Puede ajustarse al finalizar el servicio.
Rango: $52.700 – $65.900
```

Muestra ambos extremos + explicación al cliente.

### Coherencia cross-canal
| Canal | Cobra al inicio | Estimación máxima | Nota al cliente |
|-------|----------------|-------------------|-----------------|
| Web `/addbooking` | totalConductor | valorCliente | "Puede ajustarse al finalizar el servicio según la ruta real." |
| Móvil `BookingScreen` | totalCost | clientFare | "Cobro inicial estimado. Puede ajustarse al finalizar el servicio." |
| WhatsApp backend | rango_min | rango_max | rango visible en mensaje |

Los tres canales exponen semántica idéntica.

## Actualización 2026-07-04 — Bug: flujo "Reservar" duplicaba recargos

Auditoría encontró una **cuarta ruta de cálculo** no documentada hasta ahora,
paralela a `FareCalculator` dentro del mismo archivo: el botón secundario
"Reservar" (viaje programado) en `BookingScreen.tsx` (~línea 1303-1309, antes
del fix) no llamaba `FareCalculator`. En vez de eso:

```ts
// ANTES (bug):
const baseFare = fareDetails.estimateFare;  // YA incluye delta aeropuerto+programado
const deltaAerop = isAirportNav ? (selectedVehicle?.delta_aeropuerto || 0) : 0;   // se suma OTRA VEZ
const deltaProg  = isScheduled  ? (selectedVehicle?.delta_aeropuerto_prog || 0) : 0;
const driverP = roundPrice(baseFare * mult + deltaAerop + deltaProg);
const clientP = Math.ceil(driverP / 0.8 / 100) * 100;   // sin piso min_fare
```

Problemas:
1. **Doble cobro** de recargo aeropuerto/programado — `fareDetails.estimateFare`
   (`grandTotal`) ya sale de `FareCalculator` con esos recargos aplicados.
2. Leía `selectedVehicle.delta_aeropuerto` / `delta_aeropuerto_prog` de BD —
   columnas vestigiales que el motor canónico ya no consume (ver arriba), por
   lo que podían estar desactualizadas vs. `DELTA_AEROPUERTO=12.000` real.
3. Sin piso `min_fare` — un viaje muy corto reservado podía cobrar menos del
   mínimo configurado.
4. `/0.8` en vez de `× 1.25` sobre `totalConductor` post-roundup, aplicado
   directo sobre un valor ya inflado por (1) y (2) — triple desviación.

Resultado: mismo viaje costaba distinto si el cliente pedía "Solicitar Viaje"
(inmediato, correcto) vs "Reservar" (programado, con recargo duplicado).

**Fix aplicado:** el botón "Reservar" ahora llama `FareCalculator` directo
(mismo patrón que `getVehiclePrice`), multiplicando `distance`/`time` por
`mult` (Ida y Vuelta) **antes** de la llamada — así los recargos fijos
(aeropuerto/programado/protocolo) no se duplican por el multiplicador de ida
y vuelta, y hereda ROUNDUP + piso `min_fare` + margen 25% correctos.

## Actualización 2026-07-04 (2) — Bug bloqueante: `addActualsToBooking` nunca leía tracking real

Al preparar pruebas manuales del fix de recálculo al finalizar viaje
(desvíos, ver bitácora sesión 3), se encontró que `addActualsToBooking`
(`sharedFunctions.ts`) hacía:

```ts
.select('lat, lng, timestamp')
.order('timestamp', { ascending: true })
```

`booking_tracking` **no tiene columna `timestamp`** (solo `created_at`/
`updated_at`, confirmado contra `App/supabase/BBDDRemota.sql:139-150`).
PostgREST rechaza el select por columna inexistente → la llamada devuelve
error, pero el código no lo chequeaba (`const { data: trackingRows } = ...`)
→ `trackingRows` quedaba `undefined` → `(trackingRows || [])` → array vacío
→ **`distance` siempre daba 0 y `coords` siempre vacío, sin ningún error
visible.** Esto habría invalidado silenciosamente todo el fix de la sesión
(3) — la app hubiera seguido sin recalcular distancia real en ningún canal
que use esta función (reserva Y viaje inmediato).

**Fix:** `select('lat, lng, created_at')` + `.order('created_at', ...)`,
más chequeo explícito de `error` con `console.error` para que un fallo futuro
similar sea visible en logs en vez de silencioso.

## Actualización 2026-07-04 (3) — Bug: `valor_hora` no llegaba a `FareCalculator` en 3 de 4 callers

Auditoría cruzada web vs móvil (mismo viaje, misma distancia/tiempo tras
unificar a Mapbox, ver [[26-comparativa-canales-pricing]]) seguía dando
precios distintos: web `$60.900–$76.200`, móvil `$57.100–$71.400` (categoría
XPlus, intermunicipal, con aeropuerto). Verificado con datos reales de
`car_types` que la fórmula de la web es exacta. La causa: **`valor_hora` no
llegaba a `FareCalculator`** en la mayoría de los callers móviles.

`FareCalculator.tsx` deriva el precio/minuto de `valor_hora / 60` (fuente
canónica, con doblado `/0.5` si intermunicipal) — y solo cae al fallback
legacy `rate_per_hour`/`rate_per_hour_inter` (sin doblado) si
`rateDetails.valor_hora` es `0`/`undefined`. Encontrados **3 de 4 lugares**
que construyen el objeto `rates`/`vehicle` para `FareCalculator` sin copiar
`valor_hora`, aunque en algunos casos el query sí lo trae:

| Archivo | `select` trae `valor_hora`? | Objeto mapeado lo incluye? | Estado |
|---|---|---|---|
| `BookingScreen.tsx` (inmediato) | ✅ | ✅ | Correcto — por eso la 1ª prueba (TaxiPlus, vía esta pantalla) coincidió con la web |
| `CreateReservationScreen.tsx` (reserva) | ❌ (ni en el `.select(...)`) | ❌ | **Bug — causa de esta divergencia** |
| `sharedFunctions.ts` `addActualsToBooking` (recálculo al finalizar) | ✅ (`select('*')`) | ❌ | Bug — recálculo al finalizar también usaba legacy |
| `CarDetails.tsx` (componente inerte, ver [[10-deuda-tecnica]] #28) | ✅ (`select('*')`) | ❌ | Bug de hygiene, sin impacto (componente muerto) |

**Fix:** agregado `valor_hora` al `.select(...)` y al objeto de tarifas
mapeado en `CreateReservationScreen.tsx`, `sharedFunctions.ts` y
`CarDetails.tsx`. `DEFAULT_VEHICLE_RATES` (fallback offline hardcoded en
`CreateReservationScreen.tsx:46-50`, usado solo si Supabase no responde) se
dejó **sin** `valor_hora` a propósito — caso de emergencia raro, fuera de
alcance.

**✅ Verificado por el usuario en emulador real** (mismo viaje, categoría
XPlus, intermunicipal, con aeropuerto): móvil pasó de $57.100–$71.400 a
$60.900–$76.200, ahora idéntico a la web. Cierra la divergencia completa
entre canales (ruteo unificado a Mapbox en sesión 2 + `valor_hora` corregido
aquí).

## Actualización 2026-07-04 (4) — Auditoría de redondeo: motor OK, 3 hallazgos en pantallas de rango

Usuario pidió validar que el "precio estimado" y "rango estimado" redondean
correctamente tanto al crear la reserva como al finalizar el servicio.

**Motor central (`FareCalculator`) — correcto y verificado:**
```
1. ROUNDUP centena:  totalConductor = ceil(suma/100)*100
2. Piso min_fare:    if totalConductor < minFare: totalConductor = minFare   (sin re-redondear)
3. Margen cliente:   clientTotal = ceil(totalConductor*1.25/100)*100
```
Idéntico a la web (`AddBookingPage.tsx`), incluyendo el detalle de que el
piso `min_fare` (paso 2) **no** se re-redondea a centena — si `min_fare` no
es múltiplo de 100 (ej. TaxiPlus=$8.880), el total queda en $8.880 tal cual.
Así lo hace la web también. Correcto por diseño, no es un bug.

**Bug de código encontrado y corregido — `ratePerMinute` redondeado de más:**
`FareCalculator.tsx` hacía `Math.round(valorHora/60(/0.5 si inter))` antes de
multiplicar por los minutos. La web (`AddBookingPage.tsx`) nunca redondea ese
valor intermedio. Para categorías cuyo `valor_hora/60` no cae en entero
exacto (ej. XPlus: `20000/60/0.5=666.667`), esto podía (no siempre, depende
de si cruza el límite de ROUNDUP-100) producir un total distinto entre
canales. **Fix:** quitado el `Math.round` prematuro en la rama `valorHora>0`.

**Hallazgo — doble redondeo cosmético (`roundPrice`, $50 más cercano):**
`hooks/roundPrice.ts` se aplica sobre valores YA redondeados por
`FareCalculator` en varias pantallas de display (`BookingScreen.tsx`,
`PaymentDeais.tsx`, `ActiveBookingScreen.tsx`, `BookingCabScren.tsx`). Inocuo
si el valor ya es múltiplo de 100 (caso normal), pero si el piso `min_fare`
no lo es (ej. $8.880), la pantalla puede mostrar $8.900 mientras lo
realmente cobrado/persistido es $8.880. Desfase cosmético ≤$100, no
corregido en esta sesión (bajo impacto, requeriría tocar 4+ pantallas por un
caso borde).

**Bug corregido — `BookingCabScren.tsx:2282-2286` (rango fabricado):**
Pantalla "esperando conductor" (activa, post-creación de reserva) mostraba
`trip_cost` a `trip_cost + $7.000 fijo`, sin relación con el margen real del
25% (`estimate`/`clientFare`). Para un viaje de $108.300 mostraba techo
$115.300 en vez de $135.400 real (subestimaba ~$20.000). **Fix:** usa
`currentBooking.estimate` (clientFare real) como techo, con fallback a
`trip_cost` si `estimate` no viene poblado.

**Bug corregido — `BookingsView.tsx` (lista de solicitudes del conductor,
`index.tsx:3125`, pantalla activa):**
1. `roundPrice(calculateEstimatedCost(...))` — pasaba un **string**
   (`"$X - $Y"`) a una función que espera número → renderizaba `NaN` en
   pantalla. El conductor veía "NaN" como costo estimado de cada solicitud
   entrante.
2. `calculateEstimatedCost` fabricaba un rango con **+30%** (no 25%) y un
   **+$5.000 "hora pico"** inventado, sin relación con `FareCalculator`.
3. `determineTripType` clasificaba urbano/intermunicipal con un
   bounding-box hardcodeado a **Bogotá** (`lat 4.5-4.8, lng -73.9/-74.2`) —
   cualquier viaje en otra ciudad (ej. Itagüí/Rionegro, usado en las pruebas
   de esta sesión) se etiquetaba mal como "Urbano".

**Fix:** `calculateEstimatedCost` ahora usa `trip_cost`/`estimate` reales de
la reserva (mismo patrón que las demás pantallas). `determineTripType` ahora
clasifica por `distancia > umbral_intermunicipal_km` (default 29km,
`DEFAULT_UMBRAL_INTERMUNICIPAL_KM`), igual que el motor real — sin
bounding-box, válido en cualquier ciudad.

**Sin corregir, documentado como ruido esperado — divergencia de ~$100
entre canales incluso con misma categoría/distancia/tiempo aparente:**
Web y móvil hacen **llamadas independientes** a Mapbox Directions en
momentos distintos (segundos de diferencia). Tráfico en vivo puede mover el
km/tiempo lo suficiente para cruzar el límite de ROUNDUP-100 en un canal y
no en el otro. No es reproducible ni corregible sin cambiar arquitectura
(una sola fuente de ruta compartida entre canales, ej. backend calcula la
ruta una vez y la sirve a ambos). Tolerancia esperada: hasta $100 en
`totalConductor`, hasta $100-200 en `clientTotal` (efecto de la ceil-100
sobre el margen).

## Fuentes
- `App/common/actions/FareCalculator.tsx` (algoritmo completo)
- `App/components/CarDetails.tsx:53-118` (invocación y selección urbana/intermunicipal)
- `App/app/(tabs)/CreateReservationScreen.tsx`, `BookingScreen.tsx` (consumo en UI)
- `App/common/other/sharedFunctions.ts` (utilidades comparativas)
- `App/app/Booking/BookingCabScren.tsx` (pantalla "esperando conductor")
- `App/components/BookingsView.tsx` (lista de solicitudes entrantes del conductor)
- `App/hooks/roundPrice.ts` (redondeo de display, distinto al del motor)
- `App/scripts/test-fare.js` (suite de prueba)
- `App/sql/bookings-schema.sql` (columnas `trip_cost`, `total_cost`, trigger `calculate_total_cost`)
- `Agente/llm-wiki/00-RAW/tablasDeWhatsapp.md` (esquema paralelo `VehicleCategory`)
