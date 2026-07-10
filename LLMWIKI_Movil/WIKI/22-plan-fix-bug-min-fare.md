# Plan de fix — Bug "cliente paga menos que `min_fare`"

> Auditoría del flujo de cálculo de tarifa en app móvil. Causa raíz
> identificada y plan de remediación. Pendiente: confirmar política pricing
> contra Excel `Base para Agente T+Plus.xlsm`.

---
tags: [plan, bug, tarifa, dominio, deuda]
entidades: [FareCalculator, BookingScreen, saveBooking, calculate_total_cost]
---

## Contexto

Reportes operacionales: hay servicios donde el cliente paga menos que el
`min_fare` configurado por categoría. Matemáticamente imposible si todo pasa
por [[21-calculo-tarifa]] con datos correctos. Auditoría reveló ruta de
persistencia rota que evade el algoritmo.

**Intención del fix:** garantizar invariante `bookings.total_cost ≥ car_types.min_fare` para toda reserva nueva.

**Scope confirmado:** fix completo (7 fixes + tests + unificación de umbral). Reservas históricas: solo identificar, sin ajuste contable.

**⚠️ Hallazgo nuevo (2026-06-27):** El **dashboard web también sufre el mismo bug por causa distinta**. `AplicacionWebTmasplus/.../AddBookingPage.tsx` calcula `total_cost = fare` correctamente pero `BookingsService.create` payload **NO incluye `trip_cost`** → trigger SQL pisa `total_cost = 0 + convenience_fees`. Plan paralelo en `28-tarifa-web-dashboard` (ver LLMWIKITmasPlus/ raíz del workspace, no existe en esta copia).

**Scope ampliado:** plan cubre los 2 canales digitales (móvil + web). Fix 2 (trigger SQL con piso) los resuelve simultáneamente. Fixes específicos por canal listados en cada sección.

---

## Hallazgos confirmados

### 🔴 BUG-1 — Variable `estimate` no declarada (causa raíz)

`App/app/(tabs)/BookingScreen.tsx:866` y `:877`:
```ts
estimate: estimate,                   // ← undefined
trip_cost: estimate,                  // ← undefined
```
Grep confirma: solo dos referencias, ninguna declaración (`const|let|var|=`). JS la rescata como `undefined`.

Cadena del bug:
1. `pendingBookingRef.current` (líneas 837-883) guarda `estimate: undefined`, `trip_cost: undefined`.
2. `saveBooking.ts:54-55`: `parseFloat(undefined) || 0 = 0`. Persiste `trip_cost=0`, `estimate=0`.
3. Trigger SQL `calculate_total_cost` (`bookings-schema.sql:252-266`): `total_cost = 0 + fee - 0 = fee`.
4. Cliente paga **solo la comisión** (típicamente $500).

`fareDetails` existe en estado (`BookingScreen.tsx:503-509`) con `estimateFare`,
`clientFare`, `totalCost`, `convenienceFees`, `driverShare` — calculados por
`FareCalculator` con `min_fare` aplicado. **No se pasa al ref**.

### 🔴 BUG-2 — Trigger SQL sin piso `min_fare`

`App/sql/bookings-schema.sql:252-266`:
```sql
NEW.total_cost := COALESCE(NEW.trip_cost, 0)
                + COALESCE(NEW.convenience_fees, 0)
                - COALESCE(NEW.discount, 0);
```
Sin validar `min_fare`. Aun resolviendo BUG-1, un descuento manual o promo
agresiva puede dejar `total_cost < min_fare`.

### 🔴 BUG-3 — `discount` UI no persiste

`BookingScreen.tsx:1168` muestra precio descontado en pantalla. Pero
`pendingBookingRef.current` nunca setea `discount`, `promo_applied`,
`promo_code`, `promo_details`. La UI **miente** al cliente: ve descuento, paga
completo.

### ⚠️ TRAMPA-1 — `pick()` con evaluación falsy

`FareCalculator.tsx:42-43`:
```ts
const pick = (urban, inter) => isIntermunicipal && inter ? inter : urban;
```
Si `inter === 0` (legítimo), cae a urbano. Correcto: `inter != null`.

### ⚠️ TRAMPA-2 — Defaults peligrosos en `min_fare`

