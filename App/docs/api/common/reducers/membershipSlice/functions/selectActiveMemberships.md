[**TmasPlus — Referencia de código**](../../../../README.md)

***

[TmasPlus — Referencia de código](../../../../README.md) / [common/reducers/membershipSlice](../README.md) / selectActiveMemberships

# Function: selectActiveMemberships()

> **selectActiveMemberships**(`state`, `uid`): `any`[]

Defined in: [common/reducers/membershipSlice.tsx:275](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/common/reducers/membershipSlice.tsx#L275)

## Parameters

### state

#### bookings

`BookingsState` = `bookingsReducer`

#### auth

`AuthState` = `authReducer`

#### wallet

`WalletState` = `walletReducer`

#### vehicles

`VehicleState` = `vehicleReducer`

#### promodata

\{ `error`: `null`; `loading`: `boolean`; `promos`: `any`; \} \| \{ `promos`: `never`[]; `loading`: `boolean`; `error`: `any`; \} = `promosReducer`

#### complains

`ComplainState` = `complainReducer`

#### memberships

`MembershipState` = `membershipReducer`

#### settings

`SettingsState` = `settingsReducer`

### uid

`string`

## Returns

`any`[]
