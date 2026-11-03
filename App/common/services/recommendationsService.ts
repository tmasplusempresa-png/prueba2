import { SUPABASE_URL, getSupabaseAuthHeaders, hasUserAuthHeader } from '@/config/SupabaseConfig';

/**
 * Reservas recomendadas: un conductor pide viajes a nombre de clientes de su cartera y otro conductor los hace.
 * El cliente le paga al conductor que solicitó; este le paga al que hizo el viaje en las 24 h siguientes.
 *
 * Esquema core (020_reservas_recomendadas.sql): conductor_cliente, reserva_recomendada,
 * reserva_recomendada_liquidacion, reserva_recomendada_evento. Todo pasa por RPC SECURITY DEFINER.
 * El valor acordado con el cliente solo lo recibe el conductor que solicitó.
 */

export interface PortfolioClient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  photo: string | null;
  origin: 'registrado' | 'agregado';
  blocked: boolean;
  addedAt: string;
  trips: number;
  lastTripAt: string | null;
}

export interface ClientMatch {
  id: string;
  firstName: string;
  lastName: string;
  maskedEmail: string | null;
  maskedPhone: string | null;
  isClient: boolean;
  inPortfolio: boolean;
  matches: string[];
}

export interface NewClientInput {
  first_name: string;
  last_name: string;
  mobile: string;
  email: string;
  document_type?: string | null;
  document_number?: string | null;
}

export type SettlementStatus = 'pendiente' | 'pago_reportado' | 'confirmado' | 'en_disputa' | 'resuelto';
export type SettlementAction = 'pague' | 'recibi' | 'no_recibi';

export interface Settlement {
  status: SettlementStatus;
  amount: number;
  dueAt: string;
  overdue: boolean;
  paidReportedAt: string | null;
  received: boolean | null;
  resolution: 'pagado' | 'no_pagado' | 'anulado' | null;
  resolutionNote: string | null;
}

/** Fila de "Solicitados por mí". */
export interface RecommendedRequest {
  id: string;
  reference: string | null;
  status: string;
  bookingType: string;
  requestedAt: string;
  pickupAddress: string;
  dropAddress: string;
  distanceKm: number;
  category: string | null;
  clientId: string;
  clientName: string;
  clientPhone: string | null;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  plate: string | null;
  fareSource: 'recomendada' | 'manual';
  fareMin: number;
  fareMax: number;
  finalPrice: number | null;
  agreedValue: number | null;
  estimatedEarnings: number | null;
  settlement: Settlement | null;
}

/** Datos de recomendación de un viaje según quien pregunta. */
export interface RecommendationInfo {
  bookingId: string;
  viewerRole: 'solicitante' | 'conductor' | 'cliente' | 'admin';
  requesterId: string;
  requesterName: string;
  requesterPhone: string | null;
  fareMin: number | null;
  fareMax: number | null;
  agreedValue: number | null;
  settlement: Settlement | null;
}

export interface TripForClientInput {
  car_type_id: number;
  booking_type: 'immediate' | 'scheduled';
  booking_date?: string;
  pickup: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  distance_km: number;
  duration_min: number;
  fare_source: 'recomendada' | 'manual';
  fare_min: number;
  fare_max: number;
  agreed_value?: number | null;
  observations?: string | null;
}

const num = (value: unknown): number | null =>
  value === null || value === undefined || value === '' ? null : Number(value);

const errorFrom = async (resp: Response, fallback: string): Promise<Error> => {
  const text = await resp.text();
  try {
    const parsed = JSON.parse(text);
    return new Error(parsed?.message || parsed?.error || fallback);
  } catch {
    return new Error(text || fallback);
  }
};

const rpc = async <T = any>(fn: string, args: Record<string, unknown>, signal?: AbortSignal): Promise<T> => {
  const headers = await getSupabaseAuthHeaders(true);
  if (!hasUserAuthHeader(headers)) throw new Error('Inicia sesión de nuevo para continuar.');
  const resp = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(args),
    signal,
  });
  if (!resp.ok) throw await errorFrom(resp, 'No se pudo completar la operación.');
  const text = await resp.text();
  return (text ? JSON.parse(text) : null) as T;
};

const toSettlement = (row: any, prefix: 'liquidacion' | 'liq' = 'liquidacion'): Settlement | null => {
  const status = row[`${prefix}_estado`];
  if (!status) return null;
  return {
    status,
    amount: Number(row[`${prefix}_monto`] ?? 0),
    dueAt: row[`${prefix}_vence_en`],
    overdue: row[`${prefix}_vencida`] === true,
    paidReportedAt: row.pago_reportado_en ?? null,
    received: row.recibido ?? null,
    resolution: row.resultado_admin ?? null,
    resolutionNote: row.nota_resolucion ?? null,
  };
};

export const fetchMyClients = async (signal?: AbortSignal): Promise<PortfolioClient[]> => {
  const rows = await rpc<any[]>('app_conductor_mis_clientes', {}, signal);
  return (rows || []).map((r) => ({
    id: String(r.id_cliente),
    firstName: r.nombre || '',
    lastName: r.apellido || '',
    phone: r.telefono ?? null,
    email: r.email ?? null,
    photo: r.imagen_perfil ?? null,
    origin: r.origen,
    blocked: r.bloqueado === true,
    addedAt: r.agregado_en,
    trips: Number(r.viajes || 0),
    lastTripAt: r.ultimo_viaje ?? null,
  }));
};

