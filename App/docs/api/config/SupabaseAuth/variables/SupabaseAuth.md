[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/SupabaseAuth](../README.md) / SupabaseAuth

# Variable: SupabaseAuth

> `const` **SupabaseAuth**: `object`

Defined in: [config/SupabaseAuth.ts:135](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/SupabaseAuth.ts#L135)

## Type Declaration

### signIn

> **signIn**: (`credentials`) => `Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`Session`\>\>

Inicia sesion con email y contraseña

#### Parameters

##### credentials

[`LoginCredentials`](../interfaces/LoginCredentials.md)

#### Returns

`Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`Session`\>\>

### signUp

> **signUp**: (`credentials`) => `Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`User`\>\>

Registra nuevo usuario y crea membresía PENDIENTE

#### Parameters

##### credentials

[`RegisterCredentials`](../interfaces/RegisterCredentials.md)

#### Returns

`Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`User`\>\>

### signOut

> **signOut**: () => `Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`null`\>\>

Cierra sesion del usuario actual

#### Returns

`Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`null`\>\>

### getCurrentUser

> **getCurrentUser**: () => `Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`User`\>\>

Obtiene el usuario actual

#### Returns

`Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`User`\>\>

### getCurrentSession

> **getCurrentSession**: () => `Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`Session`\>\>

Obtiene la sesion actual

#### Returns

`Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`Session`\>\>

### isAuthenticated

> **isAuthenticated**: () => `Promise`\<`boolean`\>

Verifica si el usuario esta autenticado

#### Returns

`Promise`\<`boolean`\>

### resetPassword

> **resetPassword**: (`request`) => `Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`null`\>\>

Solicita recuperacion de contraseña

#### Parameters

##### request

[`PasswordResetRequest`](../interfaces/PasswordResetRequest.md)

#### Returns

`Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`null`\>\>

### updatePassword

> **updatePassword**: (`request`) => `Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`User`\>\>

Actualiza contraseña del usuario actual

#### Parameters

##### request

[`PasswordUpdateRequest`](../interfaces/PasswordUpdateRequest.md)

#### Returns

`Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`User`\>\>

### updateUserData

> **updateUserData**: (`userData`) => `Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`User`\>\>

Actualiza datos del usuario actual

#### Parameters

##### userData

[`UserUpdateData`](../interfaces/UserUpdateData.md)

#### Returns

`Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`User`\>\>

### refreshSession

> **refreshSession**: () => `Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`Session`\>\>

Refresca el token de sesion

#### Returns

`Promise`\<[`AuthResult`](../interfaces/AuthResult.md)\<`Session`\>\>
