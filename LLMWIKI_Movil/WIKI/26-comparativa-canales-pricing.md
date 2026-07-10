# Comparativa de canales — cálculo de tarifa

> Tres implementaciones paralelas del mismo modelo. Diferencias documentadas
> casos donde divergen. Causa raíz de inconsistencias operacionales entre
> WhatsApp ↔ móvil ↔ Excel.

---
tags: [pricing, comparativa, divergencia, deuda]
entidades: [FareCalculator, tarifa_engine, calcular_tarifa, board]
---

## Cinco fuentes paralelas

| Canal | Implementación | Audiencia |
|-------|----------------|-----------|
| **Operador manual** | Excel `Base para Agente T+Plus.xlsm` hoja `board` | Operador interno cotiza |
| **Sistema de cálculo Python (raíz)** | `sistema_calculo/tarifa_engine.py` | Microservicio referencia |
| **RPC SQL Supabase** | `calcular_tarifa()` en `sistema_calculo/sql/003_functions.sql` | Invocable desde cualquier cliente |
| **App móvil cliente/conductor** | `App/common/actions/FareCalculator.tsx` | Cliente y conductor app |
| **backendRemoto Agente WhatsApp** | `Agente/backendRemoto/src/domains/booking/tarifa/engine.py` | Cliente final vía WhatsApp (producción) |

Ver [[23-modelo-pricing-excel-oficial]], [[24-sistema-calculo-python]],
[[25-rpc-calcular-tarifa]], [[21-calculo-tarifa]].

## Matriz de divergencias

| Aspecto | Excel `board` | Python `tarifa_engine` | RPC SQL `calcular_tarifa` | App móvil `FareCalculator` |
|---------|---------------|------------------------|---------------------------|-----------------------------|
| Aplica `min_fare` | ❌ calcula F25 pero no compara | ✅ `if total < min: total = min` post-roundup | ✅ igual Python | ✅ `rawTotal = max(suma, min)` pre-roundup |
| Base del margen 25% | `J25` (post-roundup) | `total_conductor` (post-roundup, post-min) | igual Python | `rawTotal` (pre-roundup, pre-min check) |
| Δ Aeropuerto | 10 000 hardcode board | 10 000 hardcode `DELTA_AEROPUERTO` | 10 000 hardcode RPC | Lee `car_types.delta_aeropuerto` (=12 000) |
| Δ Programado sin aeropuerto | 4 000 hardcode | 4 000 hardcode | 4 000 hardcode | 4 000 hardcode |
| Δ Programado con aeropuerto | suma 10 000+4 000, **ignora** Tabla `M=4 800` | igual | igual | usa `delta_aeropuerto_prog` BD |
| Δ Protocolo | 5 000 hardcode | 5 000 hardcode | 5 000 hardcode | 5 000 hardcode |
| Modo "Por Hora" >1h | ❌ `F19×60` fijo | ❌ `precio_min × 60` fijo | ❌ igual | (No expone modo Por Hora) |
| Ida y Vuelta | ❌ sin efecto | ❌ sin efecto | ❌ sin efecto | ✅ `mult = 2` en `getVehiclePrice` |
| Auto Urbano↔Inter por 29 km | ❌ entrada manual | depende del caller (no en engine) | depende del caller | ✅ `distKm > umbral` en `CarDetails`/`BookingScreen` |
| Umbral intermunicipal | manual (sin valor) | manual (sin valor) | manual (sin valor) | inconsistente: 29 / 50 / fallback 29 |
| `convenience_fees` | calcula path empresarial (J29,J30) | path empresarial dataclass | path empresarial RPC | aplica a TODO booking (`flat` o %) |
| `clientTotal`/`valor_cliente` redondeo | doble (J25 + F14) | simple (post min) | simple (post min) | simple sobre `rawTotal` |

## Ejemplo numérico para detectar divergencia

Categoría TaxiPlus, distancia 5 km, tiempo 600 s, urbano, sin extras.

| Paso | Excel | Python | RPC | Móvil |
|------|-------|--------|-----|-------|
| Base | 4 920 | 4 920 | 4 920 | 4 920 |
| km × precio | 5 × 540 = 2 700 | 2 700 | 2 700 | 2 700 |
| min × precio | (600/60) × 426 = 4 260 | igual | igual | igual |
| Suma | 11 880 | 11 880 | 11 880 | 11 880 |
| Min_fare 8 880 | aplica? **NO** | aplica? sí (11 880>8 880 no actúa) | igual | aplica antes (11 880>8 880 no actúa) |
| Total conductor | ROUNDUP centena = 11 900 | 11 900 | 11 900 | 11 900 (rawTotal=11 880 → roundup=11 900) |
| Cliente | 11 900 × 1.25 → 14 875 → ROUNDUP 14 900 | igual | igual | rawTotal × 1.25 = 14 850 → ROUNDUP 14 900 |

En este caso convergen. Donde divergen:

### Caso A — Distancia mínima (min_fare activa)

Categoría XPlus, distancia 0.5 km, tiempo 60 s.

