# Sistema de cálculo — implementación Python referencia

> Microservicio Python que replica al detalle el Excel `Base para Agente
> T+Plus.xlsm`. Vive en `C:/test/TmasPlus/sistema_calculo/`. Es la
> **implementación canónica** que la app móvil debería respetar.

---
tags: [pricing, python, backend, referencia]
entidades: [tarifa_engine, calcular_tarifa, ParametrosServicio, ResultadoTarifa]
---

## Estructura

```
sistema_calculo/
├── __init__.py
├── config.py                # constantes hardcoded del Excel
├── db_service.py            # CRUD Supabase
├── factura_service.py       # SIIGO/Dataico
├── main.py                  # entrypoint CLI
├── mensajes.py              # textos UI
├── models.py                # dataclasses (Tarifa, ParametrosServicio, ResultadoTarifa)
├── tarifa_engine.py         # ALGORITMO — replica hoja `board`
├── requirements.txt
└── sql/
    ├── 001_schema.sql       # tablas tarifas/conductores/clientes/servicios
    ├── 002_seed_tarifas.sql # valores Excel
    ├── 003_functions.sql    # RPC `calcular_tarifa` (ver [[25-rpc-calcular-tarifa]])
    └── 004_indexes_rls.sql
```

## Constantes (`config.py`)

```py
MARGEN_CLIENTE      = 0.25     # 25% sobre valor conductor
MARGEN_ERIXON       = 0.20     # 20% para cálculo inverso
DELTA_AEROPUERTO    = 10000    # ⚠️ hardcode Excel (Tabla dice 12000)
DELTA_PROGRAMADO    = 4000
DELTA_PROTOCOLO     = 5000
SEGURO_EMPRESARIAL  = 800
INSURANCE           = 500
PAYU_COMISION       = 10000
PROCESAMIENTO_RATE  = 0.3 * 0.08   # 2.4% del total
IVA_RATE            = 0.19
HOSTING_RATE        = 0.20         # 20% del total conductor
```

Replica los hardcodes del board exactamente. **Incluye el bug del Δ Aeropuerto
10 000 en lugar de los 12 000 de Tabla Tarifas** — ver [[23-modelo-pricing-excel-oficial]] §8.2.

## Modelo de datos (`models.py`)

`Tarifa` (dataclass con propiedades `_inter` derivadas):
```py
@property
def base_fare_inter(self):     return self.base_fare / (1 - 0.50)
def valor_distancia_inter(self): return self.valor_distancia / (1 - 0.50)
def rate_per_minute(self):     return self.valor_hora / 60
def rate_per_minute_inter(self): return self.rate_per_minute / (1 - 0.50)
def min_fare_inter(self):      return self.min_fare / (1 - 0.50)
```

`ParametrosServicio`: entradas del servicio (origen, destino, distancia_km, categoría, cobertura, flags aeropuerto/programado/protocolo, tipo_servicio Normal/Por Hora, membresía, peajes, parqueadero, comisión_corp, descuento_membresia).

`ResultadoTarifa`: salida con `total_conductor`, `valor_cliente`, `rango_min/max`, `ingreso_erixon`, y campos empresariales (`comision_empresa`, `hosting_tecnologico`, `procesamiento_datos`, `iva_procesamiento`, `seguro`, `payu`, `total_empresarial`).

## Catálogo embebido (`tarifa_engine.py:TARIFAS`)

| Tipo | base_fare | valor_distancia | valor_hora | min_fare |
|------|-----------|-----------------|------------|----------|
| TaxiPlus | 4 920 | 540 | 25 560 | 8 880 |
| XPlus | 4 800 | 16.8 | 27 600 | 8 400 |
| ConfortPlus | 10 800 | 660 | 36 000 | 19 200 |
| VanPlus | 30 000 | 390 | 84 000 | 54 000 |

Idénticos al Excel y a `tarifas` SQL seed.

## Algoritmo `calcular_tarifa(params)` — paso a paso

### Selección urbana vs intermunicipal
```py
if es_urbano:
    tarifa_basica = tarifa.base_fare         # F17
    precio_km     = tarifa.valor_distancia   # F18
    precio_min    = tarifa.rate_per_minute   # F19
    cobro_minimo  = tarifa.min_fare          # F25
else:
    # versiones _inter (× 2)
```

