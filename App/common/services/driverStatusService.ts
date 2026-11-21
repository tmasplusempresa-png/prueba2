import { SUPABASE_URL, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';

/**
 * Guarda el GO del conductor en Supabase (perfil_conductor.en_servicio). El webhook de reservas lo usa para avisar
 * los servicios solo a conductores conectados. No bloquea el GO: si falla, el conductor sigue en línea en la app.
 */
export async function saveDriverOnlineStatus(online: boolean): Promise<void> {
  try {
    const headers = await getSupabaseAuthHeaders(true);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/app_conductor_set_en_linea`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ p_activo: online }),
    });
    if (!res.ok) console.warn('[GO] No se pudo guardar el estado en Supabase:', res.status, await res.text());
  } catch (e) {
    console.warn('[GO] No se pudo guardar el estado en Supabase:', e);
  }
}
