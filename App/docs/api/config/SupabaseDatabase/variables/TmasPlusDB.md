[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/SupabaseDatabase](../README.md) / TmasPlusDB

# Variable: TmasPlusDB

> `const` **TmasPlusDB**: `object`

Defined in: [config/SupabaseDatabase.ts:658](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/SupabaseDatabase.ts#L658)

## Type Declaration

### users

> `readonly` **users**: `object`

OPERACIONES DE USUARIOS

#### users.findByEmail

> `readonly` **findByEmail**: (`email`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `auth_id`: `string` \| `null`; `email`: `string`; `first_name`: `string`; `last_name`: `string`; `mobile`: `string` \| `null`; `user_type`: `string`; `wallet_balance`: `number`; `location`: [`Json`](../../database.types/type-aliases/Json.md); `profile_image`: `string` \| `null`; `rating`: `number`; `total_rides`: `number`; `is_verified`: `boolean`; `approved`: `boolean`; `blocked`: `boolean`; `referral_id`: `string` \| `null`; `referred_by_code`: `string` \| `null`; `document_type`: `string` \| `null`; `document_number`: `string` \| `null`; `city`: `string` \| `null`; `driver_active_status`: `boolean`; `license_number`: `string` \| `null`; `license_image`: `string` \| `null`; `license_image_back`: `string` \| `null`; `soat_image`: `string` \| `null`; `card_prop_image`: `string` \| `null`; `card_prop_image_bk`: `string` \| `null`; `verify_id_image`: `string` \| `null`; `verify_id_image_bk`: `string` \| `null`; `push_token`: `string` \| `null`; `user_platform`: `string` \| `null`; `created_at`: `string`; `updated_at`: `string`; \}\>\>

Busca usuario por email

##### Parameters

###### email

`string`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `auth_id`: `string` \| `null`; `email`: `string`; `first_name`: `string`; `last_name`: `string`; `mobile`: `string` \| `null`; `user_type`: `string`; `wallet_balance`: `number`; `location`: [`Json`](../../database.types/type-aliases/Json.md); `profile_image`: `string` \| `null`; `rating`: `number`; `total_rides`: `number`; `is_verified`: `boolean`; `approved`: `boolean`; `blocked`: `boolean`; `referral_id`: `string` \| `null`; `referred_by_code`: `string` \| `null`; `document_type`: `string` \| `null`; `document_number`: `string` \| `null`; `city`: `string` \| `null`; `driver_active_status`: `boolean`; `license_number`: `string` \| `null`; `license_image`: `string` \| `null`; `license_image_back`: `string` \| `null`; `soat_image`: `string` \| `null`; `card_prop_image`: `string` \| `null`; `card_prop_image_bk`: `string` \| `null`; `verify_id_image`: `string` \| `null`; `verify_id_image_bk`: `string` \| `null`; `push_token`: `string` \| `null`; `user_platform`: `string` \| `null`; `created_at`: `string`; `updated_at`: `string`; \}\>\>

#### users.findByAuthId

> `readonly` **findByAuthId**: (`authId`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `auth_id`: `string` \| `null`; `email`: `string`; `first_name`: `string`; `last_name`: `string`; `mobile`: `string` \| `null`; `user_type`: `string`; `wallet_balance`: `number`; `location`: [`Json`](../../database.types/type-aliases/Json.md); `profile_image`: `string` \| `null`; `rating`: `number`; `total_rides`: `number`; `is_verified`: `boolean`; `approved`: `boolean`; `blocked`: `boolean`; `referral_id`: `string` \| `null`; `referred_by_code`: `string` \| `null`; `document_type`: `string` \| `null`; `document_number`: `string` \| `null`; `city`: `string` \| `null`; `driver_active_status`: `boolean`; `license_number`: `string` \| `null`; `license_image`: `string` \| `null`; `license_image_back`: `string` \| `null`; `soat_image`: `string` \| `null`; `card_prop_image`: `string` \| `null`; `card_prop_image_bk`: `string` \| `null`; `verify_id_image`: `string` \| `null`; `verify_id_image_bk`: `string` \| `null`; `push_token`: `string` \| `null`; `user_platform`: `string` \| `null`; `created_at`: `string`; `updated_at`: `string`; \}\>\>

Busca usuario por auth_id

##### Parameters

###### authId

