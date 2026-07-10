# Tarifa backendRemoto (Agente WhatsApp) — implementación mejorada

> Puerto evolucionado de [[24-sistema-calculo-python]] en el VPS del agente
> WhatsApp. **Corrige 4 de los hallazgos críticos** identificados en
> [[26-comparativa-canales-pricing]]. Estado del arte hoy entre las 4
> implementaciones del modelo.

---
tags: [pricing, python, agente, backend-remoto, fix]
entidades: [calcular_tarifa, ServiceParams, FareResult, Tarifa.from_db_row]
---

## Ubicación

```
Agente/backendRemoto/src/domains/booking/tarifa/
├── __init__.py
├── engine.py          # algoritmo (143 líneas)
├── models.py          # dataclasses (113 líneas)
└── formatter.py       # render mensaje WhatsApp (60 líneas)
```

Consumidores:
- `src/domains/booking/handlers/service_selection.py:122` — cotiza al seleccionar categoría.
- `src/domains/booking/handlers/service_selected.py:139` — confirma con detalle completo.

## Constantes (`engine.py`)

```py
MARGEN_CLIENTE          = 0.25
DELTA_PROGRAMADO        = 4_000
DELTA_PROTOCOLO         = 5_000
SEGURO_EMPRESARIAL      = 800
PAYU_COMISION           = 10_000
PROCESAMIENTO_RATE      = 0.3 * 0.08     # 2.4%
IVA_RATE                = 0.19
HOSTING_RATE            = 0.20

UMBRAL_INTERMUNICIPAL_KM = 29            # NUEVO — explícito y único
```

Eliminadas: `DELTA_AEROPUERTO`, `INSURANCE`. Δ Aeropuerto ahora viene de la BD,
INSURANCE desapareció (fórmula F30 = F28 - F29 que daba negativo en
[[23-modelo-pricing-excel-oficial]] §8.3).

## Mejoras vs [[24-sistema-calculo-python]]

### ✅ FIX-1 — Auto-derivar `cobertura` por umbral

```py
if params.cobertura is None:
    cobertura = "Urbano" if params.distancia_km <= UMBRAL_INTERMUNICIPAL_KM else "Intermunicipal"
else:
    cobertura = params.cobertura          # caller puede forzar
```

Antes el caller debía decidir manualmente. Ahora el motor decide a 29 km. Caller mantiene control con `cobertura="Urbano"|"Intermunicipal"` explícito.

Cierra [[10-deuda-tecnica]] §22 para el agente WhatsApp.

### ✅ FIX-2 — Δ Aeropuerto desde tabla, no hardcode

```py
r.delta_aeropuerto = tarifa.delta_aeropuerto if params.es_aeropuerto else 0
```

`tarifa.delta_aeropuerto` viene de `Tarifa.from_db_row(row)` que lee
`VehicleCategory.delta_aeropuerto` (12 000 oficial). **Bug del Excel +
sistema_calculo + RPC SQL CORREGIDO** en este canal.

Cierra [[10-deuda-tecnica]] §18 (para agente WhatsApp; móvil ya lo tenía, otros canales siguen mal).

### ✅ FIX-3 — Combinación aeropuerto + programado usa `delta_aeropuerto_prog`

```py
if params.es_programado:
    if params.es_aeropuerto:
        r.delta_programado = tarifa.delta_aeropuerto_prog   # ← 4 800 de BD
    else:
        r.delta_programado = DELTA_PROGRAMADO               # 4 000 hardcode
else:
    r.delta_programado = 0
```

Cierra [[10-deuda-tecnica]] §19 para agente WhatsApp.

### ✅ FIX-4 — "Por Hora" escala con duración real

```py
# Both "Normal" and "PorHora" scale linearly with the actual minutes traveled.
r.costo_tiempo = precio_min * params.tiempo_minutos
```

Eliminó la rama `precio_min * 60` que cobraba siempre 60 min. Cierra
[[10-deuda-tecnica]] §20.

