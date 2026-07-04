[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/SupabaseStorage](../README.md) / uploadUserDocument

# Function: uploadUserDocument()

> **uploadUserDocument**(`userId`, `documentName`, `imageFile`, `contentType?`): `Promise`\<[`StorageUploadResult`](../interfaces/StorageUploadResult.md)\>

Defined in: [config/SupabaseStorage.ts:74](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/SupabaseStorage.ts#L74)

MIGRAR: users/{uid}/{documentName} (Firebase)
→ user-documents/{uid}/{documentName} (Supabase)

## Parameters

### userId

`string`

### documentName

`string`

### imageFile

`Blob` \| `File`

### contentType?

`string` = `'image/jpeg'`

## Returns

`Promise`\<[`StorageUploadResult`](../interfaces/StorageUploadResult.md)\>
