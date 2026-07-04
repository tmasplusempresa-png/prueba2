[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/SupabaseConfig](../README.md) / DevUtils

# Variable: DevUtils

> `const` **DevUtils**: `object`

Defined in: [config/SupabaseConfig.ts:409](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/SupabaseConfig.ts#L409)

## Type Declaration

### logConnectionInfo

> `readonly` **logConnectionInfo**: () => `Promise`\<`void`\>

Log completo de informacion de conexion en desarrollo

#### Returns

`Promise`\<`void`\>

### runDiagnostics

> `readonly` **runDiagnostics**: () => `Promise`\<\{ `config`: `boolean`; `connection`: `boolean`; `database`: `boolean`; `auth`: `boolean`; \}\>

Ejecuta diagnosticos completos del sistema

#### Returns

`Promise`\<\{ `config`: `boolean`; `connection`: `boolean`; `database`: `boolean`; `auth`: `boolean`; \}\>
