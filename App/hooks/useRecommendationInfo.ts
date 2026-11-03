import { useCallback, useEffect, useState } from 'react';
import { fetchRecommendationInfo, RecommendationInfo } from '@/common/services/recommendationsService';

/** Datos de recomendación del viaje para quien lo mira; null si no es recomendado o aún no carga. */
export function useRecommendationInfo(
  bookingId: string | null | undefined,
  enabled: boolean,
): { info: RecommendationInfo | null; reload: () => void } {
  const [info, setInfo] = useState<RecommendationInfo | null>(null);
  const [tick, setTick] = useState(0);
  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    if (!enabled || !bookingId) {
      setInfo(null);
      return;
    }
    const controller = new AbortController();
    fetchRecommendationInfo([String(bookingId)], controller.signal)
      .then((map) => {
        if (!controller.signal.aborted) setInfo(map[String(bookingId)] ?? null);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [bookingId, enabled, tick]);

  return { info, reload };
}
