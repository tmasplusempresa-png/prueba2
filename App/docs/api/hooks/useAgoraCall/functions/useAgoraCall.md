[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [hooks/useAgoraCall](../README.md) / useAgoraCall

# Function: useAgoraCall()

> **useAgoraCall**(`options`): `object`

Defined in: [hooks/useAgoraCall.ts:60](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/hooks/useAgoraCall.ts#L60)

## Parameters

### options

[`UseAgoraCallOptions`](../interfaces/UseAgoraCallOptions.md)

## Returns

### callActive

> **callActive**: `boolean`

### channelName

> **channelName**: `string`

### remoteUser

> **remoteUser**: [`CallUserInfo`](../interfaces/CallUserInfo.md) \| `null`

### token

> **token**: `string` \| `null`

### isLoadingToken

> **isLoadingToken**: `boolean`

### makeCall

> **makeCall**: (`targetUser`) => `Promise`\<`void`\>

Hacer una llamada
COMENTADO PARA EXPO GO - Solo modo mock

#### Parameters

##### targetUser

[`CallUserInfo`](../interfaces/CallUserInfo.md)

#### Returns

`Promise`\<`void`\>

### acceptCall

> **acceptCall**: (`targetUser`) => `Promise`\<`void`\>

Aceptar una llamada
COMENTADO PARA EXPO GO

#### Parameters

##### targetUser

[`CallUserInfo`](../interfaces/CallUserInfo.md)

#### Returns

`Promise`\<`void`\>

### endCall

> **endCall**: () => `void`

Terminar llamada

#### Returns

`void`
