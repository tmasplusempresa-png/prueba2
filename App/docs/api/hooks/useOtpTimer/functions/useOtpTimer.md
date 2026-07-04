[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [hooks/useOtpTimer](../README.md) / useOtpTimer

# Function: useOtpTimer()

> **useOtpTimer**(`__namedParameters`): `object`

Defined in: [hooks/useOtpTimer.ts:19](https://github.com/tmasplusempresa-png/prueba2/blob/4901cd1d9dfde0ca0fccf524b740edfeb7ef3df7/App/hooks/useOtpTimer.ts#L19)

## Parameters

### \_\_namedParameters

`UseOtpTimerProps`

## Returns

`object`

### timeRemaining

> **timeRemaining**: `number` = `timerState.timeRemaining`

### isRunning

> **isRunning**: `boolean` = `timerState.isRunning`

### isExpired

> **isExpired**: `boolean` = `timerState.isExpired`

### hasStarted

> **hasStarted**: `boolean` = `timerState.hasStarted`

### timerStartedAt

> **timerStartedAt**: `string` \| `null` = `timerState.timerStartedAt`

### startTimer

> **startTimer**: () => `Promise`\<`boolean`\>

#### Returns

`Promise`\<`boolean`\>

### resetTimer

> **resetTimer**: () => `Promise`\<`boolean`\>

#### Returns

`Promise`\<`boolean`\>

### fetchTimerState

> **fetchTimerState**: () => `Promise`\<`number` \| `null`\>

#### Returns

`Promise`\<`number` \| `null`\>

### formatTime

> **formatTime**: (`seconds`) => `string`

#### Parameters

##### seconds?

`number` = `timerState.timeRemaining`

#### Returns

`string`
