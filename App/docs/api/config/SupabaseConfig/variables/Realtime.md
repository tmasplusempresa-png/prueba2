[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/SupabaseConfig](../README.md) / Realtime

# Variable: Realtime

> `const` **Realtime**: `object`

Defined in: [config/SupabaseConfig.ts:555](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/SupabaseConfig.ts#L555)

## Type Declaration

### subscribeToBookings

> `readonly` **subscribeToBookings**: (`userId`, `callback`) => `RealtimeChannel`

Suscribirse a cambios de reservas en tiempo real

#### Parameters

##### userId

`string`

##### callback

(`payload`) => `void`

#### Returns

`RealtimeChannel`

### subscribeToTracking

> `readonly` **subscribeToTracking**: (`bookingId`, `callback`) => `RealtimeChannel`

Suscribirse a tracking de viajes en tiempo real

#### Parameters

##### bookingId

`string`

##### callback

(`payload`) => `void`

#### Returns

`RealtimeChannel`

### subscribeToNotifications

> `readonly` **subscribeToNotifications**: (`userId`, `callback`) => `RealtimeChannel`

Suscribirse a notificaciones en tiempo real

#### Parameters

##### userId

`string`

##### callback

(`payload`) => `void`

#### Returns

`RealtimeChannel`
