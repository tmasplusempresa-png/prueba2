import { useState, useEffect } from 'react';

export type DriverSignalHealth = 'HEALTHY' | 'LATE' | 'LOST';

/**
 * Returns how many seconds have elapsed since `createdAt`, or null if the
 * value is absent / unparseable.
 */
export function getPositionAgeSeconds(createdAt: string | null): number | null {
  if (!createdAt) return null;
  const ms = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, ms / 1000);
}

interface UseDriverSignalHealthOptions {
  /** Position is considered fresh while age ≤ this value. Default: 30 s */
  healthyThresholdSec?: number;
  /** Position is considered stale (LOST) once age exceeds this value. Default: 120 s */
  lateThresholdSec?: number;
}

/**
 * Derives a three-level signal-health state from the `createdAt` timestamp
 * of the latest driver position.
 *
 * - HEALTHY  → age ≤ healthyThresholdSec
 * - LATE     → healthyThresholdSec < age ≤ lateThresholdSec
 * - LOST     → age > lateThresholdSec, or driverPosition is null
 *
 * Re-evaluates on a 10 s interval so the UI degrades automatically even when
 * no new positions arrive from the server.
 */
export function useDriverSignalHealth(
  driverPosition: { createdAt: string } | null,
  options?: UseDriverSignalHealthOptions,
): DriverSignalHealth {
  const healthyThresholdSec = options?.healthyThresholdSec ?? 30;
  const lateThresholdSec = options?.lateThresholdSec ?? 120;

  const [health, setHealth] = useState<DriverSignalHealth>(() => {
    if (!driverPosition) return 'LOST';
    const age = getPositionAgeSeconds(driverPosition.createdAt);
    if (age === null) return 'LOST';
    if (age <= healthyThresholdSec) return 'HEALTHY';
    if (age <= lateThresholdSec) return 'LATE';
    return 'LOST';
  });

  useEffect(() => {
    const evaluate = () => {
      if (!driverPosition) { setHealth('LOST'); return; }
      const age = getPositionAgeSeconds(driverPosition.createdAt);
      if (age === null) { setHealth('LOST'); return; }
      if (age <= healthyThresholdSec) { setHealth('HEALTHY'); return; }
      if (age <= lateThresholdSec) { setHealth('LATE'); return; }
      setHealth('LOST');
    };

    evaluate();
    const id = setInterval(evaluate, 10_000);
    return () => clearInterval(id);
  }, [driverPosition, healthyThresholdSec, lateThresholdSec]);

  return health;
}
