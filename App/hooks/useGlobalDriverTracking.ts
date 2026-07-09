import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/common/store/store';
import supabase, { SUPABASE_URL, getSupabaseAuthHeaders } from '@/config/SupabaseConfig';
import {
  startDriverLocationTracking,
  stopDriverLocationTracking,
} from '@/common/services/driverLocationTask';

const ACTIVE_STATUSES = ['ACCEPTED', 'ARRIVED', 'STARTED', 'IN_PROGRESS', 'TRIP_STARTED'];

function pickUserType(user: any, profile: any): string {
  return String(
    profile?.user_type ||
      user?.usertype ||
      user?.user_type ||
      user?.userType ||
      user?.user_metadata?.usertype ||
      user?.user_metadata?.user_type ||
      user?.user_metadata?.userType ||
      '',
  )
    .trim()
    .toLowerCase();
}

// bookings.driver_id referencia users.id (tabla pública), no auth_id.
// La sesión restaurada en cold start solo trae el SupabaseUser, así que hay
// que resolver el id público vía OR sobre id/auth_id como hace index.tsx:976.
async function resolveDriverPublicId(
  candidates: string[],
  headers: Record<string, string>,
): Promise<string | null> {
  for (const c of candidates) {
    if (!c) continue;
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/users?or=(id.eq.${c},auth_id.eq.${c})&select=id&limit=1`,
        { headers },
      );
      if (r.ok) {
        const rows = await r.json();
        if (rows?.[0]?.id) return rows[0].id;
      }
    } catch (e) {
      console.error('[GlobalDriverTracking] resolve users.id error:', e);
    }
  }
  return null;
}

export function useGlobalDriverTracking() {
  const user = useSelector((state: RootState) => (state as any).auth?.user as any);
  const profile = useSelector((state: RootState) => (state as any).auth?.profile as any);

  const userType = pickUserType(user, profile);
  const isDriver = userType === 'driver';
  const idCandidates: string[] = [
    user?.id,
    user?.auth_id,
    profile?.id,
    profile?.auth_id,
    user?.user_metadata?.id,
  ].filter(Boolean);
  const candidatesKey = idCandidates.join('|');

  useEffect(() => {
    console.log('[GlobalDriverTracking] userType="' + userType + '" isDriver=' + isDriver + ' candidates=' + idCandidates.length + ' [' + candidatesKey + ']');
    if (!isDriver || idCandidates.length === 0) {
      stopDriverLocationTracking();
      return;
    }

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let publicDriverId: string | null = null;

    const reevaluate = async () => {
      if (cancelled) return;
      try {
        const headers = await getSupabaseAuthHeaders();
        if (!publicDriverId) {
          publicDriverId = await resolveDriverPublicId(idCandidates, headers);
          if (cancelled) return;
          if (!publicDriverId) {
            console.error('[GlobalDriverTracking] could not resolve users.id from', idCandidates);
            return;
          }
          console.log('[GlobalDriverTracking] resolved publicDriverId =', publicDriverId);
        }

        const statuses = ACTIVE_STATUSES.map(s => `"${s}"`).join(',');
        const url = `${SUPABASE_URL}/rest/v1/bookings?driver_id=eq.${publicDriverId}&status=in.(${statuses})&order=created_at.desc&limit=1&select=id,status`;
        const resp = await fetch(url, { headers });
        if (!resp.ok) {
          console.error('[GlobalDriverTracking] bookings query failed:', resp.status, await resp.text());
          return;
        }
        const rows = await resp.json();
        if (cancelled) return;

        const activeBookingId: string | undefined = rows?.[0]?.id;
        console.log('[GlobalDriverTracking] bookings query rows:', rows?.length ?? 0, rows?.[0] ?? 'none');
        if (activeBookingId) {
          console.log('[GlobalDriverTracking] active booking found:', activeBookingId, rows[0].status);
          const ok = await startDriverLocationTracking(activeBookingId, publicDriverId);
          if (!ok) {
            // No es un error: startDriverLocationTracking devuelve false cuando aún
            // faltan permisos/consentimiento de ubicación en segundo plano (en cuyo
            // caso ya se disparó la pantalla de divulgación) o cuando el usuario los
            // negó. El único fallo real (startLocationUpdatesAsync lanza) ya se
            // registra con console.error dentro de driverLocationTask. Aquí solo
            // avisamos —si fuera error, este hook lo repetiría cada 15s (poll).
            console.warn('[GlobalDriverTracking] tracking no iniciado: permisos/consentimiento de ubicación en segundo plano pendientes');
          }
        } else {
          await stopDriverLocationTracking();
        }
      } catch (e) {
        console.error('[GlobalDriverTracking] reevaluate exception:', e);
      }
    };

    reevaluate();

    const setupChannel = async () => {
      if (cancelled) return;
      if (!publicDriverId) return;
      channel = supabase
        .channel(`driver-active-bookings-${publicDriverId}`)
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: 'bookings',
            filter: `driver_id=eq.${publicDriverId}`,
          },
          () => {
            reevaluate();
          },
        )
        .subscribe(status => {
          console.log('[GlobalDriverTracking] realtime subscription status:', status);
        });
    };

    const pollInterval = setInterval(() => {
      if (channel === null && publicDriverId) setupChannel();
      reevaluate();
    }, 15000);

    setupChannel();

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      if (channel) supabase.removeChannel(channel);
      stopDriverLocationTracking();
    };
  }, [isDriver, candidatesKey]);
}
