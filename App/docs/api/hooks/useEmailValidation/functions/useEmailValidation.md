[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [hooks/useEmailValidation](../README.md) / useEmailValidation

# Function: useEmailValidation()

> **useEmailValidation**(`email`, `emailFormatValid`, `enabled?`): `object`

Defined in: [hooks/useEmailValidation.ts:13](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/hooks/useEmailValidation.ts#L13)

Hook para validación de email con debounce mejorado
Evita hacer demasiadas validaciones al mismo tiempo

## Parameters

### email

`string`

Email a validar

### emailFormatValid

`boolean`

Si el formato es válido

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