`FareCalculator.tsx:55-57`: `parseFloat(... || 0)`. Si categoría tiene `null` en
BD, piso = 0. Bug silencioso si admin olvida configurar categoría.

### ⚠️ TRAMPA-3 — Umbral intermunicipal inconsistente

- `App/common/other/sharedFunctions.ts:94` → **50 km** hardcoded
- `App/app/(tabs)/BookingScreen.tsx:519` → **29 km** fallback
- `App/components/CarDetails.tsx:101` → **29 km** fallback
- `FareCalculator.tsx:16` comentario → **50 km**

Tres fuentes de verdad → reservas en rango 29-50 km clasifican distinto según
consumidor.

---

## Plan de fix

### Fix 1 — Asignar `fareDetails` al `pendingBookingRef`

`App/app/(tabs)/BookingScreen.tsx` líneas 866 y 877.

Sustituir variable `estimate` no declarada por `fareDetails.*`. Añadir campos
de promo + min_fare_snapshot. Eliminar referencia rota.

### Fix 2 — Trigger SQL pone piso `min_fare`

**✅ Cerrado 2026-07-04.** Aplicado directo en Supabase (no versionado como
archivo `.sql` — `App/sql/` nunca existió en el repo):
1. `ALTER TABLE bookings ADD COLUMN min_fare_snapshot numeric(10,2);` — hecho.
2. `saveBooking.ts` + `BookingScreen.tsx` (móvil inmediato) y
   `CreateReservationScreen.tsx` (reservas) ahora pasan `min_fare_snapshot`
   poblado desde `car_types.min_fare`/`vehicleRates[carType].min_fare` al insert.
3. Trigger `calculate_total_cost()` reemplazado — verificado 1:1 contra
   `pg_get_functiondef` antes de reemplazar (sin lógica oculta):
   ```sql
   NEW.total_cost := GREATEST(
     COALESCE(NEW.trip_cost, 0) + COALESCE(NEW.convenience_fees, 0) - COALESCE(NEW.discount, 0),
     COALESCE(NEW.min_fare_snapshot, 0)
   );
   ```
4. Snapshot evita problemas si admin cambia `car_types.min_fare` después.

⚠️ Web (`AplicacionWebTmasplus`) **no** se tocó en esta sesión — confirmar si
su insert ya pasa `min_fare_snapshot` o queda pendiente (ver Fix W-2 abajo).

### Fix 3 — Persistir promo

Cubierto por Fix 1 (mismo objeto). Añadir `discount`, `promo_applied`,
`promo_code`, `promo_details`.

### Fix 4 — `pick()` correcto

`FareCalculator.tsx:42-43`: `isIntermunicipal && inter != null ? inter : urban`.

### Fix 5 — Alerta `min_fare` ausente

`FareCalculator.tsx` tras línea 70:
```ts
if (minFare <= 0) {
  console.warn('[FareCalculator] min_fare=0 o ausente para categoría', rateDetails.id ?? rateDetails.name);
}
```
Visible en Sentry.

### Fix 6 — Unificar umbral intermunicipal

`App/constants/fare.ts` nuevo:
```ts
export const DEFAULT_UMBRAL_INTERMUNICIPAL_KM = 29;
```
Reemplazar hardcode 50 km en `sharedFunctions.ts`, 29 km fallback en
`BookingScreen.tsx` y `CarDetails.tsx`, ajustar comentario en
`FareCalculator.tsx:16`. Mantener preferencia
`rateDetails.umbral_intermunicipal_km` cuando exista.

### Fix 7 — Test del invariante

`App/scripts/test-fare.js`:
- Caso distancia mínima cae al piso: assert `clientTotal >= min_fare`.
- Caso discount agresivo + piso: assert `total_cost = min_fare_snapshot`.

`App/sql/test-min-fare-floor.sql` — test SQL del trigger.

---

## Decisión arquitectónica — RESUELTA (2026-06-26)

Auditoría completa del Excel en [[23-modelo-pricing-excel-oficial]] +
implementación referencia Python en [[24-sistema-calculo-python]] + RPC SQL
canónica en [[25-rpc-calcular-tarifa]] confirman:

**Opción C es la correcta.**

```
trip_cost = total_conductor   (precio que recibe conductor)
cliente   = total_conductor × 1.25 (ROUNDUP centena)
margen 25% = ganancia plataforma (Erixon), NO comisión adicional al cliente
```

