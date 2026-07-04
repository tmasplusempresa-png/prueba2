import { SUPABASE_URL, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';

/**
 * Código de referido PROPIO del usuario (el que debe mostrar/compartir).
 * Formato: AAA-XXXXX. NO confundir con users.referred_by_code, que es el código
 * de QUIEN lo invitó.
 */
export interface DriverReferralCode {
  referralCode: string;
  totalReferrals: number;
  isActive: boolean;
}

interface ReferralCodeRow {
  referral_code: string | null;
  total_referrals: number | null;
  is_active: boolean | null;
}

/**
 * Lee el código de referido propio del usuario (AAA-XXXXX) y su conteo de
 * referidos desde la tabla `referral_codes` del proyecto de la App.
 *
 * El código lo genera el trigger `handle_new_user` (ver
 * sql/create-referral-system-app.sql). Mientras el trigger no lo haya creado,
 * esta función devuelve `null` y la UI debe mostrar "Generando…".
 *
 * Usa el JWT del usuario (getSupabaseAuthHeaders) porque la fila está protegida
 * por RLS: cada usuario solo puede leer su propio código.
 *
 * @param authId  auth.users.id (o users.id) del usuario actual.
 */
export const getDriverOwnReferralCode = async (
  authId: string,
  signal?: AbortSignal,
): Promise<DriverReferralCode | null> => {
  if (!authId) return null;

  const headers = await getSupabaseAuthHeaders();

  // Una sola petición: traemos al usuario por auth_id (o id) y embebemos su
  // fila de referral_codes vía la FK referral_codes.driver_id -> users.id.
  const url =
    `${SUPABASE_URL}/rest/v1/users` +
    `?or=(auth_id.eq.${encodeURIComponent(authId)},id.eq.${encodeURIComponent(authId)})` +
    `&select=id,referral_codes(referral_code,total_referrals,is_active)` +
    `&limit=1`;

  try {
    const resp = await fetch(url, { headers, signal });
    if (!resp.ok) return null;

    const data = await resp.json();
    const row = Array.isArray(data) ? data[0] : null;
    if (!row) return null;

    // El embed puede venir como arreglo (relación 1-N) o como objeto.
    const embedded = row.referral_codes as ReferralCodeRow | ReferralCodeRow[] | null;
    const code: ReferralCodeRow | null = Array.isArray(embedded)
      ? embedded[0] ?? null
      : embedded ?? null;

    if (!code?.referral_code) return null;

    return {
      referralCode: String(code.referral_code),
      totalReferrals: Number(code.total_referrals ?? 0),
      isActive: code.is_active !== false,
    };
  } catch (e: any) {
    if (e?.name !== 'AbortError') {
      console.warn('[referralsService] getDriverOwnReferralCode error:', e?.message);
    }
    return null;
  }
};
