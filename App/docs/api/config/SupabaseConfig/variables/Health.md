[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/SupabaseConfig](../README.md) / Health

# Variable: Health

> `const` **Health**: `object`

Defined in: [config/SupabaseConfig.ts:291](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/SupabaseConfig.ts#L291)

## Type Declaration

### testConnection

> `readonly` **testConnection**: () => `Promise`\<[`ConnectionStatus`](../interfaces/ConnectionStatus.md)\>

Prueba la conexion a Supabase con verificacion completa

#### Returns

`Promise`\<[`ConnectionStatus`](../interfaces/ConnectionStatus.md)\>

### checkDatabaseHealth

> `readonly` **checkDatabaseHealth**: () => `Promise`\<[`DatabaseHealth`](../interfaces/DatabaseHealth.md)\>

Verifica la salud de la base de datos T+Plus

#### Returns

`Promise`\<[`DatabaseHealth`](../interfaces/DatabaseHealth.md)\>

### validateConfig

> `readonly` **validateConfig**: () => `object`

Verifica el estado completo de la configuracion

#### Returns

`object`

##### isValid

> **isValid**: `boolean`

##### errors

> **errors**: `string`[]

##### warnings

> **warnings**: `string`[]
