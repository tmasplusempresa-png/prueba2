[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/services/DriverTrackingService](../README.md) / calcEtaLocal

# Function: calcEtaLocal()

> **calcEtaLocal**(`driverLat`, `driverLng`, `pickupLat`, `pickupLng`): `object`

Defined in: common/services/DriverTrackingService.ts:127

Calcula distancia y ETA usando Haversine (sin API externa).
Aplica factor urbano 1.35 para compensar distancia lineal vs. calles reales.
Velocidad promedio 25 km/h (tráfico urbano Bogotá).

## Parameters

### driverLat

`number`

### driverLng

`number`

### pickupLat

`number`

### pickupLng

`number`

## Returns

`object`

### distanceKm

> **distanceKm**: `number`

### etaMin

> **etaMin**: `number`
