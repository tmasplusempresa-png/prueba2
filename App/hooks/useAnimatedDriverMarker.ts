import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

export interface AnimatedCoords {
  latitude: number;
  longitude: number;
}

const TWEEN_MS = 700;

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Smoothly tweens the driver marker between GPS updates over TWEEN_MS ms.
 *
 * Why requestAnimationFrame and not Reanimated/Animated:
 * @rnmapbox/maps PointAnnotation.coordinate must be a plain JS array — neither
 * Reanimated shared values nor RN Animated.Value are accepted there. A JS-thread
 * tween over 2 floats at 60 fps for 700 ms is lightweight and the correct call here.
 *
 * Mid-animation re-targeting: if a new GPS point arrives while a tween is running,
 * the current interpolated position is used as the new "from", preventing jumps.
 */
export function useAnimatedDriverMarker(
  target: AnimatedCoords | null,
): AnimatedCoords | null {
  const [coords, setCoords] = useState<AnimatedCoords | null>(null);
  // Tracks the live interpolated position so mid-tween re-targets start smoothly.
  const currentRef = useRef<AnimatedCoords | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!target) return;

    // Snap to first known position — no tween on initial mount.
    if (!currentRef.current) {
      currentRef.current = target;
      setCoords(target);
      return;
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    const from = { ...currentRef.current };
    const startTime = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - startTime) / TWEEN_MS, 1);
      const ease = easeInOut(t);
      const next: AnimatedCoords = {
        latitude: from.latitude + (target.latitude - from.latitude) * ease,
        longitude: from.longitude + (target.longitude - from.longitude) * ease,
      };
      currentRef.current = next;
      setCoords({ ...next });
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target?.latitude, target?.longitude]);

  return coords;
}

// ─── Camera helpers ────────────────────────────────────────────────────────────

/**
 * Fits the Mapbox camera to keep pickup and driver visible.
 *
 * Behaviour:
 *   - No driver yet      → center on pickup, zoom 14.
 *   - Driver < 100 m away → zoom in on driver at zoom 17 (conductor muy cerca).
 *   - Otherwise          → fitBounds with padding so both points are on screen.
 *
 * IMPORTANT: do not call this on every tween frame — use shouldRefitCamera
 * to gate calls and avoid flooding the native camera module.
 */
export function fitPickupAndDriver(
  cameraRef: RefObject<any>,
  pickup: { lat: number; lng: number },
  driver: AnimatedCoords | null,
  padding: [number, number, number, number] = [80, 60, 80, 60],
  animationDuration = 800,
): void {
  const camera = cameraRef.current;
  if (!camera) return;

  if (!driver) {
    camera.setCamera?.({
      centerCoordinate: [pickup.lng, pickup.lat],
      zoomLevel: 14,
      animationDuration,
      animationMode: 'easeTo',
    });
    return;
  }

  const distMeters = haversineMeters(driver.latitude, driver.longitude, pickup.lat, pickup.lng);

  if (distMeters < 100) {
    // Driver has essentially arrived; tight zoom on the driver.
    camera.setCamera?.({
      centerCoordinate: [driver.longitude, driver.latitude],
      zoomLevel: 17,
      animationDuration,
      animationMode: 'easeTo',
    });
    return;
  }

  const ne: [number, number] = [
    Math.max(driver.longitude, pickup.lng),
    Math.max(driver.latitude, pickup.lat),
  ];
  const sw: [number, number] = [
    Math.min(driver.longitude, pickup.lng),
    Math.min(driver.latitude, pickup.lat),
  ];
  camera.fitBounds(ne, sw, padding, animationDuration);
}

/**
 * Returns true when the camera should re-fit.
 *
 * During a 700 ms tween, animatedCoords changes ~42 times. Without this guard,
 * fitPickupAndDriver (and fitBounds under the hood) would be called 42× per GPS update.
 * With minMovement = 30 m it fires at most once per real driver movement.
 *
 * @param last        Last position used for a camera fit (null = never fitted → always fit).
 * @param current     Current animated driver position.
 * @param minMovement Minimum driver movement in meters before re-fitting (default 30).
 * @param maxInterval Force re-fit after this many ms even without enough movement (default 10 000).
 */
export function shouldRefitCamera(
  last: { lat: number; lng: number; timestamp: number } | null,
  current: AnimatedCoords,
  minMovement = 30,
  maxInterval = 10_000,
): boolean {
  if (!last) return true;
  const moved = haversineMeters(last.lat, last.lng, current.latitude, current.longitude);
  return moved >= minMovement || Date.now() - last.timestamp >= maxInterval;
}
