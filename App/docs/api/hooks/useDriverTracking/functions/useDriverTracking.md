[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [hooks/useDriverTracking](../README.md) / useDriverTracking

# ~~Function: useDriverTracking()~~

> **useDriverTracking**(`_bookingId`, `_driverId`, `_isActive`): `void`

Defined in: hooks/useDriverTracking.ts:8

## Parameters

### \_bookingId

`string` \| `null` \| `undefined`

### \_driverId

`string` \| `null` \| `undefined`

### \_isActive

`boolean`

## Returns

`void`

## Deprecated

El tracking GPS del conductor ahora se maneja globalmente desde
`useGlobalDriverTracking` montado en `app/_layout.tsx`. Este hook se mantiene
vacío para no romper imports existentes en pantallas que aún lo invocan.
No agregar lógica aquí: cualquier start/stop debe hacerse en
`common/services/driverLocationTask.ts`.