| Paso | Excel | Python | RPC | Móvil |
|------|-------|--------|-----|-------|
| Base + km×precio + min×precio | 4 800 + 8.4 + 460 = **5 268** | 5 268 | 5 268 | 5 268 |
| Min_fare 8 400 | NO se aplica | total=ROUNDUP(5 268)=5 300 → min check → **8 400** | igual | rawTotal=MAX(5 268, 8 400)=**8 400** |
| Cliente | 5 268 → ROUNDUP 5 300 × 1.25 = 6 625 → ROUNDUP **6 700** ⚠️ | 8 400 × 1.25 = 10 500 → ROUNDUP **10 500** | igual | 8 400 × 1.25 = 10 500 → ROUNDUP **10 500** |

**Excel: cliente paga 6 700 (debajo de min_fare 8 400). BUG canónico.**
Móvil, Python y RPC entregan 10 500 (correcto).

### Caso B — Suma no múltiplo de 100

Categoría TaxiPlus, suma = 8 050, min = 5 000 (no actúa).

| Paso | Python/RPC | Móvil |
|------|------------|-------|
| Total conductor | ROUNDUP(8 050)= **8 100** | rawTotal=8 050, total=ROUNDUP(8 050)=**8 100** |
| Cliente | 8 100 × 1.25 = 10 125 → ROUNDUP **10 200** | 8 050 × 1.25 = 10 062.5 → ROUNDUP **10 100** |

**Cliente paga 100 COP menos en móvil.** Móvil aplica margen sobre `rawTotal`
(pre-roundup) "para evitar doble redondeo" — comentario del código. Python y
RPC aplican sobre `total_conductor` post-roundup. Divergencia legítima por
decisión técnica distinta.

## Implicaciones operacionales

1. **Cliente WhatsApp ve precio distinto al cliente móvil** para mismo viaje
   cuando suma no es múltiplo de 100. Hasta 100 COP de gap por servicio.
2. **Excel reporta precio inferior al min_fare** si operador no fuerza piso a
   mano → bug canónico replicado a manuales y planillas.
3. **App móvil tiene bug DISTINTO** (BUG-1 `estimate` undefined, BUG-2 trigger
   SQL sin piso, BUG-3 promo no persiste — ver [[22-plan-fix-bug-min-fare]])
   que produce *otro* tipo de "cliente paga menos que min_fare" pero por causa
   técnica diferente (path roto de persistencia).
4. **Δ Aeropuerto** subcobra 2 000 COP en los 3 canales digitales (10 000 vs
   12 000 oficial Tabla Tarifas). Aplica a cualquier viaje al aeropuerto.

## Política canónica resuelta

Confirmada por [[23-modelo-pricing-excel-oficial]] §Política:

```
total_conductor = ROUNDUP(componentes) con piso min_fare
cliente         = ROUNDUP(total_conductor × 1.25)
ingreso_erixon  = cliente - total_conductor    (margen plataforma)
```

Margen 25% es ganancia de la plataforma, **no comisión adicional sobre lo que
ya paga el cliente**. Comisiones empresariales son path separado y solo
aplican cuando `es_empresarial=true`.

## Recomendaciones

1. **Una sola fuente de verdad**: app móvil invoque RPC `calcular_tarifa`
   ([[25-rpc-calcular-tarifa]]) en lugar de `FareCalculator.tsx` local. Borra
   divergencia móvil↔WhatsApp.
2. **Parametrizar todos los hardcodes** (Δ Aeropuerto, programado, protocolo,
   PayU, insurance) en la tabla `tarifas` con GENERATED columns. Eliminar
   constantes en `config.py` y RPC.
3. **Excel: implementar piso min_fare** en `J25` o migrar operadores a usar
   RPC directamente (Power Query → Supabase).
4. **Decidir si margen sobre rawTotal o post-roundup** y alinear los 3
   canales. Recomendación: post-roundup (Python/RPC) por simplicidad.
5. **Modelar Ida y Vuelta** en RPC + Python (móvil ya lo hace, divergencia
   inversa).
6. **Corregir Δ Aeropuerto a 12 000** en `config.py` + RPC para igualar a
   tabla.

## Quinta implementación — backendRemoto (mejora consolidada)

`Agente/backendRemoto/src/domains/booking/tarifa/engine.py` es el puerto más
evolucionado. Cierra 4 hallazgos críticos:

| Hallazgo histórico | Excel | Python | RPC | Móvil | **backendRemoto** |
|--------------------|-------|--------|-----|-------|-------------------|
| Aplica `min_fare` | ❌ | ✅ | ✅ | ✅ | ✅ |
| Δ Aeropuerto correcto (12 000) | ❌ 10 000 | ❌ 10 000 | ❌ 10 000 | ✅ BD | ✅ BD |
| Aeropuerto + programado usa `delta_aeropuerto_prog` | ❌ | ❌ | ❌ | ✅ | ✅ |
| Por Hora >1h escala con duración | ❌ | ❌ | ❌ | n/a | ✅ |
| Auto-detecta Urbano↔Inter a 29 km | ❌ | ❌ caller | ❌ caller | ✅ caller | ✅ engine |
| Ida y Vuelta afecta cobro | ❌ | ❌ | ❌ | ✅ caller | ❌ |
| Base margen 25% post-roundup | ✅ | ✅ | ✅ | ❌ rawTotal | ✅ |
| Tarifa leída desde BD | n/a | ❌ dict | ✅ tabla | ✅ `car_types` | ✅ `VehicleCategory` |

