[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/services/ValidationService](../README.md) / ValidationService

# Variable: ValidationService

> `const` **ValidationService**: `object`

Defined in: [common/services/ValidationService.ts:7](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/services/ValidationService.ts#L7)

Servicio de validación contra Supabase
Verifica existencia de email y teléfono en BD

## Type Declaration

### checkEmailExists()

> **checkEmailExists**(`email`): `Promise`\<\{ `exists`: `boolean`; `error?`: `string`; \}\>

Verifica si un email ya existe en la BD

#### Parameters

##### email

`string`

Email a verificar

#### Returns

`Promise`\<\{ `exists`: `boolean`; `error?`: `string`; \}\>

### checkPhoneExists()

> **checkPhoneExists**(`phone`, `countryCode?`): `Promise`\<\{ `exists`: `boolean`; `error?`: `string`; \}\>

Verifica si un teléfono ya existe en la BD

#### Parameters

##### phone

`string`

Teléfono solo números (3133752565)

##### countryCode?

`string` = `'+57'`

Código país (+57, +1, etc)

#### Returns

`Promise`\<\{ `exists`: `boolean`; `error?`: `string`; \}\>
