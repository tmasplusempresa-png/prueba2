import { differenceInDays } from 'date-fns';

/**
 * Resolución de membresía alineada con el admin web
 * (`MembershipsService.statusByConductor`: la más reciente por created_at).
 *
 * Antes la app prefería cualquier fila ACTIVA (aunque fuera vieja), así que
 * al marcar la membresía reciente como VENCIDA en admin, la billetera seguía
 * mostrando otra ACTIVA anterior.
 */

export type MembershipLike = {
  uid?: string;
  conductor?: string;
  status?: string;
  costo?: number;
  fecha_inicio?: string;
  fecha_terminada?: string;
  periodo?: number;
  created_at?: string;
  [key: string]: unknown;
};

function createdAtMs(m: MembershipLike): number {
  const raw = m.created_at || m.fecha_inicio || 0;
  const t = new Date(raw as string).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Más reciente primero (mismo criterio que el panel admin). */
export function sortMembershipsNewestFirst<T extends MembershipLike>(list: T[] | null | undefined): T[] {
  return [...(list || [])].sort((a, b) => createdAtMs(b) - createdAtMs(a));
}

export function isMembershipDateValid(m: MembershipLike | null | undefined, now = new Date()): boolean {
  if (!m?.fecha_terminada) return true;
  try {
    return differenceInDays(new Date(m.fecha_terminada), now) >= 0;
  } catch {
    return false;
  }
}

/** Membresía vigente para operar (viajes, recomendados, aceptar servicios). */
export function findActiveMembership<T extends MembershipLike>(
  memberships: T[] | null | undefined,
): T | null {
  const current = findCurrentMembership(memberships);
  if (!current) return null;
  const st = String(current.status || '').toUpperCase();
  if (st !== 'ACTIVA') return null;
  if (!isMembershipDateValid(current)) return null;
  return current;
}

/**
 * Membresía “actual” a mostrar en billetera = la más reciente.
 * (Si admin cambia esa fila a VENCIDA, la app refleja VENCIDA.)
 */
export function findCurrentMembership<T extends MembershipLike>(
  memberships: T[] | null | undefined,
): T | null {
  const sorted = sortMembershipsNewestFirst(memberships);
  return sorted[0] || null;
}

/** Estado visible: ACTIVA con fecha pasada → VENCIDA. */
export function resolveMembershipDisplayStatus(m: MembershipLike | null | undefined): string {
  if (!m) return 'Sin datos';
  const st = String(m.status || '').toUpperCase() || 'Sin datos';
  if (st === 'ACTIVA' && !isMembershipDateValid(m)) return 'VENCIDA';
  return st;
}

export function membershipDaysRemaining(m: MembershipLike | null | undefined, now = new Date()): number {
  if (!m?.fecha_terminada) return 0;
  try {
    return differenceInDays(new Date(m.fecha_terminada), now);
  } catch {
    return 0;
  }
}
