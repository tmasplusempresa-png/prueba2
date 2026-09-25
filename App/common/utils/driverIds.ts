/**
 * En aplicacioncore, memberships.conductor / bookings.driver_id usan
 * persona.id (= users.id). auth.users.id vive en users.auth_id.
 *
 * Orden: ids públicos primero; auth uids al final solo para lookup OR(id, auth_id).
 */

function pushUnique(ids: string[], value: unknown) {
  const s = value != null ? String(value).trim() : '';
  if (s && !ids.includes(s)) ids.push(s);
}

/** True si el objeto parece fila users/persona (tiene auth_id distinto de id). */
function looksLikePublicProfile(obj: any): boolean {
  if (!obj?.id || !obj?.auth_id) return false;
  return String(obj.id) !== String(obj.auth_id);
}

export function collectDriverIdCandidates(user: any, profile: any): string[] {
  const ids: string[] = [];

  // 1) persona.id / users.id
  pushUnique(ids, profile?.id);
  if (looksLikePublicProfile(user)) pushUnique(ids, user.id);
  pushUnique(ids, user?.user_metadata?.id);

  // 2) auth uids (fallback para resolver vía auth_id)
  pushUnique(ids, profile?.auth_id);
  pushUnique(ids, user?.auth_id);
  if (!looksLikePublicProfile(user)) pushUnique(ids, user?.id);
  pushUnique(ids, user?.uid);

  return ids;
}

/** Id canónico para memberships.conductor y bookings.driver_id.
 *  Solo persona.id / users.id — nunca auth uid (devolvería 0 membresías).
 */
export function preferredConductorId(user: any, profile: any): string | null {
  if (profile?.id) return String(profile.id);
  if (looksLikePublicProfile(user)) return String(user.id);
  return null;
}
