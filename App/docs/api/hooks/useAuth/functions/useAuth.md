[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [hooks/useAuth](../README.md) / useAuth

# Function: useAuth()

> **useAuth**(): `object`

Defined in: [hooks/useAuth.ts:23](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/hooks/useAuth.ts#L23)

## Returns

`object`

### login

> **login**: (`payload`) => `Promise`\<`User`\>

#### Parameters

##### payload

`LoginPayload`

#### Returns

`Promise`\<`User`\>

### signup

> **signup**: (`payload`) => `Promise`\<\{ `user`: `User`; `requiresConfirmation`: `boolean`; `alreadyExists`: `boolean`; \}\>

#### Parameters

##### payload

`SignupPayload`

#### Returns

`Promise`\<\{ `user`: `User`; `requiresConfirmation`: `boolean`; `alreadyExists`: `boolean`; \}\>

### error

> **error**: `string`

### setError

> **setError**: `Dispatch`\<`SetStateAction`\<`string`\>\>
