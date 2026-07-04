[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/services/OtpService](../README.md) / OtpService

# Variable: OtpService

> `const` **OtpService**: `object`

Defined in: [common/services/OtpService.ts:7](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/services/OtpService.ts#L7)

Servicio para OTP: generación, guardado y validación

## Type Declaration

### generateOtp()

> **generateOtp**(): `string`

Genera un OTP de 4 dígitos (0000-9999)

#### Returns

`string`

### saveOtp()

> **saveOtp**(`bookingId`, `otpCode`): `Promise`\<`boolean`\>

Guarda el OTP en la reserva (Supabase)

#### Parameters

##### bookingId

`string`

##### otpCode

`string`

#### Returns

`Promise`\<`boolean`\>

### validateOtp()

> **validateOtp**(`bookingId`, `inputOtp`): `Promise`\<`boolean`\>

Valida el OTP contra Supabase

#### Parameters

##### bookingId

`string`

##### inputOtp

`string`

#### Returns

`Promise`\<`boolean`\>

### getOtp()

> **getOtp**(`bookingId`): `Promise`\<`any`\>

Obtiene el OTP actual de una reserva

#### Parameters

##### bookingId

`string`

#### Returns

`Promise`\<`any`\>

### markOtpAsVerified()

> **markOtpAsVerified**(`bookingId`): `Promise`\<`boolean`\>

Marca el OTP como verificado

#### Parameters

##### bookingId

`string`

#### Returns

`Promise`\<`boolean`\>
