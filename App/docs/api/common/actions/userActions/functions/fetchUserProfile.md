[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/actions/userActions](../README.md) / fetchUserProfile

# Function: fetchUserProfile()

> **fetchUserProfile**(`authId`, `dispatch`): `Promise`\<\{ `success`: `boolean`; `profile?`: [`UserProfile`](../../../store/authSlice/interfaces/UserProfile.md); `error?`: `string`; \}\>

Defined in: [common/actions/userActions.ts:164](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/actions/userActions.ts#L164)

Obtiene el perfil del usuario desde Supabase y lo guarda en Redux

## Parameters

### authId

`string`

### dispatch

`Dispatch`

## Returns

`Promise`\<\{ `success`: `boolean`; `profile?`: [`UserProfile`](../../../store/authSlice/interfaces/UserProfile.md); `error?`: `string`; \}\>