`string`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `auth_id`: `string` \| `null`; `email`: `string`; `first_name`: `string`; `last_name`: `string`; `mobile`: `string` \| `null`; `user_type`: `string`; `wallet_balance`: `number`; `location`: [`Json`](../../database.types/type-aliases/Json.md); `profile_image`: `string` \| `null`; `rating`: `number`; `total_rides`: `number`; `is_verified`: `boolean`; `approved`: `boolean`; `blocked`: `boolean`; `referral_id`: `string` \| `null`; `referred_by_code`: `string` \| `null`; `document_type`: `string` \| `null`; `document_number`: `string` \| `null`; `city`: `string` \| `null`; `driver_active_status`: `boolean`; `license_number`: `string` \| `null`; `license_image`: `string` \| `null`; `license_image_back`: `string` \| `null`; `soat_image`: `string` \| `null`; `card_prop_image`: `string` \| `null`; `card_prop_image_bk`: `string` \| `null`; `verify_id_image`: `string` \| `null`; `verify_id_image_bk`: `string` \| `null`; `push_token`: `string` \| `null`; `user_platform`: `string` \| `null`; `created_at`: `string`; `updated_at`: `string`; \}\>\>

#### users.getActiveDriversByCity

> `readonly` **getActiveDriversByCity**: (`city`, `limit`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`object`[]\>\>

Obtiene conductores activos por ciudad

##### Parameters

###### city

`string`

###### limit?

`number` = `20`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`object`[]\>\>

#### users.updateWalletBalance

> `readonly` **updateWalletBalance**: (`userId`, `newBalance`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `auth_id`: `string` \| `null`; `email`: `string`; `first_name`: `string`; `last_name`: `string`; `mobile`: `string` \| `null`; `user_type`: `string`; `wallet_balance`: `number`; `location`: [`Json`](../../database.types/type-aliases/Json.md); `profile_image`: `string` \| `null`; `rating`: `number`; `total_rides`: `number`; `is_verified`: `boolean`; `approved`: `boolean`; `blocked`: `boolean`; `referral_id`: `string` \| `null`; `referred_by_code`: `string` \| `null`; `document_type`: `string` \| `null`; `document_number`: `string` \| `null`; `city`: `string` \| `null`; `driver_active_status`: `boolean`; `license_number`: `string` \| `null`; `license_image`: `string` \| `null`; `license_image_back`: `string` \| `null`; `soat_image`: `string` \| `null`; `card_prop_image`: `string` \| `null`; `card_prop_image_bk`: `string` \| `null`; `verify_id_image`: `string` \| `null`; `verify_id_image_bk`: `string` \| `null`; `push_token`: `string` \| `null`; `user_platform`: `string` \| `null`; `created_at`: `string`; `updated_at`: `string`; \}\>\>

Actualiza balance de wallet

##### Parameters

###### userId

`string`

###### newBalance

`number`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `auth_id`: `string` \| `null`; `email`: `string`; `first_name`: `string`; `last_name`: `string`; `mobile`: `string` \| `null`; `user_type`: `string`; `wallet_balance`: `number`; `location`: [`Json`](../../database.types/type-aliases/Json.md); `profile_image`: `string` \| `null`; `rating`: `number`; `total_rides`: `number`; `is_verified`: `boolean`; `approved`: `boolean`; `blocked`: `boolean`; `referral_id`: `string` \| `null`; `referred_by_code`: `string` \| `null`; `document_type`: `string` \| `null`; `document_number`: `string` \| `null`; `city`: `string` \| `null`; `driver_active_status`: `boolean`; `license_number`: `string` \| `null`; `license_image`: `string` \| `null`; `license_image_back`: `string` \| `null`; `soat_image`: `string` \| `null`; `card_prop_image`: `string` \| `null`; `card_prop_image_bk`: `string` \| `null`; `verify_id_image`: `string` \| `null`; `verify_id_image_bk`: `string` \| `null`; `push_token`: `string` \| `null`; `user_platform`: `string` \| `null`; `created_at`: `string`; `updated_at`: `string`; \}\>\>

### vehicles

> `readonly` **vehicles**: `object`

OPERACIONES DE VEHICULOS

#### vehicles.findActiveByDriverId

