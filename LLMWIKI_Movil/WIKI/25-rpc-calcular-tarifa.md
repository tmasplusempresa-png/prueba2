# RPC SQL `calcular_tarifa`

> Función Postgres en `sistema_calculo/sql/003_functions.sql` que replica el
> motor Python directamente en BD. Permite que cualquier cliente (móvil,
> agente WhatsApp, dashboard) consuma el mismo cálculo sin reimplementar.

---
tags: [pricing, supabase, rpc, postgres]
entidades: [calcular_tarifa, tarifas, next_consecutivo]
---

## Firma

```sql
calcular_tarifa(
  p_categoria             TEXT,              -- TaxiPlus | XPlus | ConfortPlus | VanPlus
  p_distancia_km          NUMERIC,
  p_tiempo_segundos       NUMERIC,
  p_cobertura             TEXT DEFAULT 'Urbano',
  p_es_empresarial        BOOLEAN DEFAULT FALSE,
  p_es_aeropuerto         BOOLEAN DEFAULT FALSE,
  p_es_programado         BOOLEAN DEFAULT FALSE,
  p_protocolo             BOOLEAN DEFAULT FALSE,
  p_tipo_servicio         TEXT DEFAULT 'Normal',     -- Normal | Por Hora
  p_parqueadero           NUMERIC DEFAULT 0,
  p_peaje_1..4            NUMERIC DEFAULT 0,
  p_comision_corp         NUMERIC DEFAULT 0,         -- 0.0 a 1.0
  p_descuento_membresia   NUMERIC DEFAULT 0
) RETURNS JSON
```

## Tabla fuente `tarifas`

```sql
CREATE TABLE tarifas (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  descripcion TEXT NOT NULL,
  tipo TEXT NOT NULL UNIQUE,           -- TaxiPlus, XPlus, ConfortPlus, VanPlus
  base_fare              NUMERIC(12,2) NOT NULL DEFAULT 0,
  base_fare_inter        NUMERIC(12,2) GENERATED ALWAYS AS (base_fare      / (1 - 0.50)) STORED,
  valor_distancia        NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_distancia_inter  NUMERIC(12,2) GENERATED ALWAYS AS (valor_distancia / (1 - 0.50)) STORED,
  valor_hora             NUMERIC(12,2) NOT NULL DEFAULT 0,
  rate_per_hour          NUMERIC(12,2) GENERATED ALWAYS AS (valor_hora / 60) STORED,
  rate_per_hour_inter    NUMERIC(12,2) GENERATED ALWAYS AS ((valor_hora / 60) / (1 - 0.50)) STORED,
  min_fare               NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_fare_inter         NUMERIC(12,2) GENERATED ALWAYS AS (min_fare / (1 - 0.50)) STORED,
  delta_aeropuerto       NUMERIC(12,2) NOT NULL DEFAULT 12000,
  delta_aeropuerto_prog  NUMERIC(12,2) NOT NULL DEFAULT 4800,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

Columnas `_inter` son **GENERATED STORED** — calculadas automáticamente como
`urbano / 0.5`. Imposible que se desincronicen del valor base.

## Seed (002_seed_tarifas.sql)

```sql
INSERT INTO tarifas (descripcion, tipo, base_fare, valor_distancia, valor_hora, min_fare, delta_aeropuerto, delta_aeropuerto_prog)
VALUES
  ('T+Plus Taxi',       'TaxiPlus',     4920,   540,   25560,  8880,  12000, 4800),
  ('T+Plus Particular', 'XPlus',        4800,   16.8,  27600,  8400,  12000, 4800),
  ('T+Plus Especial',   'ConfortPlus',  10800,  660,   36000,  19200, 12000, 4800),
  ('T+Plus Van',        'VanPlus',      30000,  390,   84000,  54000, 12000, 4800);
