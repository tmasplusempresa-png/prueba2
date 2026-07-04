[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/AppConfig](../README.md) / default

# Variable: default

> **default**: `object`

Defined in: [config/AppConfig.ts:253](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/AppConfig.ts#L253)

## Type Declaration

### AppConfig

> **AppConfig**: [`AppConfiguration`](../interfaces/AppConfiguration.md)

### SupabaseConfig

> **SupabaseConfig**: [`SupabaseConfiguration`](../interfaces/SupabaseConfiguration.md)

### StorageBuckets

> **StorageBuckets**: [`StorageConfiguration`](../interfaces/StorageConfiguration.md)

### GoogleMapsConfig

> **GoogleMapsConfig**: [`GoogleMapsConfiguration`](../interfaces/GoogleMapsConfiguration.md)

### API\_KEY

> **API\_KEY**: `string`

### getGoogleMapsApiKey

> **getGoogleMapsApiKey**: () => `string`

#### Returns

`string`

### validateConfiguration

> **validateConfiguration**: () => `object`

#### Returns

`object`

##### isValid

> **isValid**: `boolean`

##### errors

> **errors**: `string`[]

##### warnings

> **warnings**: `string`[]

##### summary

> **summary**: `string`

### Environment

> **Environment**: `object`

#### Environment.isDevelopment

> `readonly` **isDevelopment**: `boolean`

#### Environment.isProduction

> `readonly` **isProduction**: `boolean`

#### Environment.isTest

> `readonly` **isTest**: `boolean`

#### Environment.logConfig

> `readonly` **logConfig**: () => `void`

##### Returns

`void`
