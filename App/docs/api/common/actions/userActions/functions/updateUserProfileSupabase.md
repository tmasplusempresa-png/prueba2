[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/actions/userActions](../README.md) / updateUserProfileSupabase

# Function: updateUserProfileSupabase()

> **updateUserProfileSupabase**(`userId`, `profileData`, `dispatch`, `imageUri?`): `Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `data`: `never`; `updatedFields`: `string`[]; \} \| \{ `data?`: `undefined`; `updatedFields?`: `undefined`; `success`: `boolean`; `error`: `any`; \}\>

Defined in: [common/actions/userActions.ts:96](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/actions/userActions.ts#L96)

Actualiza el perfil del usuario en Supabase y Redux

## Parameters

### userId

`string`

ID del usuario en la tabla users

### profileData

`Record`\<`string`, `any`\>

Datos a actualizar (campos personales)

### dispatch

`Dispatch`

Dispatch de Redux

### imageUri?

`string`

(opcional) URI de imagen para subir

## Returns

`Promise`\<\{ `error?`: `undefined`; `success`: `boolean`; `data`: `never`; `updatedFields`: `string`[]; \} \| \{ `data?`: `undefined`; `updatedFields?`: `undefined`; `success`: `boolean`; `error`: `any`; \}\>

Resultado de la operación
