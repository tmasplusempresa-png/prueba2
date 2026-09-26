import supabase, {
  SUPABASE_URL,
  getSupabaseAuthHeaders,
  hasUserAuthHeader,
  refreshAuthSession,
} from '@/config/SupabaseConfig';

export type UserRatingRole = 'customer' | 'driver';

/**
 * Promedio de estrellas recibidas (esquema aplicacioncore):
 * - Tabla `calificacion` (puntaje, id_persona = calificado) ← fuente de verdad
 * - Sync best-effort a perfil_cliente / perfil_conductor.calificacion_promedio
 *
 * La vista `bookings` NO tiene driver_rating / customer_rating.
 */
export async function fetchAndSyncUserRating(
  userId: string,
  role: UserRatingRole,
  opts?: { syncToProfile?: boolean },
): Promise<{ average: number | null; count: number }> {
  if (!userId) return { average: null, count: 0 };

  const sync = opts?.syncToProfile !== false;

  // 1) Fuente de verdad: filas en `calificacion` (SDK maneja JWT)
  try {
    const { data, error } = await supabase
      .from('calificacion')
      .select('puntaje')
      .eq('id_persona', userId);

    if (error) {
      console.warn('[userRating] calificacion SDK error:', error.message);
    } else {
      const values = (data || [])
        .map((r: any) => Number(r.puntaje))
        .filter((n) => Number.isFinite(n) && n >= 1);

      console.log('[userRating] calificacion rows', userId.slice(0, 8), (data || []).length);

      if (values.length > 0) {
        const average =
          Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
        console.log('[userRating]', userId.slice(0, 8), 'avg', average, 'n', values.length);
        if (sync) {
          // no bloquear la UI si el PATCH falla/cuelga
          void syncProfileAverage(userId, role, average);
        }
        return { average, count: values.length };
      }
    }
  } catch (e: any) {
    console.warn('[userRating] calificacion exception:', e?.message || e);
  }

  // 2) Fallback REST (por si el SDK falla por tipado/schema cache)
  try {
    let headers = await getSupabaseAuthHeaders();
    if (!hasUserAuthHeader(headers)) {
      await refreshAuthSession();
      headers = await getSupabaseAuthHeaders();
    }
    if (!hasUserAuthHeader(headers)) {
      console.warn('[userRating] sin JWT — se omite');
      return { average: null, count: 0 };
    }

    const url =
      `${SUPABASE_URL}/rest/v1/calificacion` +
      `?id_persona=eq.${encodeURIComponent(userId)}&select=puntaje`;
    let res = await fetch(url, { headers });
    if (res.status === 401) {
      await refreshAuthSession();
      headers = await getSupabaseAuthHeaders();
      res = await fetch(url, { headers });
    }
    if (res.ok) {
      const rows: Array<{ puntaje?: number }> = await res.json();
      const values = (rows || [])
        .map((r) => Number(r.puntaje))
        .filter((n) => Number.isFinite(n) && n >= 1);
      if (values.length > 0) {
        const average =
          Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
        if (sync) await syncProfileAverage(userId, role, average);
        return { average, count: values.length };
      }
    } else {
      console.warn('[userRating] calificacion HTTP', res.status, await res.text().catch(() => ''));
    }
  } catch (e: any) {
    console.warn('[userRating] REST fallback failed:', e?.message || e);
  }

  // 3) Último recurso: materializado en perfil_*
  try {
    const perfilTable = role === 'driver' ? 'perfil_conductor' : 'perfil_cliente';
    const { data } = await supabase
      .from(perfilTable as any)
      .select('calificacion_promedio')
      .eq('id_persona', userId)
      .limit(1)
      .maybeSingle();
    const avg =
      data?.calificacion_promedio != null && Number((data as any).calificacion_promedio) > 0
        ? Math.round(Number((data as any).calificacion_promedio) * 10) / 10
        : null;
    if (avg != null) return { average: avg, count: 0 };
  } catch {
    /* ignore */
  }

  return { average: null, count: 0 };
}

async function syncProfileAverage(
  userId: string,
  role: UserRatingRole,
  average: number,
) {
  const headers = await getSupabaseAuthHeaders(true);
  if (!hasUserAuthHeader(headers)) return;

  const perfilTable = role === 'driver' ? 'perfil_conductor' : 'perfil_cliente';
  try {
    await fetch(
      `${SUPABASE_URL}/rest/v1/${perfilTable}?id_persona=eq.${encodeURIComponent(userId)}`,
      {
        method: 'PATCH',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify({ calificacion_promedio: average }),
      },
    );
  } catch {
    /* ignore */
  }
}

/**
 * Inserta (o actualiza) una calificación en `calificacion`.
 * id_persona = quien recibe la nota; id_calificador = quien califica.
 */
