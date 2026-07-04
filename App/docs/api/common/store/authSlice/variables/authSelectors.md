[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/store/authSlice](../README.md) / authSelectors

# Variable: authSelectors

> `const` **authSelectors**: `object`

Defined in: [common/store/authSlice.ts:204](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/store/authSlice.ts#L204)

## Type Declaration

### selectIsAuthenticated

> **selectIsAuthenticated**: (`state`) => `boolean`

#### Parameters

##### state

###### auth

[`AuthState`](../interfaces/AuthState.md)

#### Returns

`boolean`

### selectUser

> **selectUser**: (`state`) => `User` \| `null`

#### Parameters

##### state

###### auth

[`AuthState`](../interfaces/AuthState.md)

#### Returns

`User` \| `null`

### selectProfile

> **selectProfile**: (`state`) => [`UserProfile`](../interfaces/UserProfile.md) \| `null`

#### Parameters

##### state

###### auth

[`AuthState`](../interfaces/AuthState.md)

#### Returns

[`UserProfile`](../interfaces/UserProfile.md) \| `null`

### selectSession

> **selectSession**: (`state`) => `Session` \| `null`

#### Parameters

##### state

###### auth

[`AuthState`](../interfaces/AuthState.md)

#### Returns

`Session` \| `null`

### selectLoading

> **selectLoading**: (`state`) => `boolean`

#### Parameters

##### state

###### auth

[`AuthState`](../interfaces/AuthState.md)

#### Returns

`boolean`

### selectError

> **selectError**: (`state`) => [`AuthError`](../interfaces/AuthError.md)

#### Parameters

##### state

###### auth

[`AuthState`](../interfaces/AuthState.md)

#### Returns

[`AuthError`](../interfaces/AuthError.md)

### selectUserType

> **selectUserType**: (`state`) => `"customer"` \| `"driver"` \| `"company"` \| `null`

#### Parameters

##### state

###### auth

[`AuthState`](../interfaces/AuthState.md)

#### Returns

`"customer"` \| `"driver"` \| `"company"` \| `null`

### selectWalletBalance

> **selectWalletBalance**: (`state`) => `number`

#### Parameters

##### state

###### auth

[`AuthState`](../interfaces/AuthState.md)

#### Returns

`number`

### selectIsVerified

> **selectIsVerified**: (`state`) => `boolean`

#### Parameters

##### state

###### auth

[`AuthState`](../interfaces/AuthState.md)

#### Returns

`boolean`

### selectDriverActiveStatus

> **selectDriverActiveStatus**: (`state`) => `boolean`

#### Parameters

##### state

###### auth

[`AuthState`](../interfaces/AuthState.md)

#### Returns

`boolean`

### selectVerificationId

> **selectVerificationId**: (`state`) => `string` \| `null`

#### Parameters

##### state

###### auth

[`AuthState`](../interfaces/AuthState.md)

#### Returns

`string` \| `null`
