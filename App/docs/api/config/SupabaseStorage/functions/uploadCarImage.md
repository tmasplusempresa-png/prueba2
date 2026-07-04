[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [config/SupabaseStorage](../README.md) / uploadCarImage

# Function: uploadCarImage()

> **uploadCarImage**(`carId`, `imageFile`, `contentType?`): `Promise`\<[`StorageUploadResult`](../interfaces/StorageUploadResult.md)\>

Defined in: [config/SupabaseStorage.ts:120](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/config/SupabaseStorage.ts#L120)

MIGRAR: cars/{carId} (Firebase)
→ vehicle-images/{carId}/car_image.jpg (Supabase)

## Parameters

### carId

`string`

### imageFile

`Blob` \| `File`

### contentType?

`string` = `'image/jpeg'`

## Returns

`Promise`\<[`StorageUploadResult`](../interfaces/StorageUploadResult.md)\>
