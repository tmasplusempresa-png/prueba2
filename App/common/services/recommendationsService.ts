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

/** Detalle de un viaje recomendado para el solicitante o el conductor que lo hizo. */
export interface RecommendedTripDetail {
  id: string;
  role: 'solicitante' | 'conductor';
  reference: string | null;
  status: string;
  bookingType: string | null;
  bookingDate: string | null;
  createdAt: string | null;
  carType: string | null;
  pickup: { address: string; lat: number | null; lng: number | null };
  drop: { address: string; lat: number | null; lng: number | null };
  distanceKm: number | null;
  durationMin: number | null;
  observations: string | null;
  customerName: string | null;
  customerPhone: string | null;
  driverName: string | null;
  driverPhone: string | null;
  driverImage: string | null;
  plate: string | null;
  vehicle: string | null;
  arrivedAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  finalPrice: number | null;
  requesterName: string;
  requesterPhone: string | null;
  fareSource: 'recomendada' | 'manual';
  fareMin: number;
  fareMax: number;
  /** Solo para el solicitante. */
  agreedValue: number | null;
  settlement: (Settlement & { receivedReportedAt: string | null }) | null;
  support: {
    requestedAt: string;
    requestedBy: string | null;
    mine: boolean;
    note: string | null;
    attendedAt: string | null;
    response: string | null;
    /** Solo el admin cierra el hilo; mientras sea null se puede seguir escribiendo. */
    closedAt: string | null;
    messages: { id: number; role: 'conductor' | 'admin'; body: string; createdAt: string; mine: boolean }[];
  } | null;
  route: { latitude: number; longitude: number }[];
  events: { type: string; createdAt: string; note: string | null }[];
  /** Métodos del conductor que hizo el viaje (para que el solicitante sepa cómo pagarle). */
  receiverPaymentMethods: {
    efectivo: boolean;
    daviplata: boolean;
    daviplataNumero: string | null;
    nequi: boolean;
    nequiNumero: string | null;
    nequiBreb: string | null;
  } | null;
}

export const fetchRecommendedTripDetail = async (bookingId: string, signal?: AbortSignal): Promise<RecommendedTripDetail> => {
  const d = await rpc<any>('app_recomendacion_detalle', { p_reserva: bookingId }, signal);
  const s = d.settlement;
  return {
    id: String(d.id ?? bookingId),
    role: d.role,
    reference: d.reference ?? null,
    status: String(d.status ?? ''),
    bookingType: d.booking_type ?? null,
    bookingDate: d.booking_date ?? null,
    createdAt: d.created_at ?? null,
    carType: d.car_type ?? null,
    pickup: { address: d.pickup_address ?? '', lat: num(d.pickup_lat), lng: num(d.pickup_lng) },
    drop: { address: d.drop_address ?? '', lat: num(d.drop_lat), lng: num(d.drop_lng) },
    distanceKm: num(d.distance),
    durationMin: d.duration == null ? null : Math.round(Number(d.duration) / 60),
    observations: d.observations ?? null,
    customerName: d.customer_name ?? null,
    customerPhone: d.customer_contact ?? null,
    driverName: d.driver_name ?? null,
    driverPhone: d.driver_contact ?? null,
    driverImage: d.driver_image ?? null,
    plate: d.plate_number ?? null,
    vehicle: [d.vehicle_make, d.vehicle_color].filter(Boolean).join(' · ') || null,
    arrivedAt: d.driver_arrived_time ?? null,
    startedAt: d.trip_start_time ?? null,
    endedAt: d.trip_end_time ?? null,
    finalPrice: num(d.final_price),
    requesterName: d.requester_name || 'Conductor',
    requesterPhone: d.requester_contact ?? null,
    fareSource: d.fare_source,
    fareMin: Number(d.fare_min || 0),
    fareMax: Number(d.fare_max || 0),
    agreedValue: num(d.agreed_value),
    settlement: s
      ? {
          status: s.status,
          amount: Number(s.amount ?? 0),
          dueAt: s.due_at,
          overdue: s.overdue === true,
          paidReportedAt: s.paid_reported_at ?? null,
          received: s.received ?? null,
          receivedReportedAt: s.received_reported_at ?? null,
          resolution: s.resolution ?? null,
          resolutionNote: s.resolution_note ?? null,
        }
      : null,
    support: d.support
      ? {
          requestedAt: d.support.requested_at,
          requestedBy: d.support.requested_by ?? null,
          mine: d.support.mine === true,
          note: d.support.note ?? null,
          attendedAt: d.support.attended_at ?? null,
          response: d.support.response ?? null,
          closedAt: d.support.closed_at ?? null,
          messages: (Array.isArray(d.support.messages) ? d.support.messages : []).map((m: any) => ({
            id: Number(m.id),
            role: m.role === 'admin' ? 'admin' as const : 'conductor' as const,
            body: String(m.body ?? ''),
            createdAt: m.created_at,
            mine: m.mine === true,
          })),
        }
      : null,
    route: (Array.isArray(d.route) ? d.route : [])
      .map((p: any) => ({ latitude: Number(p.lat), longitude: Number(p.lng) }))
      .filter((p: { latitude: number; longitude: number }) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude)),
    events: (Array.isArray(d.events) ? d.events : []).map((e: any) => ({
      type: e.type,
      createdAt: e.created_at,
      note: e.note ?? null,
    })),
    receiverPaymentMethods: d.receiver_payment_methods
      ? {
          efectivo: d.receiver_payment_methods.efectivo === true,
          daviplata: d.receiver_payment_methods.daviplata === true,
          daviplataNumero: d.receiver_payment_methods.daviplata_numero ?? null,
          nequi: d.receiver_payment_methods.nequi === true,
          nequiNumero: d.receiver_payment_methods.nequi_numero ?? null,
          nequiBreb: d.receiver_payment_methods.nequi_breb ?? null,
        }
      : null,
  };
};

export const reportRecommendationSupport = (bookingId: string, note: string) =>
  rpc('app_recomendacion_reportar_soporte', { p_reserva: bookingId, p_nota: note });

const FINISHED_TRIP_STATUSES = ['COMPLETE', 'PAID', 'CANCELLED'];
const OPEN_SETTLEMENT_STATUSES: SettlementStatus[] = ['pendiente', 'pago_reportado', 'en_disputa'];

/** Contadores para el GO: viajes pedidos en curso y completados con el pago entre conductores sin cerrar. */
export const countOpenRequests = (requests: RecommendedRequest[]) => ({
  active: requests.filter((r) => !FINISHED_TRIP_STATUSES.includes(String(r.status).toUpperCase())).length,
  unpaid: requests.filter((r) => r.settlement && OPEN_SETTLEMENT_STATUSES.includes(r.settlement.status)).length,
});

export const RECOMMENDATION_EVENT_LABELS: Record<string, string> = {
  creada: 'Viaje solicitado',
  cancelada: 'Viaje cancelado',
  liquidacion_abierta: 'Viaje completado: empieza el plazo de 24 h para pagar',
  monto_actualizado: 'Valor final ajustado',
  pago_reportado: 'El solicitante reportó el pago',
  pago_recibido: 'El conductor confirmó que recibió el pago',
  pago_no_recibido: 'El conductor reportó que no recibió el pago',
  resuelta: 'Soporte resolvió la liquidación',
  soporte_reportado: 'Mensaje enviado a soporte',
  soporte_atendido: 'Soporte respondió o cerró el caso',
};

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