> `readonly` **findActiveByDriverId**: (`driverId`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`object`[]\>\>

Obtiene vehiculos activos de un conductor

##### Parameters

###### driverId

`string`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`object`[]\>\>

#### vehicles.findByPlate

> `readonly` **findByPlate**: (`plate`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `driver_id`: `string` \| `null`; `make`: `string`; `model`: `string`; `year`: `number` \| `null`; `color`: `string` \| `null`; `plate`: `string`; `car_image`: `string` \| `null`; `vehicle_number`: `string` \| `null`; `vehicle_model`: `string` \| `null`; `vehicle_make`: `string` \| `null`; `vehicle_color`: `string` \| `null`; `fuel_type`: `string`; `transmission`: `string`; `capacity`: `number`; `is_active`: `boolean`; `features`: [`Json`](../../database.types/type-aliases/Json.md); `created_at`: `string`; `updated_at`: `string`; \}\>\>

Busca vehiculo por placa

##### Parameters

###### plate

`string`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `driver_id`: `string` \| `null`; `make`: `string`; `model`: `string`; `year`: `number` \| `null`; `color`: `string` \| `null`; `plate`: `string`; `car_image`: `string` \| `null`; `vehicle_number`: `string` \| `null`; `vehicle_model`: `string` \| `null`; `vehicle_make`: `string` \| `null`; `vehicle_color`: `string` \| `null`; `fuel_type`: `string`; `transmission`: `string`; `capacity`: `number`; `is_active`: `boolean`; `features`: [`Json`](../../database.types/type-aliases/Json.md); `created_at`: `string`; `updated_at`: `string`; \}\>\>

### bookings

> `readonly` **bookings**: `object`

OPERACIONES DE RESERVAS (CORE T+PLUS)

#### bookings.findByUserId