⚠️ Implicación: el modo "PorHora" **ya no tiene diferencia** con "Normal" en
esta implementación. Si la política real exige cobro fijo por hora, está mal.
Si la política es "siempre escalar minutos", está correcto. Confirmar con
negocio. Pendiente: aclarar semántica de `tipo_servicio = "PorHora"` (el campo
sigue declarado en `ServiceParams` pero no afecta el cálculo).

## Lo que NO mejoraron

- ❌ "Ida y Vuelta" sigue sin modelo. `ServiceParams` no expone flag.
- ❌ Sigue aplicando margen 25% sobre `total_conductor` (post-roundup, post-min). Diferencia con móvil que usa `rawTotal` se mantiene — móvil sigue dando hasta 100 COP menos en valores no múltiplos de 100.
- ❌ Path empresarial sigue heredado tal cual (J27..J34) con los mismos bugs Excel (IVA no sumado, etc.).

## Modelo de datos (`models.py`)

### `Tarifa`

Idéntico a [[24-sistema-calculo-python]] pero **simplificado**:
- Eliminado `descripcion`.
- Añadidos defaults explícitos: `delta_aeropuerto: float = 12_000`, `delta_aeropuerto_prog: float = 4_800` (alineado a Tabla Tarifas, no al hardcode Excel).
- Nuevo método `from_db_row(row: dict)` lee directamente fila `VehicleCategory`.

```py
@classmethod
def from_db_row(cls, row: dict) -> Tarifa:
    return cls(
        tipo=row.get("type", ""),
        base_fare=float(row.get("base_fare", 0)),
        valor_distancia=float(row.get("valor_distancia", 0)),
        valor_hora=float(row.get("valor_hora", 0)),
        min_fare=float(row.get("min_fare", 0)),
        delta_aeropuerto=float(row.get("delta_aeropuerto", 12000)),
        delta_aeropuerto_prog=float(row.get("delta_aeropuerto_prog", 4800)),
    )
```

### `ServiceParams`

- `cobertura: Optional[str] = None` — `None` activa auto-derivación por umbral.
- `tiempo_minutos: float` (no segundos como en sistema_calculo). Propiedad `tiempo_segundos` derivada.
- Mantiene `tipo_servicio`, `es_aeropuerto`, `es_programado`, `protocolo`, `peajes`, `parqueadero`, flags empresariales.

### `FareResult`

Añade campo `cobertura: str` — refleja qué cobertura efectiva se usó tras
auto-derivación. Útil para auditar decisiones del motor.

## Flujo de invocación (handler `service_selection.py`)

1. Usuario WhatsApp elige categoría.
2. Handler obtiene fila de `VehicleCategory` desde Supabase del agente.
3. `Tarifa.from_db_row(row)` instancia tarifa.
4. `ServiceParams(distancia_km, tiempo_minutos, es_aeropuerto)` — sin forzar
   cobertura (auto-derive).
5. `fare = calcular_tarifa(tarifa, params)`.
6. `estimated_fare = fare.rango_min` (= `total_conductor`).
7. UI muestra rango: `{_fmt(fare.rango_min)} - {_fmt(fare.rango_max)}` (conductor a cliente).

## Formato visible al usuario WhatsApp

`formatter.format_fare_confirmation` produce mensaje tipo:

```
*ConfortPlus* 🚗

📍 *Origen:* …
🏁 *Destino:* …
📏 *Distancia:* 12.3 km
⏱️ *Tiempo estimado:* 25 min
  Programado: $4.000
  Protocolo: $5.000
  Peajes: $8.500
  Parqueadero: $3.000
━━━━━━━━━━━━━━━━━━━━
💵 *Valor estimado:*
  $19.200 - $24.000
━━━━━━━━━━━━━━━━━━━━

¿Qué deseas hacer?
```

Nota: detalle base+km+tiempo+aeropuerto **comentado** en el código
(`formatter.py:38-43`). UX decisión: cliente solo ve recargos relevantes
(programado, protocolo, peajes, parqueadero) y rango total. Aeropuerto no se
muestra desglosado.

## Origen de datos — tabla `VehicleCategory`

