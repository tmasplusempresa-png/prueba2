[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/SupabaseConfig](../README.md) / getSupabaseAuthHeaders

# Function: getSupabaseAuthHeaders()

> **getSupabaseAuthHeaders**(`includeContentType?`): `Promise`\<`Record`\<`string`, `string`\>\>

Defined in: [config/SupabaseConfig.ts:134](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/SupabaseConfig.ts#L134)

Build auth headers for direct Supabase REST API calls.
Reads JWT from AsyncStorage, validates expiry, falls back to anon key.

## Parameters

### includeContentType?

`boolean` = `false`

## Returns

`Promise`\<`Record`\<`string`, `string`\>\>
