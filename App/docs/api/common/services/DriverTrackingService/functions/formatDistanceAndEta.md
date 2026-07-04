[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/services/DriverTrackingService](../README.md) / formatDistanceAndEta

# Function: formatDistanceAndEta()

> **formatDistanceAndEta**(`linearKm`): [`DistanceEtaResult`](../interfaces/DistanceEtaResult.md)

Defined in: common/services/DriverTrackingService.ts:165

Formatea distancia y ETA con factores urbanos variables por rango.
Recibe la distancia lineal en km (sin factor urbano aplicado).

Rangos de factor urbano y velocidad:
  < 1 km  → factor 1.50, velocidad 15 km/h  (calles muy cortas, muchas esquinas)
  1–5 km  → factor 1.35, velocidad 25 km/h  (tráfico urbano estándar)
  > 5 km  → factor 1.25, velocidad 35 km/h  (empieza a haber arterias / vías rápidas)

Estados especiales:
  VERY_CLOSE : distancia lineal < 200 m → texto fijo, ETA 1 min
  FAR        : distancia ajustada > 15 km → ETA redondeada a múltiplos de 5 min

## Parameters

### linearKm

`number`

## Returns

[`DistanceEtaResult`](../interfaces/DistanceEtaResult.md)
