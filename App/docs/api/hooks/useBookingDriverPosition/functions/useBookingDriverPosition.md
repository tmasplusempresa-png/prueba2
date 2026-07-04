[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [hooks/useBookingDriverPosition](../README.md) / useBookingDriverPosition

# Function: useBookingDriverPosition()

> **useBookingDriverPosition**(`bookingId`): `object`

Defined in: hooks/useBookingDriverPosition.ts:21

Suscribe al cliente a la posición en tiempo real del conductor para un booking.

Flujo:
 1. Query inicial → obtiene el último punto en booking_tracking (por created_at DESC).
 2. Canal Supabase Realtime → escucha INSERT filtrado por booking_id y actualiza el estado.
 3. Cleanup → elimina el canal al desmontar o cuando cambia bookingId.

## Parameters

### bookingId

`string` \| `null` \| `undefined`

UUID del booking activo, o null/undefined para desactivar.

## Returns

`object`

### driverPosition

> **driverPosition**: [`DriverPosition`](../interfaces/DriverPosition.md) \| `null`

### isLoading

> **isLoading**: `boolean`

### error

> **error**: `string` \| `null`