Fórmula oficial (Excel `Tapa!F11..F14`):
- `F11 Valor Conductor = board!J25` (subtotal cliente bruto, post-ROUNDUP centena, con piso min_fare).
- `F13 = F11 × 1.25`.
- `F14 Valor Cliente = ROUNDUP(F13, -2)`.
- `H14 Ganancia Erixon = F14 - F11`.

Comisiones empresariales (`J27..J34`) son path separado para `es_empresarial=true`.
Cliente retail NO ve comisiones encima.

### Implicación para el fix

- Fix 1: `pendingBookingRef.trip_cost = fareDetails.totalCost` (precio conductor).
- `bookings.estimate = fareDetails.clientFare` (precio cliente mostrado).
- Trigger SQL pierde sentido como "total_cost = trip_cost + fees - discount" para retail.
  Para retail puro: `total_cost = ROUNDUP(trip_cost × 1.25)`. Para empresarial: fórmula actual.
- Discriminar en trigger por flag `is_corporate` o existencia de `convenience_fees > 0`.

### Discrepancia móvil vs Python/RPC

Móvil aplica margen sobre `rawTotal` (pre-roundup) "para evitar doble redondeo".
Python/RPC aplican sobre `total_conductor` (post-roundup, post-min).
Hasta 100 COP de gap por servicio en valores no múltiplos de 100.

**Recomendación complementaria:** alinear móvil al modelo Python/RPC
(post-roundup). Ver [[26-comparativa-canales-pricing]] §Caso B.

### Recomendación estratégica (no en este fix, pero registrar)

App móvil debería invocar `supabase.rpc('calcular_tarifa', ...)`
([[25-rpc-calcular-tarifa]]) en lugar de `FareCalculator.tsx` local. Una sola
fuente de verdad, cero divergencia con WhatsApp.

**Precondición descubierta tras ingesta backendRemoto:**
[[27-tarifa-backendremoto-agente]] muestra que la RPC SQL actual está
**atrasada** respecto a backendRemoto (que ya corrige Δ Aeropuerto,
combinación aeropuerto+programado, Por Hora escala, auto-cobertura).

Antes de que móvil migre a la RPC, **portar el algoritmo de `backendRemoto/engine.py` a `003_functions.sql`**. Si móvil migra a la RPC actual, hereda los 4 bugs ya corregidos en backendRemoto.

---

## Fixes específicos canal web

### Fix W-1 — Persistir `trip_cost` en payload web
`AplicacionWebTmasplus/TmasPlus_webSite/src/services/bookings.service.ts:166-207`. Añadir `trip_cost: input.total_cost` al objeto payload.

### Fix W-2 — Pasar `min_fare_snapshot` desde web
Mismo patrón que móvil. `AddBookingPage.tsx:236` agregar al `BookingsService.create` el campo `min_fare_snapshot: cat.min_fare`. Servicio lo persiste.

### Fix W-3 — Confirmar política con operaciones
¿Web crea reservas retail o empresariales? Si retail, añadir margen 25% + ROUNDUP centena. Si empresariales, añadir procesamiento/IVA/seguro/hosting/PayU. Hoy hace mezcla simplificada sin coincidir con ningún canal.

### Fix W-4 — UI flags aeropuerto y protocolo
Añadir toggles en `AddBookingPage.tsx`. Sin estos flags, viajes al aeropuerto subcobran $12 000 COP.

### Fix W-5 — Corregir `schedulingSurcharge`
```ts
schedulingSurcharge = isAirport ? cat.delta_aeropuerto_prog : 4000;
```
En vez de aplicar 4 800 a cualquier programación.

### Fix W-6 — Migrar a RPC compartida (estratégico)
Web y móvil invocan `supabase.rpc('calcular_tarifa', ...)` (versión actualizada con mejoras backendRemoto). Eliminar cálculo local en ambos canales.

Detalle completo en `28-tarifa-web-dashboard` (ver LLMWIKITmasPlus/ raíz del workspace, no existe en esta copia).

## Archivos a modificar

