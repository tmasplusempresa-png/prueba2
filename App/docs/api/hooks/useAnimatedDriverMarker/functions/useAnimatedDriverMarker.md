[**TmasPlus — Referencia de código**](../../../README.md)

***

[TmasPlus — Referencia de código](../../../README.md) / [hooks/useAnimatedDriverMarker](../README.md) / useAnimatedDriverMarker

# Function: useAnimatedDriverMarker()

> **useAnimatedDriverMarker**(`target`): [`AnimatedCoords`](../interfaces/AnimatedCoords.md) \| `null`

Defined in: hooks/useAnimatedDriverMarker.ts:37

Smoothly tweens the driver marker between GPS updates over TWEEN_MS ms.

Why requestAnimationFrame and not Reanimated/Animated:
@rnmapbox/maps PointAnnotation.coordinate must be a plain JS array — neither
Reanimated shared values nor RN Animated.Value are accepted there. A JS-thread
tween over 2 floats at 60 fps for 700 ms is lightweight and the correct call here.

Mid-animation re-targeting: if a new GPS point arrives while a tween is running,
the current interpolated position is used as the new "from", preventing jumps.

## Parameters

### target

[`AnimatedCoords`](../interfaces/AnimatedCoords.md) \| `null`

## Returns

[`AnimatedCoords`](../interfaces/AnimatedCoords.md) \| `null`
