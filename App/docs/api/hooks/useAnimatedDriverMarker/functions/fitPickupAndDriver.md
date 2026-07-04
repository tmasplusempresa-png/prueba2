[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [hooks/useAnimatedDriverMarker](../README.md) / fitPickupAndDriver

# Function: fitPickupAndDriver()

> **fitPickupAndDriver**(`cameraRef`, `pickup`, `driver`, `padding?`, `animationDuration?`): `void`

Defined in: hooks/useAnimatedDriverMarker.ts:105

Fits the Mapbox camera to keep pickup and driver visible.

Behaviour:
  - No driver yet      → center on pickup, zoom 14.
  - Driver < 100 m away → zoom in on driver at zoom 17 (conductor muy cerca).
  - Otherwise          → fitBounds with padding so both points are on screen.

IMPORTANT: do not call this on every tween frame — use shouldRefitCamera
to gate calls and avoid flooding the native camera module.

## Parameters

### cameraRef

`RefObject`\<`any`\>

### pickup

#### lat

`number`

#### lng

`number`

### driver

[`AnimatedCoords`](../interfaces/AnimatedCoords.md) \| `null`

### padding?

\[`number`, `number`, `number`, `number`\] = `...`

### animationDuration?

`number` = `800`

## Returns

`void`
