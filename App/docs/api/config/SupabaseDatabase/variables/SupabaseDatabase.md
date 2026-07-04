[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/SupabaseDatabase](../README.md) / SupabaseDatabase

# Variable: SupabaseDatabase

> `const` **SupabaseDatabase**: `object`

Defined in: [config/SupabaseDatabase.ts:217](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/SupabaseDatabase.ts#L217)

## Type Declaration

### select

> `readonly` **select**: \<`T`\>(`table`, `options`, `filters`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`T`[]\>\>

Selecciona registros con tipado completo

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### table

`string`

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md) = `{}`

##### filters?

[`FilterCondition`](../interfaces/FilterCondition.md)[] = `[]`

#### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`T`[]\>\>

### selectWithPagination

> `readonly` **selectWithPagination**: \<`T`\>(`table`, `page`, `pageSize`, `options`, `filters`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<[`PaginationResult`](../interfaces/PaginationResult.md)\<`T`\>\>\>

Selecciona con paginacion avanzada

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### table

`string`

##### page?

`number` = `1`

##### pageSize?

`number` = `DB_CONFIG.defaultPageSize`

##### options?

[`QueryOptions`](../interfaces/QueryOptions.md) = `{}`

##### filters?

[`FilterCondition`](../interfaces/FilterCondition.md)[] = `[]`

#### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<[`PaginationResult`](../interfaces/PaginationResult.md)\<`T`\>\>\>

### selectById

> `readonly` **selectById**: \<`T`\>(`table`, `id`, `options`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`T`\>\>

Selecciona un registro por ID con tipado

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### table

`string`

##### id

`string`

##### options?

`Pick`\<[`QueryOptions`](../interfaces/QueryOptions.md), `"select"`\> = `{}`

#### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`T`\>\>

### insert

> `readonly` **insert**: \<`T`\>(`table`, `data`, `options`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`T` \| `T`[]\>\>

Inserta registros con tipado estricto

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### table

`string`

##### data

`any`

##### options?

`Pick`\<[`QueryOptions`](../interfaces/QueryOptions.md), `"select"`\> = `{}`

#### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`T` \| `T`[]\>\>

### update

> `readonly` **update**: \<`T`\>(`table`, `id`, `data`, `options`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`T`\>\>

Actualiza registro por ID con tipado

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### table

`string`

##### id

`string`

##### data

`any`

##### options?

`Pick`\<[`QueryOptions`](../interfaces/QueryOptions.md), `"select"`\> = `{}`

#### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`T`\>\>

### updateMany

> `readonly` **updateMany**: \<`T`\>(`table`, `data`, `filters`, `options`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`T`[]\>\>

Actualiza multiples registros

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### table

`string`

##### data

`any`

##### filters

[`FilterCondition`](../interfaces/FilterCondition.md)[]

##### options?

`Pick`\<[`QueryOptions`](../interfaces/QueryOptions.md), `"select"`\> = `{}`

#### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`T`[]\>\>

### delete

> `readonly` **delete**: (`table`, `id`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`null`\>\>

Elimina registro por ID

#### Parameters

##### table

`string`

##### id

`string`

#### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`null`\>\>

### deleteMany

> `readonly` **deleteMany**: (`table`, `filters`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`null`\>\>

Elimina multiples registros

#### Parameters

##### table

`string`

##### filters

[`FilterCondition`](../interfaces/FilterCondition.md)[]

#### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`null`\>\>

### count

> `readonly` **count**: (`table`, `filters`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`number`\>\>

Cuenta registros con filtros

#### Parameters

##### table

`string`

##### filters?

[`FilterCondition`](../interfaces/FilterCondition.md)[] = `[]`

#### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`number`\>\>

### rpc

> `readonly` **rpc**: \<`T`\>(`functionName`, `parameters`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`T`\>\>

Ejecuta funciones RPC personalizadas

#### Type Parameters

##### T

`T` = `any`

#### Parameters

##### functionName

`string`

##### parameters?

`any` = `{}`

#### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`T`\>\>
