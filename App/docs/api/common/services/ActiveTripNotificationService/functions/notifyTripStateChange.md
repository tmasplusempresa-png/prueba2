[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/services/ActiveTripNotificationService](../README.md) / notifyTripStateChange

# Function: notifyTripStateChange()

> **notifyTripStateChange**(`booking`, `role`, `previousStatus?`): `Promise`\<`void`\>

Defined in: common/services/ActiveTripNotificationService.ts:162

✅ MEJORADO: Notifica cada cambio de estado del viaje
Se llama cuando hay transiciones: ACCEPTED → ARRIVED → STARTED → IN_PROGRESS → COMPLETED

## Parameters

### booking

`any`

### role

`"customer"` \| `"driver"`

### previousStatus?

`string`

## Returns

`Promise`\<`void`\>