/** Coincidencia exacta por celular, correo o documento; devuelve datos parcialmente ocultos. */
export const searchClients = async (
  input: { mobile?: string; email?: string; document_number?: string },
): Promise<ClientMatch[]> => {
  const rows = await rpc<any[]>('app_conductor_buscar_cliente', { p_input: input });
  return (rows || []).map((r) => ({
    id: String(r.persona_id),
    firstName: r.nombres || '',
    lastName: r.apellidos || '',
    maskedEmail: r.correo_visible ?? null,
    maskedPhone: r.telefono_visible ?? null,
    isClient: r.es_cliente === true,
    inPortfolio: r.en_cartera === true,
    matches: Array.isArray(r.coincidencias) ? r.coincidencias : [],
  }));
};

/** Agrega un cliente existente; los datos enviados deben ser los mismos con los que se encontró. */
export const addExistingClient = (clientId: string, input: Record<string, string>) =>
  rpc('app_conductor_agregar_cliente', { p_cliente: clientId, p_input: input });

export const setClientActive = (clientId: string, active: boolean) =>
  rpc('app_conductor_set_cliente_activo', { p_cliente: clientId, p_activo: active });

/**
 * Registra un cliente nuevo (Edge Function core-driver-client). Al cliente le llega un correo para crear su
 * contraseña y entrar a la app como cualquier usuario.
 */
export const registerClient = async (
  input: NewClientInput,
): Promise<{ clientId: string; invitationSent: boolean; warning: string | null }> => {
  const headers = await getSupabaseAuthHeaders(true);
  if (!hasUserAuthHeader(headers)) throw new Error('Inicia sesión de nuevo para continuar.');
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/core-driver-client`, {
    method: 'POST',
    headers,
    body: JSON.stringify(input),
  });
  if (!resp.ok) throw await errorFrom(resp, 'No se pudo registrar el cliente.');
  const data = await resp.json();
  return {
    clientId: String(data.id_cliente),
    invitationSent: data.invitationSent === true,
    warning: data.warning ?? null,
  };
};

export const requestTripForClient = async (clientId: string, input: TripForClientInput): Promise<string> =>
  String(await rpc<string>('app_conductor_solicitar_viaje', { p_cliente: clientId, p_input: input }));

export const fetchMyRequests = async (limit = 100, signal?: AbortSignal): Promise<RecommendedRequest[]> => {
  const rows = await rpc<any[]>('app_conductor_mis_solicitudes', { p_limite: limit }, signal);
  return (rows || []).map((r) => ({
    id: String(r.id_reserva),
    reference: r.referencia ?? null,
    status: r.estado,
    bookingType: r.tipo_reserva,
    requestedAt: r.solicitado_en,
    pickupAddress: r.origen_direccion || '',
    dropAddress: r.destino_direccion || '',
    distanceKm: Number(r.distancia_km || 0),
    category: r.categoria ?? null,
    clientId: String(r.cliente_id),
    clientName: r.cliente_nombre || 'Cliente',
    clientPhone: r.cliente_telefono ?? null,
    driverId: r.conductor_id ?? null,
    driverName: r.conductor_nombre ?? null,
    driverPhone: r.conductor_telefono ?? null,
    plate: r.placa ?? null,
    fareSource: r.tarifa_origen,
    fareMin: Number(r.tarifa_min || 0),
    fareMax: Number(r.tarifa_max || 0),
    finalPrice: num(r.precio_final),
    agreedValue: num(r.valor_acordado),
    estimatedEarnings: num(r.ganancia_estimada),
    settlement: toSettlement(r),
  }));
};

/** Datos de recomendación de varios viajes (máx. 200) indexados por id de reserva. */
export const fetchRecommendationInfo = async (
  bookingIds: string[],
  signal?: AbortSignal,
): Promise<Record<string, RecommendationInfo>> => {
  if (bookingIds.length === 0) return {};
  const rows = await rpc<any[]>('app_reservas_recomendadas', { p_reservas: bookingIds.slice(0, 200) }, signal);
  return Object.fromEntries(
    (rows || []).map((r) => [
      String(r.id_reserva),
      {
        bookingId: String(r.id_reserva),
        viewerRole: r.rol,
        requesterId: String(r.solicitante_id),
        requesterName: r.solicitante_nombre || 'Conductor',
        requesterPhone: r.solicitante_telefono ?? null,
        fareMin: num(r.tarifa_min),
        fareMax: num(r.tarifa_max),
        agreedValue: num(r.valor_acordado),
        settlement: toSettlement(r),
      } as RecommendationInfo,
    ]),
  );
};

export const reportSettlement = (bookingId: string, action: SettlementAction, note?: string) =>
  rpc<{ estado: SettlementStatus; vencida: boolean }>('app_recomendacion_reportar', {
    p_reserva: bookingId,
    p_accion: action,
    p_nota: note ?? null,
  });

export const SETTLEMENT_LABELS: Record<SettlementStatus, string> = {
  pendiente: 'Pendiente de pago',
  pago_reportado: 'Pago reportado',
  confirmado: 'Pago confirmado',
  en_disputa: 'En revisión por soporte',
  resuelto: 'Resuelto por soporte',
};

export const settlementLabel = (s: Settlement): string =>
  s.overdue ? 'Vencido · en revisión' : SETTLEMENT_LABELS[s.status] ?? s.status;

export const settlementColor = (s: Settlement): string => {
  if (s.status === 'confirmado' || (s.status === 'resuelto' && s.resolution === 'pagado')) return '#00E676';
  if (s.overdue || s.status === 'en_disputa') return '#FF5252';
  return '#FFB300';
};