1. `App/app/(tabs)/BookingScreen.tsx` — líneas 866-883 (`pendingBookingRef`).
2. `App/common/actions/FareCalculator.tsx:42-43` — `pick()` con `!= null`.
3. `App/common/actions/FareCalculator.tsx:~70` — warn `min_fare<=0`.
4. `App/common/actions/saveBooking.ts:53-58` — añadir `min_fare_snapshot`.
5. `App/sql/fix-total-cost-min-fare-floor.sql` — nuevo: ALTER + trigger.
6. `App/sql/test-min-fare-floor.sql` — nuevo: test invariante.
7. `App/common/other/sharedFunctions.ts:94` — leer constante.
8. `App/components/CarDetails.tsx:101` — leer constante.
9. `App/constants/fare.ts` — nuevo: `DEFAULT_UMBRAL_INTERMUNICIPAL_KM`.
10. `App/scripts/test-fare.js` — test invariante.

### Web (nuevo scope)
11. `AplicacionWebTmasplus/.../src/services/bookings.service.ts:166-207` — añadir `trip_cost` y `min_fare_snapshot` al payload.
12. `AplicacionWebTmasplus/.../src/pages/AddBooking/AddBookingPage.tsx:130-191` — corregir `schedulingSurcharge`, añadir flags aeropuerto/protocolo, considerar margen 25% según política.
13. (Estratégico) — eliminar `handleCalculate` local y migrar a `BookingsService.calcularTarifaRPC()` que invoca `supabase.rpc('calcular_tarifa', ...)`.

---

## Verificación end-to-end

1. **Unit test:** `npm test scripts/test-fare.js` con `min_fare=8000`, distancia 0.1 km → assert `clientTotal >= 8000`.
2. **Integration manual:** abrir BookingScreen, distancia ~500m → crear reserva → consultar `SELECT trip_cost, total_cost, min_fare_snapshot FROM bookings ORDER BY created_at DESC LIMIT 1`.
3. **Auditoría retroactiva (solo identificar):**
   ```sql
   SELECT b.id, b.reference, b.total_cost, b.car_type, b.created_at,
          (SELECT min_fare FROM car_types ct WHERE ct.name = b.car_type) AS expected_min,
          (SELECT min_fare FROM car_types ct WHERE ct.name = b.car_type) - b.total_cost AS diferencia
   FROM bookings b
   WHERE b.created_at > NOW() - INTERVAL '90 days'
     AND b.total_cost < (SELECT min_fare FROM car_types ct WHERE ct.name = b.car_type)
   ORDER BY diferencia DESC;
   ```
   Exportar CSV → entregar a operaciones. Sin ajustes automáticos.
4. **Sentry watch:** log `[FareCalculator] min_fare=0` por 1 semana post-deploy.
5. **Test promo:** aplicar 50% en BookingScreen → confirmar `discount` se persiste y `total_cost = min_fare_snapshot`.

---

## Riesgos

- **Cambio semántica `trip_cost`**: rompe reportes/dashboards históricos. Mitigación: vista compatibilidad.
- **Migración `min_fare_snapshot`**: reservas históricas sin valor → trigger usa `COALESCE(...,0)`, mantiene comportamiento actual. No retro-corrige.
- **Trigger con piso rechaza descuentos legítimos corporativos**: añadir flag `force_no_min_fare BOOLEAN` o exigir update post-insert.
- **Variable `estimate` puede ser closure de scope superior**: verificar imports/HOCs antes de eliminar. Grep solo cubre el archivo local.

## Fuentes
- `App/app/(tabs)/BookingScreen.tsx` líneas 503-509 (fareDetails), 837-883 (pendingBookingRef)
- `App/common/actions/FareCalculator.tsx` (algoritmo completo)
- `App/common/actions/saveBooking.ts` líneas 14-98 (payload Supabase)
- `App/sql/bookings-schema.sql` líneas 252-266 (trigger `calculate_total_cost`)
- `App/common/other/sharedFunctions.ts` línea 94 (umbral hardcoded 50 km)
- `App/components/CarDetails.tsx` línea 101 (umbral fallback 29 km)
- `Desarrolllo SpApW-Tplus0001.xlsx` (raíz, pendiente verificar contra `Base para Agente T+Plus.xlsm`)
- [[21-calculo-tarifa]] (algoritmo paso a paso)
- [[17-esquema-bookings]] (esquema y triggers)
- [[10-deuda-tecnica]] §15, §16 (deuda relacionada)