> `readonly` **findByUserId**: (`userId`, `userType`, `page`, `pageSize`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<[`PaginationResult`](../interfaces/PaginationResult.md)\<\{ `id`: `string`; `customer_id`: `string` \| `null`; `driver_id`: `string` \| `null`; `car_type_id`: `string` \| `null`; `car_id`: `string` \| `null`; `status`: `string`; `pickup_location`: [`Json`](../../database.types/type-aliases/Json.md); `destination_location`: [`Json`](../../database.types/type-aliases/Json.md); `drop_location`: [`Json`](../../database.types/type-aliases/Json.md); `distance`: `number` \| `null`; `duration`: `number` \| `null`; `price`: `number`; `total_trip_time`: `number` \| `null`; `trip_start_time`: `string` \| `null`; `trip_end_time`: `string` \| `null`; `driver_arrived_time`: `string` \| `null`; `start_time`: `number` \| `null`; `end_time`: `number` \| `null`; `driver_status`: `string` \| `null`; `customer_status`: `string` \| `null`; `driver_name`: `string` \| `null`; `driver_image`: `string` \| `null`; `driver_contact`: `string` \| `null`; `driver_rating`: `number` \| `null`; `car_image`: `string` \| `null`; `car_model`: `string` \| `null`; `car_color`: `string` \| `null`; `plate_number`: `string` \| `null`; `vehicle_number`: `string` \| `null`; `vehicle_model`: `string` \| `null`; `vehicle_make`: `string` \| `null`; `vehicle_color`: `string` \| `null`; `customer_token`: `string` \| `null`; `driver_token`: `string` \| `null`; `payment_mode`: `string`; `prepaid`: `boolean`; `rating`: `number` \| `null`; `review`: `string` \| `null`; `reason`: `string` \| `null`; `cancelled_by`: `string` \| `null`; `cancellation_time`: `string` \| `null`; `cancelled_at`: `number` \| `null`; `incident`: [`Json`](../../database.types/type-aliases/Json.md); `customer_city`: `string` \| `null`; `driver_city`: `string` \| `null`; `reference`: `string` \| `null`; `created_at`: `string`; `updated_at`: `string`; \}\>\>\>

Obtiene reservas de un usuario con paginacion

##### Parameters

###### userId

`string`

###### userType?

`"customer"` \| `"driver"`

###### page?

`number` = `1`

###### pageSize?

`number` = `20`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<[`PaginationResult`](../interfaces/PaginationResult.md)\<\{ `id`: `string`; `customer_id`: `string` \| `null`; `driver_id`: `string` \| `null`; `car_type_id`: `string` \| `null`; `car_id`: `string` \| `null`; `status`: `string`; `pickup_location`: [`Json`](../../database.types/type-aliases/Json.md); `destination_location`: [`Json`](../../database.types/type-aliases/Json.md); `drop_location`: [`Json`](../../database.types/type-aliases/Json.md); `distance`: `number` \| `null`; `duration`: `number` \| `null`; `price`: `number`; `total_trip_time`: `number` \| `null`; `trip_start_time`: `string` \| `null`; `trip_end_time`: `string` \| `null`; `driver_arrived_time`: `string` \| `null`; `start_time`: `number` \| `null`; `end_time`: `number` \| `null`; `driver_status`: `string` \| `null`; `customer_status`: `string` \| `null`; `driver_name`: `string` \| `null`; `driver_image`: `string` \| `null`; `driver_contact`: `string` \| `null`; `driver_rating`: `number` \| `null`; `car_image`: `string` \| `null`; `car_model`: `string` \| `null`; `car_color`: `string` \| `null`; `plate_number`: `string` \| `null`; `vehicle_number`: `string` \| `null`; `vehicle_model`: `string` \| `null`; `vehicle_make`: `string` \| `null`; `vehicle_color`: `string` \| `null`; `customer_token`: `string` \| `null`; `driver_token`: `string` \| `null`; `payment_mode`: `string`; `prepaid`: `boolean`; `rating`: `number` \| `null`; `review`: `string` \| `null`; `reason`: `string` \| `null`; `cancelled_by`: `string` \| `null`; `cancellation_time`: `string` \| `null`; `cancelled_at`: `number` \| `null`; `incident`: [`Json`](../../database.types/type-aliases/Json.md); `customer_city`: `string` \| `null`; `driver_city`: `string` \| `null`; `reference`: `string` \| `null`; `created_at`: `string`; `updated_at`: `string`; \}\>\>\>

#### bookings.findActive

> `readonly` **findActive**: (`city?`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`object`[]\>\>

Obtiene reservas activas

##### Parameters

###### city?

`string`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`object`[]\>\>

#### bookings.updateStatus

> `readonly` **updateStatus**: (`bookingId`, `status`, `additionalData?`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `customer_id`: `string` \| `null`; `driver_id`: `string` \| `null`; `car_type_id`: `string` \| `null`; `car_id`: `string` \| `null`; `status`: `string`; `pickup_location`: [`Json`](../../database.types/type-aliases/Json.md); `destination_location`: [`Json`](../../database.types/type-aliases/Json.md); `drop_location`: [`Json`](../../database.types/type-aliases/Json.md); `distance`: `number` \| `null`; `duration`: `number` \| `null`; `price`: `number`; `total_trip_time`: `number` \| `null`; `trip_start_time`: `string` \| `null`; `trip_end_time`: `string` \| `null`; `driver_arrived_time`: `string` \| `null`; `start_time`: `number` \| `null`; `end_time`: `number` \| `null`; `driver_status`: `string` \| `null`; `customer_status`: `string` \| `null`; `driver_name`: `string` \| `null`; `driver_image`: `string` \| `null`; `driver_contact`: `string` \| `null`; `driver_rating`: `number` \| `null`; `car_image`: `string` \| `null`; `car_model`: `string` \| `null`; `car_color`: `string` \| `null`; `plate_number`: `string` \| `null`; `vehicle_number`: `string` \| `null`; `vehicle_model`: `string` \| `null`; `vehicle_make`: `string` \| `null`; `vehicle_color`: `string` \| `null`; `customer_token`: `string` \| `null`; `driver_token`: `string` \| `null`; `payment_mode`: `string`; `prepaid`: `boolean`; `rating`: `number` \| `null`; `review`: `string` \| `null`; `reason`: `string` \| `null`; `cancelled_by`: `string` \| `null`; `cancellation_time`: `string` \| `null`; `cancelled_at`: `number` \| `null`; `incident`: [`Json`](../../database.types/type-aliases/Json.md); `customer_city`: `string` \| `null`; `driver_city`: `string` \| `null`; `reference`: `string` \| `null`; `created_at`: `string`; `updated_at`: `string`; \}\>\>

Actualiza estado de reserva

##### Parameters

###### bookingId

`string`

###### status

[`BookingStatus`](../../database.types/type-aliases/BookingStatus.md)

###### additionalData?

`Partial`\<\{ `id?`: `string`; `customer_id?`: `string` \| `null`; `driver_id?`: `string` \| `null`; `car_type_id?`: `string` \| `null`; `car_id?`: `string` \| `null`; `status?`: `string`; `pickup_location?`: [`Json`](../../database.types/type-aliases/Json.md); `destination_location?`: [`Json`](../../database.types/type-aliases/Json.md); `drop_location?`: [`Json`](../../database.types/type-aliases/Json.md); `distance?`: `number` \| `null`; `duration?`: `number` \| `null`; `price?`: `number`; `total_trip_time?`: `number` \| `null`; `trip_start_time?`: `string` \| `null`; `trip_end_time?`: `string` \| `null`; `driver_arrived_time?`: `string` \| `null`; `start_time?`: `number` \| `null`; `end_time?`: `number` \| `null`; `driver_status?`: `string` \| `null`; `customer_status?`: `string` \| `null`; `driver_name?`: `string` \| `null`; `driver_image?`: `string` \| `null`; `driver_contact?`: `string` \| `null`; `driver_rating?`: `number` \| `null`; `car_image?`: `string` \| `null`; `car_model?`: `string` \| `null`; `car_color?`: `string` \| `null`; `plate_number?`: `string` \| `null`; `vehicle_number?`: `string` \| `null`; `vehicle_model?`: `string` \| `null`; `vehicle_make?`: `string` \| `null`; `vehicle_color?`: `string` \| `null`; `customer_token?`: `string` \| `null`; `driver_token?`: `string` \| `null`; `payment_mode?`: `string`; `prepaid?`: `boolean`; `rating?`: `number` \| `null`; `review?`: `string` \| `null`; `reason?`: `string` \| `null`; `cancelled_by?`: `string` \| `null`; `cancellation_time?`: `string` \| `null`; `cancelled_at?`: `number` \| `null`; `incident?`: [`Json`](../../database.types/type-aliases/Json.md); `customer_city?`: `string` \| `null`; `driver_city?`: `string` \| `null`; `reference?`: `string` \| `null`; `created_at?`: `string`; `updated_at?`: `string`; \}\>

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `customer_id`: `string` \| `null`; `driver_id`: `string` \| `null`; `car_type_id`: `string` \| `null`; `car_id`: `string` \| `null`; `status`: `string`; `pickup_location`: [`Json`](../../database.types/type-aliases/Json.md); `destination_location`: [`Json`](../../database.types/type-aliases/Json.md); `drop_location`: [`Json`](../../database.types/type-aliases/Json.md); `distance`: `number` \| `null`; `duration`: `number` \| `null`; `price`: `number`; `total_trip_time`: `number` \| `null`; `trip_start_time`: `string` \| `null`; `trip_end_time`: `string` \| `null`; `driver_arrived_time`: `string` \| `null`; `start_time`: `number` \| `null`; `end_time`: `number` \| `null`; `driver_status`: `string` \| `null`; `customer_status`: `string` \| `null`; `driver_name`: `string` \| `null`; `driver_image`: `string` \| `null`; `driver_contact`: `string` \| `null`; `driver_rating`: `number` \| `null`; `car_image`: `string` \| `null`; `car_model`: `string` \| `null`; `car_color`: `string` \| `null`; `plate_number`: `string` \| `null`; `vehicle_number`: `string` \| `null`; `vehicle_model`: `string` \| `null`; `vehicle_make`: `string` \| `null`; `vehicle_color`: `string` \| `null`; `customer_token`: `string` \| `null`; `driver_token`: `string` \| `null`; `payment_mode`: `string`; `prepaid`: `boolean`; `rating`: `number` \| `null`; `review`: `string` \| `null`; `reason`: `string` \| `null`; `cancelled_by`: `string` \| `null`; `cancellation_time`: `string` \| `null`; `cancelled_at`: `number` \| `null`; `incident`: [`Json`](../../database.types/type-aliases/Json.md); `customer_city`: `string` \| `null`; `driver_city`: `string` \| `null`; `reference`: `string` \| `null`; `created_at`: `string`; `updated_at`: `string`; \}\>\>

#### bookings.assignDriver

> `readonly` **assignDriver**: (`bookingId`, `driverId`, `driverData`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `customer_id`: `string` \| `null`; `driver_id`: `string` \| `null`; `car_type_id`: `string` \| `null`; `car_id`: `string` \| `null`; `status`: `string`; `pickup_location`: [`Json`](../../database.types/type-aliases/Json.md); `destination_location`: [`Json`](../../database.types/type-aliases/Json.md); `drop_location`: [`Json`](../../database.types/type-aliases/Json.md); `distance`: `number` \| `null`; `duration`: `number` \| `null`; `price`: `number`; `total_trip_time`: `number` \| `null`; `trip_start_time`: `string` \| `null`; `trip_end_time`: `string` \| `null`; `driver_arrived_time`: `string` \| `null`; `start_time`: `number` \| `null`; `end_time`: `number` \| `null`; `driver_status`: `string` \| `null`; `customer_status`: `string` \| `null`; `driver_name`: `string` \| `null`; `driver_image`: `string` \| `null`; `driver_contact`: `string` \| `null`; `driver_rating`: `number` \| `null`; `car_image`: `string` \| `null`; `car_model`: `string` \| `null`; `car_color`: `string` \| `null`; `plate_number`: `string` \| `null`; `vehicle_number`: `string` \| `null`; `vehicle_model`: `string` \| `null`; `vehicle_make`: `string` \| `null`; `vehicle_color`: `string` \| `null`; `customer_token`: `string` \| `null`; `driver_token`: `string` \| `null`; `payment_mode`: `string`; `prepaid`: `boolean`; `rating`: `number` \| `null`; `review`: `string` \| `null`; `reason`: `string` \| `null`; `cancelled_by`: `string` \| `null`; `cancellation_time`: `string` \| `null`; `cancelled_at`: `number` \| `null`; `incident`: [`Json`](../../database.types/type-aliases/Json.md); `customer_city`: `string` \| `null`; `driver_city`: `string` \| `null`; `reference`: `string` \| `null`; `created_at`: `string`; `updated_at`: `string`; \}\>\>

Asigna conductor a reserva

##### Parameters

###### bookingId

`string`

###### driverId

`string`

###### driverData

###### name

`string`

###### image?

`string`

###### contact

`string`

###### rating

`number`

###### carId

`string`

###### carData

\{ `image?`: `string`; `number`: `string`; `model`: `string`; `make`: `string`; `color`: `string`; \}

###### carData.image?

`string`

###### carData.number

`string`

###### carData.model

`string`

###### carData.make

`string`

###### carData.color

`string`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `customer_id`: `string` \| `null`; `driver_id`: `string` \| `null`; `car_type_id`: `string` \| `null`; `car_id`: `string` \| `null`; `status`: `string`; `pickup_location`: [`Json`](../../database.types/type-aliases/Json.md); `destination_location`: [`Json`](../../database.types/type-aliases/Json.md); `drop_location`: [`Json`](../../database.types/type-aliases/Json.md); `distance`: `number` \| `null`; `duration`: `number` \| `null`; `price`: `number`; `total_trip_time`: `number` \| `null`; `trip_start_time`: `string` \| `null`; `trip_end_time`: `string` \| `null`; `driver_arrived_time`: `string` \| `null`; `start_time`: `number` \| `null`; `end_time`: `number` \| `null`; `driver_status`: `string` \| `null`; `customer_status`: `string` \| `null`; `driver_name`: `string` \| `null`; `driver_image`: `string` \| `null`; `driver_contact`: `string` \| `null`; `driver_rating`: `number` \| `null`; `car_image`: `string` \| `null`; `car_model`: `string` \| `null`; `car_color`: `string` \| `null`; `plate_number`: `string` \| `null`; `vehicle_number`: `string` \| `null`; `vehicle_model`: `string` \| `null`; `vehicle_make`: `string` \| `null`; `vehicle_color`: `string` \| `null`; `customer_token`: `string` \| `null`; `driver_token`: `string` \| `null`; `payment_mode`: `string`; `prepaid`: `boolean`; `rating`: `number` \| `null`; `review`: `string` \| `null`; `reason`: `string` \| `null`; `cancelled_by`: `string` \| `null`; `cancellation_time`: `string` \| `null`; `cancelled_at`: `number` \| `null`; `incident`: [`Json`](../../database.types/type-aliases/Json.md); `customer_city`: `string` \| `null`; `driver_city`: `string` \| `null`; `reference`: `string` \| `null`; `created_at`: `string`; `updated_at`: `string`; \}\>\>