### Componentes
```py
costo_km     = precio_km * distancia_km                       # J18
costo_tiempo = precio_min * (tiempo_segundos / 60)            # J19 Normal
            | precio_min * 60                                 # J19 Por Hora (⚠️ no escala)

delta_aeropuerto = 10000 if es_aeropuerto else 0              # J20
delta_programado = 4000  if es_programado else 0              # J21
delta_protocolo  = 5000  if protocolo    else 0               # J22
parqueadero      = params.parqueadero                         # J23
peajes           = sum(peaje_1..peaje_4)                      # J24
```

### Total conductor — con piso `min_fare` (CRÍTICO)

```py
suma = tarifa_basica + costo_km + costo_tiempo
     + delta_aeropuerto + delta_programado + delta_protocolo
     + parqueadero + peajes

total_conductor = roundup_centenas(suma)                      # J25 = ROUNDUP(SUM, -2)

# Aplicar cobro mínimo — Python SÍ lo aplica, Excel no
if total_conductor < cobro_minimo:
    total_conductor = cobro_minimo
```

⚠️ **Diferencia importante con Excel:** Python aplica `min_fare` DESPUÉS de
roundup centena. Excel no aplica nunca. App móvil aplica ANTES de roundup
(sobre rawTotal). Ver [[26-comparativa-canales-pricing]].

### Cálculos empresariales (solo si `es_empresarial`)

```py
comision_empresa     = total_conductor * comision_corp        # J27
seguro               = 800                                    # J33
procesamiento_datos  = total_conductor * 0.3 * 0.08           # J30 = 2.4%
iva_procesamiento    = procesamiento_datos * 0.19             # J31
hosting_tecnologico  = total_conductor * 0.20
                     - procesamiento_datos
                     + PAYU_COMISION                          # J29
payu                 = PAYU_COMISION                          # J32

total_empresarial = round_decenas(
    total_conductor
  + descuento_membresia
  + comision_empresa
  + hosting_tecnologico
  + procesamiento_datos
  + iva_procesamiento
  + payu
  + seguro
) - PAYU_COMISION                                             # J34
```

### Valor cliente (margen Erixon 25%)

```py
valor_cliente = roundup_centenas(total_conductor * 1.25)      # Tapa!F14
ingreso_erixon = valor_cliente - total_conductor              # Tapa!H14
rango_min = total_conductor
rango_max = valor_cliente
```

**Aplica margen sobre `total_conductor`** (post-roundup, post-min_fare check).
La app móvil aplica sobre `rawTotal` (pre-roundup). Diferencia documentada
en [[26-comparativa-canales-pricing]].

## Helpers de redondeo

```py
def roundup_centenas(v):  return math.ceil(v / 100) * 100
def round_decenas(v):     return round(v / 10) * 10
```

## Política confirmada

- `total_conductor` = lo que recibe el conductor (J25, sub-total cliente bruto post-roundup).
- `valor_cliente` = lo que paga el cliente = `total_conductor × 1.25` post-roundup centena.
- `ingreso_erixon` = margen 25% = ganancia plataforma.
- Comisión empresarial es path separado (`es_empresarial=true`); cliente retail no la ve.

**Esta es la fórmula oficial. Resuelve la opción C de la decisión arquitectónica.**

## Bugs heredados del Excel

| Hereda de Excel | Documentado en |
|-----------------|----------------|
| Δ Aeropuerto 10 000 vs Tabla 12 000 | [[23-modelo-pricing-excel-oficial]] §8.2 |
| Modo "Por Hora" no escala >1h | [[23-modelo-pricing-excel-oficial]] §8.1 |
| `delta_aeropuerto_prog` 4 800 ignorado en combinación | igual |
| Sin umbral 29 km automático Urbano↔Intermunicipal | igual |
| Sin lógica Ida y Vuelta | igual |

Python **mejora un punto crítico**: aplica `min_fare` (Excel no lo hace).

## Fuentes
- `C:/test/TmasPlus/sistema_calculo/tarifa_engine.py` (algoritmo 206 líneas)
- `C:/test/TmasPlus/sistema_calculo/config.py` (constantes)
- `C:/test/TmasPlus/sistema_calculo/models.py` (dataclasses)
- [[23-modelo-pricing-excel-oficial]] (fuente Excel)
- [[25-rpc-calcular-tarifa]] (RPC SQL paralela)
- [[26-comparativa-canales-pricing]] (móvil vs Python vs RPC)
