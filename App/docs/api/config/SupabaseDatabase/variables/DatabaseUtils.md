[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/SupabaseDatabase](../README.md) / DatabaseUtils

# Variable: DatabaseUtils

> `const` **DatabaseUtils**: `object`

Defined in: [config/SupabaseDatabase.ts:70](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/SupabaseDatabase.ts#L70)

## Type Declaration

### handlePostgresError

> `readonly` **handlePostgresError**: (`error`, `context?`) => `string`

Maneja errores especificos de PostgreSQL con contexto T+Plus

#### Parameters

##### error

`PostgrestError`

##### context?

`string`

#### Returns

`string`

### applyFilters

> `readonly` **applyFilters**: (`query`, `filters`) => `any`

Aplica filtros de manera type-safe

#### Parameters

##### query

`any`

##### filters

[`FilterCondition`](../interfaces/FilterCondition.md)[]

#### Returns

`any`

### applyQueryOptions

> `readonly` **applyQueryOptions**: (`query`, `options`) => `any`

Aplica opciones de consulta con validacion

#### Parameters

##### query

`any`

##### options

[`QueryOptions`](../interfaces/QueryOptions.md)

#### Returns

`any`

### withRetry

> `readonly` **withRetry**: \<`T`\>(`operation`, `attempts`, `baseDelay`) => `Promise`\<`T`\>

Implementa retry inteligente con backoff exponencial

#### Type Parameters

##### T

`T`

#### Parameters

##### operation

() => `Promise`\<`T`\>

##### attempts?

`number` = `DB_CONFIG.retryAttempts`

##### baseDelay?

`number` = `DB_CONFIG.retryDelay`

#### Returns

`Promise`\<`T`\>

### isRetryableError

> `readonly` **isRetryableError**: (`error`) => `boolean`

Determina si un error es recuperable

#### Parameters

##### error

`any`

#### Returns

`boolean`

### calculatePagination

> `readonly` **calculatePagination**: (`count`, `page`, `pageSize`) => [`PaginationResult`](../interfaces/PaginationResult.md)\<`any`\>

Calcula paginacion

#### Parameters

##### count

`number`

##### page

`number`

##### pageSize

`number`

#### Returns

[`PaginationResult`](../interfaces/PaginationResult.md)\<`any`\>
