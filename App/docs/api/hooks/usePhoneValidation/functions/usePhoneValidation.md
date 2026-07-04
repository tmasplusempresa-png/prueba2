[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [hooks/usePhoneValidation](../README.md) / usePhoneValidation

# Function: usePhoneValidation()

> **usePhoneValidation**(`phone`, `phoneFormatValid`, `countryCode?`, `enabled?`): `object`

Defined in: [hooks/usePhoneValidation.ts:14](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/hooks/usePhoneValidation.ts#L14)

Hook para validación de teléfono con debounce mejorado
Evita hacer demasiadas validaciones al mismo tiempo

## Parameters

### phone

`string`

Teléfono (solo números)

### phoneFormatValid

`boolean`

Si el formato es válido

### countryCode?

`string` = `'+57'`

Código del país

### enabled?

`boolean` = `true`

## Returns

`object`

### exists

> **exists**: `boolean`

### isChecking

> **isChecking**: `boolean`

### error

> **error**: `string` \| `null`
