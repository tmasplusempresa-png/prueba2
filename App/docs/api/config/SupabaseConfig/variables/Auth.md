[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/SupabaseConfig](../README.md) / Auth

# Variable: Auth

> `const` **Auth**: `object`

Defined in: [config/SupabaseConfig.ts:203](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/SupabaseConfig.ts#L203)

## Type Declaration

### getCurrentUser

> `readonly` **getCurrentUser**: () => `Promise`\<`User` \| `null`\>

Obtiene el usuario actual con manejo robusto de errores

#### Returns

`Promise`\<`User` \| `null`\>

### getCurrentSession

> `readonly` **getCurrentSession**: () => `Promise`\<`Session` \| `null`\>

Obtiene la sesion actual con validacion

#### Returns

`Promise`\<`Session` \| `null`\>

### isAuthenticated

> `readonly` **isAuthenticated**: () => `Promise`\<`boolean`\>

Verifica si el usuario esta autenticado y la sesion es valida

#### Returns

`Promise`\<`boolean`\>

### getUserProfile

> `readonly` **getUserProfile**: () => `Promise`\<\{ `id`: `string`; `auth_id`: `string` \| `null`; `email`: `string`; `first_name`: `string`; `last_name`: `string`; `mobile`: `string` \| `null`; `user_type`: `string`; `wallet_balance`: `number`; `location`: [`Json`](../../database.types/type-aliases/Json.md); `profile_image`: `string` \| `null`; `rating`: `number`; `total_rides`: `number`; `is_verified`: `boolean`; `approved`: `boolean`; `blocked`: `boolean`; `referral_id`: `string` \| `null`; `referred_by_code`: `string` \| `null`; `document_type`: `string` \| `null`; `document_number`: `string` \| `null`; `city`: `string` \| `null`; `driver_active_status`: `boolean`; `license_number`: `string` \| `null`; `license_image`: `string` \| `null`; `license_image_back`: `string` \| `null`; `soat_image`: `string` \| `null`; `card_prop_image`: `string` \| `null`; `card_prop_image_bk`: `string` \| `null`; `verify_id_image`: `string` \| `null`; `verify_id_image_bk`: `string` \| `null`; `push_token`: `string` \| `null`; `user_platform`: `string` \| `null`; `created_at`: `string`; `updated_at`: `string`; \} \| `null`\>

Obtiene el perfil completo del usuario desde la tabla users

#### Returns

`Promise`\<\{ `id`: `string`; `auth_id`: `string` \| `null`; `email`: `string`; `first_name`: `string`; `last_name`: `string`; `mobile`: `string` \| `null`; `user_type`: `string`; `wallet_balance`: `number`; `location`: [`Json`](../../database.types/type-aliases/Json.md); `profile_image`: `string` \| `null`; `rating`: `number`; `total_rides`: `number`; `is_verified`: `boolean`; `approved`: `boolean`; `blocked`: `boolean`; `referral_id`: `string` \| `null`; `referred_by_code`: `string` \| `null`; `document_type`: `string` \| `null`; `document_number`: `string` \| `null`; `city`: `string` \| `null`; `driver_active_status`: `boolean`; `license_number`: `string` \| `null`; `license_image`: `string` \| `null`; `license_image_back`: `string` \| `null`; `soat_image`: `string` \| `null`; `card_prop_image`: `string` \| `null`; `card_prop_image_bk`: `string` \| `null`; `verify_id_image`: `string` \| `null`; `verify_id_image_bk`: `string` \| `null`; `push_token`: `string` \| `null`; `user_platform`: `string` \| `null`; `created_at`: `string`; `updated_at`: `string`; \} \| `null`\>

### signOut

> `readonly` **signOut**: () => `Promise`\<`boolean`\>

Cierra la sesion del usuario de forma segura

#### Returns

`Promise`\<`boolean`\>
