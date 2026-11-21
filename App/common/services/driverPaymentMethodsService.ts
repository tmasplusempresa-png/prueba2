import { SUPABASE_URL, getSupabaseAuthHeaders, hasUserAuthHeader } from '@/config/SupabaseConfig';

export type DriverPaymentMethods = {
  efectivo: boolean;
  daviplata: boolean;
  daviplata_numero: string | null;
  nequi: boolean;
  nequi_numero: string | null;
  nequi_breb: string | null;
  breb_activo: boolean;
  completo?: boolean;
};

export type DriverPaymentMethodsInput = {
  efectivo: boolean;
  daviplata: boolean;
  daviplata_numero: string;
  nequi: boolean;
  nequi_numero: string | null;
  nequi_breb: string | null;
  breb_activo: boolean;
};

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const headers = await getSupabaseAuthHeaders(true);
  if (!hasUserAuthHeader(headers)) throw new Error('Inicia sesión de nuevo para continuar.');
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json', Prefer: 'return=representation' },
    body: JSON.stringify(args),
  });
  if (!resp.ok) {
    let msg = 'No se pudo completar la operación.';
    try {
      const j = await resp.json();
      msg = j?.message || j?.error || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  return resp.json();
}

export const fetchMyPaymentMethods = () => rpc<DriverPaymentMethods>('app_conductor_metodos_pago_get');

export const saveMyPaymentMethods = (input: DriverPaymentMethodsInput) =>
  rpc<DriverPaymentMethods>('app_conductor_metodos_pago_guardar', { p_input: input });