Detalle completo en [[27-tarifa-backendremoto-agente]].

**Ranking de canales (mejor → peor adherencia a la política correcta):**

1. **backendRemoto** — corrige 4 bugs + auto-deriva cobertura + lee BD.
2. **App móvil** — corrige aeropuerto + auto-cobertura + Ida y Vuelta, pero margen sobre rawTotal y persistencia rota (ver [[22-plan-fix-bug-min-fare]]).
3. **RPC SQL Supabase** — aplica min_fare correctamente pero hereda hardcodes Excel.
4. **Python sistema_calculo** — base de la cadena, hereda hardcodes Excel.
5. **Excel `board`** — no aplica min_fare, hardcodes incorrectos, lógica manual.

## Acción recomendada actualizada

Originalmente: app móvil invoca RPC `calcular_tarifa`. Hoy con backendRemoto disponible:

**Opción 1 — Portar mejoras de backendRemoto a RPC SQL** y luego móvil consume RPC. Mantiene cálculo cerca de BD móvil (Supabase `utofhxgzkdhljrixperh`).

**Opción 2 — App móvil llama HTTP al endpoint VPS backendRemoto.** Requiere exponer endpoint público (o vía tunelización WireGuard ya documentada en `Agente/llm-wiki/01-WIKI/tunel-wireguard.md`). Latencia + dependencia VPS.

**Recomendación:** Opción 1 — portar `engine.py` a `003_functions.sql`, actualizar `tarifas` table con columnas adicionales si necesario, móvil migra a `supabase.rpc('calcular_tarifa', ...)`.

## Divergencia real detectada 2026-07-04 — no era la fórmula, era el proveedor de rutas

Reporte de usuario: mismo viaje (Itagüí → Aeropuerto José María Córdova,
intermunicipal, TaxiPlus, con recargo aeropuerto) daba precios muy distintos
entre web y móvil — rango `$93.700–$117.200` (web) vs `$108.600–$135.800`
(móvil), ~15-18% de diferencia.

**Causa raíz: no era `FareCalculator`.** Cada canal media la ruta con un
proveedor de direcciones distinto:
- Web (`GoogleMapsAddressPicker.tsx`): `google.maps.DirectionsService` → 31 km / 45 min.
- Móvil (`CreateReservationScreen.tsx`): Mapbox Directions API → 35 km / 57 min.

Retro-derivando las tarifas reales de TaxiPlus intermunicipal desde el
desglose de la web (`rate_per_unit_distance_inter`=1.080/km,
`rate_per_hour_inter`=852/min, base_inter=9.840) y aplicándolas sobre la
distancia/tiempo que reportó el **móvil** (35 km, 57 min), el resultado
calculado coincide con lo que mostró el móvil (±$300-400 de redondeo). **La
fórmula es idéntica en ambos canales** — la diferencia de precio es 100%
atribuible a que Mapbox y Google eligieron rutas físicas distintas para el
mismo par origen-destino (patrón típico Medellín↔Rionegro: Túnel de Oriente
vs. Las Palmas — una ruta es más corta y rápida que la otra).

**Fix aplicado:** migrado el cálculo de ruta de la web a Mapbox Directions
API (`GoogleMapsAddressPicker.tsx`, componente `Directions`), igualando al
proveedor que ya usa el móvil. El mapa/autocompletar en la web sigue siendo
Google Maps — solo cambió la fuente de distancia/tiempo/polyline. Requiere
`VITE_MAPBOX_ACCESS_TOKEN` en `.env` del proyecto web (variable ya estaba
reservada en `.env.example`, pendiente que el usuario complete el valor real).

**backendRemoto (Agente WhatsApp) queda fuera de esta unificación** — usa
OSRM (self-hosted), un cuarto proveedor de ruteo. No tocado en esta sesión;
si se reporta la misma divergencia en ese canal, aplica el mismo diagnóstico.

## Fuentes
- [[21-calculo-tarifa]] — móvil
- [[23-modelo-pricing-excel-oficial]] — Excel
- [[24-sistema-calculo-python]] — Python referencia
- [[25-rpc-calcular-tarifa]] — RPC SQL
- [[27-tarifa-backendremoto-agente]] — backendRemoto Agente
- [[22-plan-fix-bug-min-fare]] — plan fix móvil
- `AplicacionWebTmasplus/TmasPlus_webSite/src/components/maps/GoogleMapsAddressPicker.tsx` — ruteo web (Mapbox desde 2026-07-04)
- `AplicacionMovilTmasplus/App/app/(tabs)/CreateReservationScreen.tsx:339` — ruteo móvil (Mapbox)