### tracking

> `readonly` **tracking**: `object`

OPERACIONES DE TRACKING

#### tracking.insertLocation

> `readonly` **insertLocation**: (`bookingId`, `latitude`, `longitude`, `status`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `booking_id`: `string` \| `null`; `status`: `string`; `latitude`: `number`; `longitude`: `number`; `timestamp_ms`: `number`; `created_at`: `string`; \}\>\>

Inserta punto de tracking

##### Parameters

###### bookingId

`string`

###### latitude

`number`

###### longitude

`number`

###### status

`string`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `booking_id`: `string` \| `null`; `status`: `string`; `latitude`: `number`; `longitude`: `number`; `timestamp_ms`: `number`; `created_at`: `string`; \}\>\>

#### tracking.findByBookingId

> `readonly` **findByBookingId**: (`bookingId`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`object`[]\>\>

Obtiene tracking de una reserva

##### Parameters

###### bookingId

`string`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`object`[]\>\>

### wallet

> `readonly` **wallet**: `object`

OPERACIONES DE WALLET

#### wallet.recordTransaction

> `readonly` **recordTransaction**: (`userId`, `type`, `amount`, `description`, `newBalance`, `bookingId?`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `user_id`: `string` \| `null`; `type`: `string`; `amount`: `number`; `balance`: `number`; `description`: `string`; `booking_id`: `string` \| `null`; `created_at`: `string`; \}\>\>

Registra transaccion de wallet

##### Parameters

###### userId

`string`

###### type

[`WalletTransactionType`](../../database.types/type-aliases/WalletTransactionType.md)

###### amount

`number`

###### description

`string`

###### newBalance

`number`

###### bookingId?

`string`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `user_id`: `string` \| `null`; `type`: `string`; `amount`: `number`; `balance`: `number`; `description`: `string`; `booking_id`: `string` \| `null`; `created_at`: `string`; \}\>\>

