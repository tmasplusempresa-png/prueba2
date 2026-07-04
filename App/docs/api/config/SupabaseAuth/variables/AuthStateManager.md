[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/SupabaseAuth](../README.md) / AuthStateManager

# Variable: AuthStateManager

> `const` **AuthStateManager**: `object`

Defined in: [config/SupabaseAuth.ts:433](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/SupabaseAuth.ts#L433)

## Type Declaration

### onAuthStateChange

> **onAuthStateChange**: (`callback`) => `Subscription`

Configura listener para cambios de estado de autenticacion

#### Parameters

##### callback

(`authState`) => `void`

#### Returns

`Subscription`

### getAuthState

> **getAuthState**: () => `Promise`\<[`AuthState`](../interfaces/AuthState.md)\>

Obtiene el estado actual de autenticacion

#### Returns

`Promise`\<[`AuthState`](../interfaces/AuthState.md)\>
