[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [hooks/useAnimatedDriverMarker](../README.md) / shouldRefitCamera

# Function: shouldRefitCamera()

> **shouldRefitCamera**(`last`, `current`, `minMovement?`, `maxInterval?`): `boolean`

Defined in: hooks/useAnimatedDriverMarker.ts:161

Returns true when the camera should re-fit.

During a 700 ms tween, animatedCoords changes ~42 times. Without this guard,
fitPickupAndDriver (and fitBounds under the hood) would be called 42× per GPS update.
With minMovement = 30 m it fires at most once per real driver movement.

## Parameters

### last

\{ `lat`: `number`; `lng`: `number`; `timestamp`: `number`; \} \| `null`

Last position used for a camera fit (null = never fitted → always fit).

### current

[`AnimatedCoords`](../interfaces/AnimatedCoords.md)

Current animated driver position.

### minMovement?

`number` = `30`

Minimum driver movement in meters before re-fitting (default 30).

### maxInterval?

`number` = `10_000`

Force re-fit after this many ms even without enough movement (default 10 000).

## Returns

`boolean`
