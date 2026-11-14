import { useEffect, useState } from 'react';
import { SUPABASE_URL, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';

/** Quita la etiqueta interna "[recorrido:...]" que la reserva antepone a las observaciones. */
export const cleanTripNotes = (obs: unknown): string =>
  String(obs ?? '').replace(/^\[recorrido:[^\]]+\]\s*/i, '').trim();

/**
 * Observaciones / indicaciones que dejó quien pidió el viaje. Parte del valor que trae la navegación y lo
 * refresca desde la BD (la reserva pudo editarse después de aceptarla).
 */
export function useTripNotes(bookingId: string | null | undefined, initial: unknown): string {
  const [notes, setNotes] = useState(() => cleanTripNotes(initial));

  useEffect(() => {
    if (!bookingId) return;
    let cancelled = false;
    (async () => {
      try {
        const headers = await getSupabaseAuthHeaders();
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/bookings?id=eq.${encodeURIComponent(bookingId)}&select=observations`,
          { headers },
        );
        if (!res.ok) return;
        const rows = await res.json();
        if (!cancelled && Array.isArray(rows) && rows[0]) setNotes(cleanTripNotes(rows[0].observations));
      } catch {
        // Sin red: se queda con lo que trajo la navegación.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  return notes;
}
