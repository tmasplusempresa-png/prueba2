[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [hooks/useBookingRequestTimer](../README.md) / useBookingRequestTimer

# Function: useBookingRequestTimer()

> **useBookingRequestTimer**(`__namedParameters`): `object`

Defined in: hooks/useBookingRequestTimer.ts:5

## Parameters

### \_\_namedParameters

#### expiresAt?

`string` \| `null`

#### createdAt?

`string` \| `null`

#### expiresInSeconds?

`number` = `REQUEST_EXPIRATION_SECONDS`

#### onExpired?

() => `void`

## Returns

`object`

### timeRemaining

> **timeRemaining**: `number`

### isExpired

> **isExpired**: `boolean`

### formatTime

> **formatTime**: (`secs`) => `string`

#### Parameters

##### secs?

`number` = `timeRemaining`

#### Returns

`string`
