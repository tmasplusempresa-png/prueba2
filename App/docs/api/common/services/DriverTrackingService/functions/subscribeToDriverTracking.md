[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/services/DriverTrackingService](../README.md) / subscribeToDriverTracking

# Function: subscribeToDriverTracking()

> **subscribeToDriverTracking**(`bookingId`, `onLocationUpdate`, `onError?`): () => `void`

Defined in: common/services/DriverTrackingService.ts:49

Escuchar cambios en tiempo real en la tabla booking_tracking de Supabase
Esta es la FUNCIÓN PRINCIPAL para recibir actualizaciones de ubicación del conductor

## Parameters

### bookingId

`string`

### onLocationUpdate

(`location`) => `void`

### onError?

(`error`) => `void`

## Returns

() => `void`
