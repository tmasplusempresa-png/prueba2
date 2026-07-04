[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [hooks/useWalletAndMembershipSync](../README.md) / useWalletAndMembershipSync

# Function: useWalletAndMembershipSync()

> **useWalletAndMembershipSync**(): `void`

Defined in: hooks/useWalletAndMembershipSync.ts:19

Mantiene billetera (users.wallet_balance) y membresías sincronizadas en
tiempo real durante toda la sesión. Se monta en _layout y reacciona al
cambio de auth.user para suscribirse / limpiar canales.

- users (UPDATE filtrado por auth_id) → dispatch setProfile, lo que refresca
  user.walletBalance, driver_active_status, etc.
- memberships (* filtrado por conductor) → re-dispatch fetchMemberships para
  que activeMembership y el bloqueo de handleAccept queden al día sin abrir
  la pantalla WalletDetails.

## Returns

`void`