BD remota del agente WhatsApp (proyecto Supabase distinto al móvil — no
ingerido aún). Columnas confirmadas en `Agente/llm-wiki/00-RAW/tablasDeWhatsapp.md`:

```
base_fare, valor_distancia, valor_hora, min_fare,
delta_aeropuerto (default 12000),
delta_aeropuerto_prog (default 4800)
```

A diferencia de `car_types` móvil, NO tiene: `convenience_fees`,
`convenience_fee_type`, `umbral_intermunicipal_km`, columnas `*_inter`,
`base_fare_inter`, etc.

`backendRemoto` deriva las versiones `_inter` en tiempo de cálculo con
propiedades dataclass (`/ (1 - 0.50)` = `× 2`). Tabla BD almacena solo urbano.

## Estado consolidado por canal (actualizado)

| Hallazgo | Excel | Python (sistema_calculo) | RPC SQL | Móvil | **backendRemoto** |
|----------|-------|--------------------------|---------|-------|--------------------|
| Aplica min_fare | ❌ | ✅ post-roundup | ✅ post-roundup | ✅ pre-roundup | ✅ post-roundup |
| Δ Aeropuerto valor | 10 000 | 10 000 | 10 000 | 12 000 BD | **12 000 BD** ✅ |
| Combinación aero+prog | ignora 4 800 | ignora 4 800 | ignora 4 800 | usa BD | **usa BD** ✅ |
| Por Hora >1h escala | ❌ | ❌ | ❌ | n/a | **✅** |
| Auto Urbano↔Inter 29 km | ❌ manual | ❌ caller | ❌ caller | ✅ caller | **✅ engine** |
| Ida y Vuelta | ❌ | ❌ | ❌ | ✅ caller | ❌ |
| Base margen 25% | `J25` post-roundup | `total_conductor` post-roundup, post-min | igual | `rawTotal` pre-roundup | `total_conductor` post-roundup |
| Lectura tarifas desde BD | n/a | hardcoded `TARIFAS` dict | tabla `tarifas` | `car_types` | `VehicleCategory` via `from_db_row` |

**backendRemoto es el canal más cercano al modelo correcto.** Móvil empata en parte, pierde en otros puntos.

## Implicaciones para [[22-plan-fix-bug-min-fare]]

1. La política "Opción C" sigue confirmada — backendRemoto la aplica igual:
   `cliente = ROUNDUP(total_conductor × 1.25)`.
2. Si app móvil migra a invocar la RPC, **conviene actualizar también la RPC SQL** para alinearla a las mejoras del backendRemoto (FIX-1 a FIX-4). RPC actual está atrasada.
3. Alternativa más rápida: app móvil llama HTTP al endpoint del backendRemoto que ya tiene la versión correcta. Pero introduce dependencia VPS↔móvil → tunelización + latencia.
4. **Recomendación:** portar las mejoras del backendRemoto a la RPC SQL (`003_functions.sql`). Una sola fuente de verdad cercana al cliente (Supabase móvil) con la lógica más nueva.

## Sin tests dedicados

`Agente/backendRemoto/tests/` no incluye `test_tarifa*`. El motor se valida
solo por uso en handlers. Recomendación: añadir suite con los casos del
[[26-comparativa-canales-pricing]] (caso A min_fare, caso B no múltiplo de 100).

## Fuentes
- `Agente/backendRemoto/src/domains/booking/tarifa/engine.py` (143 líneas)
- `Agente/backendRemoto/src/domains/booking/tarifa/models.py` (113 líneas)
- `Agente/backendRemoto/src/domains/booking/tarifa/formatter.py` (60 líneas)
- `Agente/backendRemoto/src/domains/booking/handlers/service_selection.py:14-124`
- `Agente/backendRemoto/src/domains/booking/handlers/service_selected.py:15-139`
- `Agente/CLAUDE.md` (contexto arquitectónico del agente)
- [[24-sistema-calculo-python]] (versión original)
- [[26-comparativa-canales-pricing]] (matriz divergencias)
