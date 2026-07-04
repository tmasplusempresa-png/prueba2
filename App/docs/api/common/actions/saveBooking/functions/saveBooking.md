[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/actions/saveBooking](../README.md) / saveBooking

# Function: saveBooking()

> **saveBooking**(`bookingData`): `Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `uid`: `any`; `reference`: `any`; `booking`: `any`; \} \| \{ `uid?`: `undefined`; `reference?`: `undefined`; `booking?`: `undefined`; `success`: `boolean`; `error`: `any`; \}\>

Defined in: [common/actions/saveBooking.ts:8](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/actions/saveBooking.ts#L8)

Guarda una nueva reserva en Supabase

## Parameters

### bookingData

`any`

Datos de la reserva a crear

## Returns

`Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `uid`: `any`; `reference`: `any`; `booking`: `any`; \} \| \{ `uid?`: `undefined`; `reference?`: `undefined`; `booking?`: `undefined`; `success`: `boolean`; `error`: `any`; \}\>

Objeto con success y uid/error
