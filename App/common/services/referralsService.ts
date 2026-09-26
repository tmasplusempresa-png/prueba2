import { SUPABASE_URL, getSupabaseAuthHeaders, hasUserAuthHeader } from '@/config/SupabaseConfig';

/**
 * Código de referido PROPIO del usuario (el que debe mostrar/compartir).
 * Formato típico: AAA-XXXXX.
 *
 * Esquema aplicacioncore: tabla `codigo_referido`
 *   (codigo, id_persona, total_referidos, activo)
 * Fallback conductor: perfil_conductor.codigo_recomendacion
 *
 * NO confundir con persona.codigo_referido_usado / users.referred_by_code
 * (código de QUIEN lo invitó).
 */
export interface DriverReferralCode {
  referralCode: string;
  totalReferrals: number;
  isActive: boolean;
}

async function resolvePersonaId(
  authId: string,
  headers: Record<string, string>,
  signal?: AbortSignal,
): Promise<{ id: string; nombre: string | null } | null> {
  const url =
    `${SUPABASE_URL}/rest/v1/users` +
    `?or=(auth_id.eq.${encodeURIComponent(authId)},id.eq.${encodeURIComponent(authId)})` +
    `&select=id,first_name,last_name&limit=1`;
  const resp = await fetch(url, { headers, signal });
  if (!resp.ok) return null;
  const data = await resp.json();
  const row = Array.isArray(data) ? data[0] : null;
  if (!row?.id) return null;
  const nombre = [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || null;
  return { id: String(row.id), nombre };
}

/**
 * Lee (o crea) el código de referido propio del usuario.
 */
export const getDriverOwnReferralCode = async (
  authId: string,
  signal?: AbortSignal,
): Promise<DriverReferralCode | null> => {
  if (!authId) return null;

  const headers = await getSupabaseAuthHeaders(true);
  if (!hasUserAuthHeader(headers)) {
    console.warn('[referralsService] sin JWT — no se puede leer código de referido');
    return null;
  }

  try {
    const persona = await resolvePersonaId(authId, headers, signal);
    if (!persona) return null;

    // 1) Tabla codigo_referido (clientes y conductores)
    const codeUrl =
      `${SUPABASE_URL}/rest/v1/codigo_referido` +
      `?id_persona=eq.${encodeURIComponent(persona.id)}` +
      `&select=codigo,total_referidos,activo&limit=1`;
    const codeResp = await fetch(codeUrl, { headers, signal });
    if (codeResp.ok) {
      const rows = await codeResp.json();
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row?.codigo) {
        return {
          referralCode: String(row.codigo),
          totalReferrals: Number(row.total_referidos ?? 0),
          isActive: row.activo !== false,
        };
      }
    }

    // 2) Fallback conductor: perfil_conductor.codigo_recomendacion
    const driverUrl =
      `${SUPABASE_URL}/rest/v1/perfil_conductor` +
      `?id_persona=eq.${encodeURIComponent(persona.id)}` +
      `&select=codigo_recomendacion&limit=1`;
    const driverResp = await fetch(driverUrl, { headers, signal });
    if (driverResp.ok) {
      const drows = await driverResp.json();
      const drow = Array.isArray(drows) ? drows[0] : null;
      if (drow?.codigo_recomendacion) {
        return {
          referralCode: String(drow.codigo_recomendacion),
          totalReferrals: 0,
          isActive: true,
        };
      }
    }

    // 3) Crear código vía RPC + insert en codigo_referido
    const genName = persona.nombre || 'Usuario';
    const rpcUrl = `${SUPABASE_URL}/rest/v1/rpc/generar_codigo_referido`;
    const rpcResp = await fetch(rpcUrl, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({ p_nombre: genName }),
    });

    let generated: string | null = null;
    if (rpcResp.ok) {
      const rpcData = await rpcResp.json();
      generated =
        typeof rpcData === 'string'
          ? rpcData
          : rpcData?.codigo || rpcData?.generar_codigo_referido || null;
    }

    if (!generated) {
      // Fallback local si el RPC no está disponible
      const prefix = genName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z]/g, '')
        .slice(0, 3)
        .toUpperCase()
        .padEnd(3, 'X');
      const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
      generated = `${prefix}-${suffix}`;
    }

    const insertResp = await fetch(`${SUPABASE_URL}/rest/v1/codigo_referido`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'return=representation' },
      signal,
      body: JSON.stringify({
        id_persona: persona.id,
        codigo: generated,
        total_referidos: 0,
        activo: true,
      }),
    });

    if (insertResp.ok) {
      const inserted = await insertResp.json();
      const row = Array.isArray(inserted) ? inserted[0] : inserted;
      if (row?.codigo) {
        return {
          referralCode: String(row.codigo),
          totalReferrals: Number(row.total_referidos ?? 0),
          isActive: row.activo !== false,
        };
      }
    } else {
      // Conflicto único: re-leer
      const retry = await fetch(codeUrl, { headers, signal });
      if (retry.ok) {
        const rows = await retry.json();
        const row = Array.isArray(rows) ? rows[0] : null;
        if (row?.codigo) {
          return {
            referralCode: String(row.codigo),
            totalReferrals: Number(row.total_referidos ?? 0),
            isActive: row.activo !== false,
          };
        }
      }
      const errText = await insertResp.text().catch(() => '');
      console.warn('[referralsService] insert codigo_referido failed:', insertResp.status, errText);
    }

    return null;
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      console.warn('[referralsService] getDriverOwnReferralCode error:', e?.message);
    }
    return null;
  }
};