#### wallet.getHistory

> `readonly` **getHistory**: (`userId`, `page`, `pageSize`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<[`PaginationResult`](../interfaces/PaginationResult.md)\<\{ `id`: `string`; `user_id`: `string` \| `null`; `type`: `string`; `amount`: `number`; `balance`: `number`; `description`: `string`; `booking_id`: `string` \| `null`; `created_at`: `string`; \}\>\>\>

Obtiene historial de wallet

##### Parameters

###### userId

`string`

###### page?

`number` = `1`

###### pageSize?

`number` = `20`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<[`PaginationResult`](../interfaces/PaginationResult.md)\<\{ `id`: `string`; `user_id`: `string` \| `null`; `type`: `string`; `amount`: `number`; `balance`: `number`; `description`: `string`; `booking_id`: `string` \| `null`; `created_at`: `string`; \}\>\>\>

### notifications

> `readonly` **notifications**: `object`

OPERACIONES DE NOTIFICACIONES

#### notifications.send

> `readonly` **send**: (`userId`, `title`, `message`, `type`, `data?`, `bookingId?`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `user_id`: `string` \| `null`; `title`: `string`; `message`: `string`; `type`: `string`; `is_read`: `boolean`; `data`: [`Json`](../../database.types/type-aliases/Json.md); `booking_id`: `string` \| `null`; `created_at`: `string`; \}\>\>

Envia notificacion a usuario

##### Parameters

###### userId

`string`

###### title

`string`

###### message

`string`

###### type?

`string` = `'general'`

###### data?

`any`

###### bookingId?

`string`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<\{ `id`: `string`; `user_id`: `string` \| `null`; `title`: `string`; `message`: `string`; `type`: `string`; `is_read`: `boolean`; `data`: [`Json`](../../database.types/type-aliases/Json.md); `booking_id`: `string` \| `null`; `created_at`: `string`; \}\>\>

#### notifications.getUnread

> `readonly` **getUnread**: (`userId`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`object`[]\>\>

Obtiene notificaciones no leidas

##### Parameters

###### userId

`string`

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`object`[]\>\>

#### notifications.markAsRead

> `readonly` **markAsRead**: (`notificationIds`) => `Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`object`[]\>\>

Marca notificaciones como leidas

##### Parameters

###### notificationIds

`string`[]

##### Returns

`Promise`\<[`DatabaseResult`](../interfaces/DatabaseResult.md)\<`object`[]\>\>
