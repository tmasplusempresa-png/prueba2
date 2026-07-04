[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/services/BookingRealtimeService](../README.md) / BookingRealtimeService

# Class: BookingRealtimeService

Defined in: [common/services/BookingRealtimeService.ts:8](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/services/BookingRealtimeService.ts#L8)

Servicio para manejar suscripciones en tiempo real de Supabase para bookings

## Constructors

### Constructor

> **new BookingRealtimeService**(): `BookingRealtimeService`

#### Returns

`BookingRealtimeService`

## Methods

### subscribeToNewBookings()

> `static` **subscribeToNewBookings**(`city`, `onNewBooking`, `driverId?`): `RealtimeChannel`

Defined in: [common/services/BookingRealtimeService.ts:17](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/services/BookingRealtimeService.ts#L17)

Suscribe a nuevas reservas en una ciudad específica

#### Parameters

##### city

`string`

Ciudad del conductor

##### onNewBooking

(`booking`) => `void`

Callback cuando hay una nueva reserva

##### driverId?

`string`

ID del conductor (opcional)

#### Returns

`RealtimeChannel`

***

### subscribeToBookingUpdates()

> `static` **subscribeToBookingUpdates**(`bookingId`, `onChange`): `RealtimeChannel`

Defined in: [common/services/BookingRealtimeService.ts:70](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/services/BookingRealtimeService.ts#L70)

Suscribe a cambios de una reserva específica

#### Parameters

##### bookingId

`string`

ID de la reserva

##### onChange

(`booking`) => `void`

Callback cuando la reserva cambia

#### Returns

`RealtimeChannel`

***

### subscribeToLocationTracking()

> `static` **subscribeToLocationTracking**(`bookingId`, `onLocationUpdate`): `RealtimeChannel`

Defined in: [common/services/BookingRealtimeService.ts:112](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/services/BookingRealtimeService.ts#L112)

Suscribe al tracking de ubicación de un conductor

#### Parameters

##### bookingId

`string`

ID de la reserva

##### onLocationUpdate

(`location`) => `void`

Callback cuando hay actualización de ubicación

#### Returns

`RealtimeChannel`

***

### unsubscribe()

> `static` **unsubscribe**(`channelName`): `void`

Defined in: [common/services/BookingRealtimeService.ts:153](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/services/BookingRealtimeService.ts#L153)

Cancela una suscripción específica

#### Parameters

##### channelName

`string`

Nombre del canal a cancelar

#### Returns

`void`

***

### unsubscribeAll()

> `static` **unsubscribeAll**(): `void`

Defined in: [common/services/BookingRealtimeService.ts:165](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/services/BookingRealtimeService.ts#L165)

Cancela todas las suscripciones activas

#### Returns

`void`

***

### getActiveBookings()

> `static` **getActiveBookings**(`userId`, `userType`): `Promise`\<`never`[]\>

Defined in: [common/services/BookingRealtimeService.ts:179](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/services/BookingRealtimeService.ts#L179)

Obtiene reservas activas de un usuario

#### Parameters

##### userId

`string`

ID del usuario

##### userType

`"customer"` \| `"driver"`

Tipo de usuario ('customer' o 'driver')

#### Returns

`Promise`\<`never`[]\>

***

### updateBooking()

> `static` **updateBooking**(`bookingId`, `updates`): `Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `data`: `never`; \} \| \{ `data?`: `undefined`; `success`: `boolean`; `error`: `any`; \}\>

Defined in: [common/services/BookingRealtimeService.ts:210](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/services/BookingRealtimeService.ts#L210)

Actualiza el estado de una reserva

#### Parameters

##### bookingId

`string`

ID de la reserva

##### updates

`Record`\<`string`, `any`\>

Campos a actualizar

#### Returns

`Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `data`: `never`; \} \| \{ `data?`: `undefined`; `success`: `boolean`; `error`: `any`; \}\>

***

### insertTracking()

> `static` **insertTracking**(`bookingId`, `driverId`, `location`): `Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `data`: `never`; \} \| \{ `data?`: `undefined`; `success`: `boolean`; `error`: `any`; \}\>

Defined in: [common/services/BookingRealtimeService.ts:240](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/services/BookingRealtimeService.ts#L240)

Inserta ubicación de tracking

#### Parameters

##### bookingId

`string`

ID de la reserva

##### driverId

`string`

ID del conductor

##### location

Objeto con lat, lng, speed, heading

###### lat

`number`

###### lng

`number`

###### speed?

`number`

###### heading?

`number`

#### Returns

`Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `data`: `never`; \} \| \{ `data?`: `undefined`; `success`: `boolean`; `error`: `any`; \}\>
