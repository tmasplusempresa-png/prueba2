[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/SupabaseStorage](../README.md) / uploadProfileImage

# Function: uploadProfileImage()

> **uploadProfileImage**(`userId`, `imageFile`, `contentType?`): `Promise`\<[`StorageUploadResult`](../interfaces/StorageUploadResult.md)\>

Defined in: [config/SupabaseStorage.ts:29](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/SupabaseStorage.ts#L29)

MIGRAR: users/{uid}/profile_image.jpg (Firebase) 
→ user-profiles/{uid}/profile_image.jpg (Supabase)

## Parameters

### userId

`string`

### imageFile

`Blob` \| `File`

### contentType?

`string` = `'image/jpeg'`

## Returns

`Promise`\<[`StorageUploadResult`](../interfaces/StorageUploadResult.md)\>
