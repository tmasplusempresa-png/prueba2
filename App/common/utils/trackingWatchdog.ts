/**
 * Hueco (ms) sin puntos de tracking para el watchdog. Si todavía no hay ningún
 * punto registrado (clave ausente o ilegible), cuenta desde que el watchdog
 * empezó a vigilar el viaje; si no, un servicio que arranca y nunca entrega un
 * punto jamás se reiniciaría.
 */
export function trackingGapMs(
  rawLastInsert: string | null | undefined,
  watchStartedAt: number,
  now: number,
): number {
  let last = 0;
  if (rawLastInsert) {
    try {
      const t = Number(JSON.parse(rawLastInsert)?.time);
      if (Number.isFinite(t)) last = t;
    } catch {
      last = 0;
    }
  }
  return now - Math.max(last, watchStartedAt);
}
