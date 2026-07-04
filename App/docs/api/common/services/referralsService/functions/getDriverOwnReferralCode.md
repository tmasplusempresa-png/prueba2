[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/services/referralsService](../README.md) / getDriverOwnReferralCode

# Function: getDriverOwnReferralCode()

> **getDriverOwnReferralCode**(`authId`, `signal?`): `Promise`\<[`DriverReferralCode`](../interfaces/DriverReferralCode.md) \| `null`\>

Defined in: common/services/referralsService.ts:33

Lee el código de referido propio del usuario (AAA-XXXXX) y su conteo de
referidos desde la tabla `referral_codes` del proyecto de la App.

El código lo genera el trigger `handle_new_user` (ver
sql/create-referral-system-app.sql). Mientras el trigger no lo haya creado,
esta función devuelve `null` y la UI debe mostrar "Generando…".

Usa el JWT del usuario (getSupabaseAuthHeaders) porque la fila está protegida
por RLS: cada usuario solo puede leer su propio código.

## Parameters

### authId

`string`

auth.users.id (o users.id) del usuario actual.

### signal?

`AbortSignal`

## Returns

`Promise`\<[`DriverReferralCode`](../interfaces/DriverReferralCode.md) \| `null`\>
