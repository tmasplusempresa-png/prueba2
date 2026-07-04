[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [hooks/useDriverSignalHealth](../README.md) / useDriverSignalHealth

# Function: useDriverSignalHealth()

> **useDriverSignalHealth**(`driverPosition`, `options?`): [`DriverSignalHealth`](../type-aliases/DriverSignalHealth.md)

Defined in: hooks/useDriverSignalHealth.ts:33

Derives a three-level signal-health state from the `createdAt` timestamp
of the latest driver position.

- HEALTHY  → age ≤ healthyThresholdSec
- LATE     → healthyThresholdSec < age ≤ lateThresholdSec
- LOST     → age > lateThresholdSec, or driverPosition is null

Re-evaluates on a 10 s interval so the UI degrades automatically even when
no new positions arrive from the server.

## Parameters

### driverPosition

\{ `createdAt`: `string`; \} \| `null`

### options?

`UseDriverSignalHealthOptions`

## Returns

[`DriverSignalHealth`](../type-aliases/DriverSignalHealth.md)