```

Valores idénticos al Excel `Tabla Tarifas`. ⚠️ `delta_aeropuerto = 12000` en la
tabla pero la RPC usa **10000 hardcode** en la función (hereda bug del Excel
board).

## Algoritmo RPC (resumen)

1. Lookup fila por `tipo`. Error si no encuentra.
2. Selección urbano/inter:
   ```sql
   IF v_es_urbano THEN
     v_precio_minuto := v_tarifa.valor_hora / 60;
   ELSE
     v_precio_minuto := v_tarifa.rate_per_hour_inter;
   END IF;
   ```
3. `v_costo_tiempo`:
   - Normal: `v_precio_minuto * (p_tiempo_segundos / 60)`
   - Por Hora: `v_precio_minuto * 60`
4. Deltas hardcoded (ignora valores de tabla):
   ```sql
   IF p_es_aeropuerto THEN v_delta_aeropuerto := 10000;  -- ⚠️ NO usa tarifa.delta_aeropuerto
   IF p_es_programado THEN v_delta_programado := 4000;
   IF p_protocolo     THEN v_delta_protocolo  := 5000;
   ```
5. Total conductor:
   ```sql
   v_total_conductor := CEIL((suma_componentes) / 100.0) * 100;
   IF v_total_conductor < v_min_fare THEN
     v_total_conductor := v_min_fare;        -- ✅ piso aplicado
   END IF;
   ```
6. Empresarial (mismo modelo que [[24-sistema-calculo-python]]).
7. Valor cliente:
   ```sql
   v_valor_cliente := CEIL((v_total_conductor * 1.25) / 100.0) * 100;
   ```
8. Devuelve JSON con todos los componentes.

## Output JSON

```json
{
  "tarifa_basica":       4920,
  "costo_km":            5400,
  "costo_tiempo":        2130,
  "delta_aeropuerto":    0,
  "delta_programado":    0,
  "delta_protocolo":     0,
  "parqueadero":         0,
  "peajes":              0,
  "total_conductor":     12500,
  "cobro_minimo":        8880,
  "comision_empresa":    0,
  "hosting_tecnologico": 0,
  "procesamiento_datos": 0,
  "iva_procesamiento":   0,
  "seguro":              0,
  "total_empresarial":   0,
  "valor_cliente":       15700,
  "rango_estimado":      "$ 12500 - $ 15700",
  "ingreso_erixon":      3200
}
```

## Cómo invocar

### Desde el cliente Supabase
```js
const { data, error } = await supabase.rpc('calcular_tarifa', {
  p_categoria: 'ConfortPlus',
  p_distancia_km: 12,
  p_tiempo_segundos: 1800,
  p_cobertura: 'Urbano',
  p_es_aeropuerto: false,
  p_es_programado: false,
  p_tipo_servicio: 'Normal',
});
```

### Vía REST
```bash
curl -X POST "{SUPABASE_URL}/rest/v1/rpc/calcular_tarifa" \
  -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"p_categoria":"ConfortPlus","p_distancia_km":12,"p_tiempo_segundos":1800}'
```

## Otra función relevante

`next_consecutivo() RETURNS TEXT` — genera consecutivo `T+Plus0000XXX`
incrementando atómicamente `consecutivo.ultimo_numero`. Útil para `reference`
de bookings empresariales.

## Por qué importa esta RPC para el bug operacional

Esta RPC + Python son la **fuente de verdad oficial** para el cálculo. La app
móvil **NO usa esta RPC** — corre `FareCalculator.tsx` local. Hay tres
implementaciones que pueden divergir:

| Canal | Implementación |
|-------|----------------|
| App móvil | `App/common/actions/FareCalculator.tsx` (TypeScript) |
| Backend Python / agente WhatsApp | `sistema_calculo/tarifa_engine.py` |
| RPC SQL invocable | `calcular_tarifa()` en Postgres |

Diferencias detalladas en [[26-comparativa-canales-pricing]].

**Acción recomendada (futuro):** la app móvil debería invocar
`supabase.rpc('calcular_tarifa', ...)` en lugar de `FareCalculator.tsx` local
→ una sola fuente de verdad, cero divergencia, fix de min_fare se hace en un
único lugar.

## Fuentes
- `C:/test/TmasPlus/sistema_calculo/sql/003_functions.sql` (función completa)
- `C:/test/TmasPlus/sistema_calculo/sql/001_schema.sql` (tabla `tarifas` con GENERATED columns)
- `C:/test/TmasPlus/sistema_calculo/sql/002_seed_tarifas.sql` (valores)
- [[24-sistema-calculo-python]] (mismo algoritmo en Python)
- [[23-modelo-pricing-excel-oficial]] (origen Excel)
