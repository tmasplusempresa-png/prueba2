import { Buffer } from 'buffer';
import { SUPABASE_URL, getSupabaseAuthHeaders, hasUserAuthHeader } from '@/config/SupabaseConfig';

/**
 * Empresas en las que el usuario de la sesión es colaborador activo.
 *
 * Esquema core: RPC `app_mis_empresas()` (empresa_colaborador + perfil_empresa).
 * Solo devuelve vínculos activos de empresas no bloqueadas; lista vacía = sin servicio empresarial.
 */
export interface MyCompany {
  id: string;
  name: string;
  logoUrl: string | null;
}

/** Empresa a la que se factura un viaje, con los datos que le tocan a quien consulta. */
export interface BookingCompany extends MyCompany {
  /** Centro de costo o motivo: solo lo recibe el pasajero. */
  costCenter: string | null;
  /** Si T+Plus ya le pagó el viaje al conductor: solo lo recibe el conductor. */
  driverPaymentStatus: 'pagado' | 'sin_pagar' | null;
}

/**
 * Cabecera con la empresa elegida al crear una reserva con pago empresarial.
 * La lee el trigger de `reserva` (request.headers) cuando el colaborador pertenece a varias empresas.
 */
export const CORPORATE_COMPANY_HEADER = 'x-tplus-empresa';
/** Centro de costo o motivo del viaje empresarial (texto UTF-8 en base64: las cabeceras no admiten tildes). */
export const CORPORATE_COST_CENTER_HEADER = 'x-tplus-centro-costo';
export const COST_CENTER_MAX_LENGTH = 80;

export const encodeCostCenterHeader = (text: string): string =>
  Buffer.from(text.trim().slice(0, COST_CENTER_MAX_LENGTH), 'utf8').toString('base64');

const callRpc = async (fn: string, args: Record<string, unknown>, signal?: AbortSignal): Promise<any[]> => {
  const headers = await getSupabaseAuthHeaders(true);
  if (!hasUserAuthHeader(headers)) return [];

  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(args),
    signal,
  });
  if (!resp.ok) {
    console.warn(`[companiesService] ${fn}`, resp.status, await resp.text());
    return [];
  }
  const rows = await resp.json();
  return Array.isArray(rows) ? rows.filter((row) => row?.id_empresa) : [];
};

const toCompany = (row: any): MyCompany => ({
  id: String(row.id_empresa),
  name: String(row.nombre || 'Empresa'),
  logoUrl: row.logo_url ? String(row.logo_url) : null,
});

const toBookingCompany = (row: any): BookingCompany => ({
  ...toCompany(row),
  costCenter: row.centro_costo ? String(row.centro_costo) : null,
  driverPaymentStatus:
    row.estado_pago_conductor === 'pagado' || row.estado_pago_conductor === 'sin_pagar'
      ? row.estado_pago_conductor
      : null,
});

export const fetchMyCompanies = async (signal?: AbortSignal): Promise<MyCompany[]> =>
  (await callRpc('app_mis_empresas', {}, signal)).map(toCompany);

/** Empresa a la que se factura un viaje (RPC `app_reserva_empresa`); solo pasajero, conductor o admin. */
export const fetchBookingCompany = async (
  bookingId: string,
  signal?: AbortSignal,
): Promise<BookingCompany | null> => {
  const [row] = await callRpc('app_reserva_empresa', { p_reserva: bookingId }, signal);
  return row ? toBookingCompany(row) : null;
};

/** Igual que fetchBookingCompany para una lista de viajes (máx. 200), indexado por id de reserva. */
export const fetchBookingsCompanies = async (
  bookingIds: string[],
  signal?: AbortSignal,
): Promise<Record<string, BookingCompany>> => {
  if (bookingIds.length === 0) return {};
  const rows = await callRpc('app_reservas_empresa', { p_reservas: bookingIds.slice(0, 200) }, signal);
  return Object.fromEntries(rows.map((row) => [String(row.id_reserva), toBookingCompany(row)]));
};
