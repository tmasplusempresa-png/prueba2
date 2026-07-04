[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/SupabaseStorage](../README.md) / default

# Variable: default

> **default**: `object`

Defined in: [config/SupabaseStorage.ts:251](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/SupabaseStorage.ts#L251)

## Type Declaration

### uploadProfileImage

> **uploadProfileImage**: (`userId`, `imageFile`, `contentType`) => `Promise`\<[`StorageUploadResult`](../interfaces/StorageUploadResult.md)\>

MIGRAR: users/{uid}/profile_image.jpg (Firebase) 
→ user-profiles/{uid}/profile_image.jpg (Supabase)

#### Parameters

##### userId

`string`

##### imageFile

`Blob` \| `File`

##### contentType?

`string` = `'image/jpeg'`

#### Returns

`Promise`\<[`StorageUploadResult`](../interfaces/StorageUploadResult.md)\>

### uploadUserDocument

> **uploadUserDocument**: (`userId`, `documentName`, `imageFile`, `contentType`) => `Promise`\<[`StorageUploadResult`](../interfaces/StorageUploadResult.md)\>

MIGRAR: users/{uid}/{documentName} (Firebase)
→ user-documents/{uid}/{documentName} (Supabase)

#### Parameters

##### userId

`string`

##### documentName

`string`

##### imageFile

`Blob` \| `File`

##### contentType?

`string` = `'image/jpeg'`

#### Returns

`Promise`\<[`StorageUploadResult`](../interfaces/StorageUploadResult.md)\>

### uploadCarImage

> **uploadCarImage**: (`carId`, `imageFile`, `contentType`) => `Promise`\<[`StorageUploadResult`](../interfaces/StorageUploadResult.md)\>

MIGRAR: cars/{carId} (Firebase)
→ vehicle-images/{carId}/car_image.jpg (Supabase)

#### Parameters

##### carId

`string`

##### imageFile

`Blob` \| `File`

##### contentType?

`string` = `'image/jpeg'`

#### Returns

`Promise`\<[`StorageUploadResult`](../interfaces/StorageUploadResult.md)\>

### getDocumentSignedUrl

> **getDocumentSignedUrl**: (`bucket`, `path`, `expiresIn`) => `Promise`\<`string` \| `null`\>

Obtener URL firmada para documento privado

#### Parameters

##### bucket

`string`

##### path

`string`

##### expiresIn?

`number` = `3600`

#### Returns

`Promise`\<`string` \| `null`\>

### deleteStorageFile

> **deleteStorageFile**: (`bucket`, `path`) => `Promise`\<`boolean`\>

Eliminar archivo de storage

#### Parameters

##### bucket

`string`

##### path

`string`

#### Returns

`Promise`\<`boolean`\>

### convertFirebasePathToSupabase

> **convertFirebasePathToSupabase**: (`firebasePath`) => `object`

#### Parameters

##### firebasePath

`string`

#### Returns

`object`

##### bucket

> **bucket**: `string`

##### path

> **path**: `string`

### STORAGE\_BUCKETS

> **STORAGE\_BUCKETS**: `object`

#### STORAGE\_BUCKETS.USER\_PROFILES

> `readonly` **USER\_PROFILES**: `"user-profiles"` = `'user-profiles'`

#### STORAGE\_BUCKETS.USER\_DOCUMENTS

> `readonly` **USER\_DOCUMENTS**: `"user-documents"` = `'user-documents'`

#### STORAGE\_BUCKETS.VEHICLE\_DOCUMENTS

> `readonly` **VEHICLE\_DOCUMENTS**: `"vehicle-documents"` = `'vehicle-documents'`

#### STORAGE\_BUCKETS.DRIVER\_DOCUMENTS

> `readonly` **DRIVER\_DOCUMENTS**: `"driver-documents"` = `'driver-documents'`

#### STORAGE\_BUCKETS.VEHICLE\_IMAGES

> `readonly` **VEHICLE\_IMAGES**: `"vehicle-images"` = `'vehicle-images'`

#### STORAGE\_BUCKETS.CAR\_IMAGES

> `readonly` **CAR\_IMAGES**: `"vehicle-images"` = `'vehicle-images'`

#### STORAGE\_BUCKETS.BOOKING\_MEDIA

> `readonly` **BOOKING\_MEDIA**: `"booking-media"` = `'booking-media'`