export async function submitTripRating(params: {
  reservaId: string;
  ratedPersonaId: string;
  raterPersonaId: string;
  puntaje: number;
  comentario?: string | null;
  /** Rol de quien RECIBE la nota (para sync de promedio). */
  ratedRole?: UserRatingRole;
}): Promise<{ ok: boolean; error?: string }> {
  const {
    reservaId,
    ratedPersonaId,
    raterPersonaId,
    puntaje,
    comentario,
    ratedRole = 'customer',
  } = params;
  if (!reservaId || !ratedPersonaId || !raterPersonaId || puntaje < 1) {
    return { ok: false, error: 'Datos incompletos' };
  }

  const headers = await getSupabaseAuthHeaders(true);
  if (!hasUserAuthHeader(headers)) {
    return { ok: false, error: 'Sin sesión' };
  }

  const existingUrl =
    `${SUPABASE_URL}/rest/v1/calificacion` +
    `?id_reserva=eq.${encodeURIComponent(reservaId)}` +
    `&id_calificador=eq.${encodeURIComponent(raterPersonaId)}` +
    `&id_persona=eq.${encodeURIComponent(ratedPersonaId)}` +
    `&select=id&limit=1`;

  try {
    const existingRes = await fetch(existingUrl, { headers });
    const existingRows = existingRes.ok ? await existingRes.json() : [];
    const existingId =
      Array.isArray(existingRows) && existingRows[0]?.id
        ? String(existingRows[0].id)
        : null;

    const body = {
      puntaje: Math.round(puntaje),
      comentario: comentario?.trim() || null,
      id_persona: ratedPersonaId,
      id_calificador: raterPersonaId,
      id_reserva: reservaId,
    };

    let res: Response;
    if (existingId) {
      res = await fetch(
        `${SUPABASE_URL}/rest/v1/calificacion?id=eq.${encodeURIComponent(existingId)}`,
        {
          method: 'PATCH',
          headers: { ...headers, Prefer: 'return=minimal' },
          body: JSON.stringify({
            puntaje: body.puntaje,
            comentario: body.comentario,
          }),
        },
      );
    } else {
      res = await fetch(`${SUPABASE_URL}/rest/v1/calificacion`, {
        method: 'POST',
        headers: { ...headers, Prefer: 'return=minimal' },
        body: JSON.stringify(body),
      });
    }

    if (!res.ok) {
      return { ok: false, error: await res.text() };
    }

    // Recalcular promedio del calificado
    await fetchAndSyncUserRating(ratedPersonaId, ratedRole, { syncToProfile: true });
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Error de red' };
  }
}

/** Lee la calificación que YO di en una reserva (como calificador). */
export async function fetchMyRatingForTrip(
  reservaId: string,
  raterPersonaId: string,
): Promise<{ puntaje: number; comentario: string | null } | null> {
  if (!reservaId || !raterPersonaId) return null;

  try {
    const { data, error } = await supabase
      .from('calificacion')
      .select('puntaje,comentario')
      .eq('id_reserva', reservaId)
      .eq('id_calificador', raterPersonaId)
      .limit(1)
      .maybeSingle();
    if (error || !data) return null;
    return {
      puntaje: Number((data as any).puntaje) || 0,
      comentario: (data as any).comentario ?? null,
    };
  } catch {
    return null;
  }
}

/** Cuenta viajes COMPLETE/PAID desde la vista bookings. */
export async function countCompletedTrips(
  personaId: string,
  role: UserRatingRole,
): Promise<number> {
  if (!personaId) return 0;
  const col = role === 'driver' ? 'driver' : 'customer';

  try {
    const { count, error } = await supabase
      .from('bookings' as any)
      .select('id', { count: 'exact', head: true })
      .eq(col, personaId)
      .in('status', ['COMPLETE', 'PAID']);

    if (!error && typeof count === 'number' && count >= 0) {
      console.log('[userRating] trips count SDK', role, count);
      return count;
    }
    if (error) console.warn('[userRating] trips count SDK:', error.message);
  } catch (e: any) {
    console.warn('[userRating] trips count exception:', e?.message || e);
  }

  // Fallback REST list
  try {
    let headers = await getSupabaseAuthHeaders();
    if (!hasUserAuthHeader(headers)) {
      await refreshAuthSession();
      headers = await getSupabaseAuthHeaders();
    }
    const url =
      `${SUPABASE_URL}/rest/v1/bookings` +
      `?${col}=eq.${encodeURIComponent(personaId)}` +
      `&status=in.(COMPLETE,PAID)&select=id&limit=1000`;
    let res = await fetch(url, { headers });
    if (res.status === 401) {
      await refreshAuthSession();
      headers = await getSupabaseAuthHeaders();
      res = await fetch(url, { headers });
    }
    if (res.ok) {
      const rows = await res.json();
      return Array.isArray(rows) ? rows.length : 0;
    }
    console.warn('[userRating] trips REST', res.status, await res.text().catch(() => ''));
  } catch {
    /* ignore */
  }

  // Cliente: vista stats
  if (role === 'customer') {
    try {
      const { data } = await supabase
        .from('v_estadisticas_cliente' as any)
        .select('completadas')
        .eq('id_cliente', personaId)
        .limit(1)
        .maybeSingle();
      const n = Number((data as any)?.completadas);
      if (Number.isFinite(n) && n >= 0) return n;
    } catch {
      /* ignore */
    }
  }

  return 0;
}
