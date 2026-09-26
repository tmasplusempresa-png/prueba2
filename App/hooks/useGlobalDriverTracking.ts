import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RootState } from '@/common/store/store';
import supabase, {
  SUPABASE_URL,
  getSafeSession,
  getSupabaseAuthHeaders,
  hasUserAuthHeader,
} from '@/config/SupabaseConfig';
import {
  startDriverLocationTracking,
  stopDriverLocationTracking,
} from '@/common/services/driverLocationTask';
import {
  collectDriverIdCandidates,
} from '@/common/utils/driverIds';

const ACTIVE_STATUSES = ['ACCEPTED', 'ARRIVED', 'STARTED', 'IN_PROGRESS', 'TRIP_STARTED'];

// Watchdog anti-kill: si el foreground service muere silenciosamente en OEMs
// agresivos (MIUI, EMUI, ColorOS), `hasStartedLocationUpdatesAsync` puede
// seguir devolviendo true pero ya no llegan puntos. Cada WATCHDOG_INTERVAL_MS
// verificamos el timestamp del último insert; si excede WATCHDOG_GAP_MS con
// booking activo, forzamos stop+start para revivir el service.
const WATCHDOG_INTERVAL_MS = 30_000;
const WATCHDOG_GAP_MS = 60_000;
const LAST_INSERT_KEY = 'driver_tracking_last_insert';

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

// bookings.driver_id referencia users.id (persona.id), no auth_id.
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
      } else if (r.status === 401 || r.status === 403) {
        console.warn('[GlobalDriverTracking] users resolve unauthorized:', r.status);
        return null;
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
  const idCandidates = collectDriverIdCandidates(user, profile);
  const candidatesKey = idCandidates.join('|');

  useEffect(() => {
    console.log('[GlobalDriverTracking] userType="' + userType + '" isDriver=' + isDriver + ' candidates=' + idCandidates.length + ' [' + candidatesKey + ']');
    if (!isDriver || idCandidates.length === 0) {
      stopDriverLocationTracking();
      return;
    }

    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    // Solo confiar en profile.id (= users.id). Si aún no hay perfil, resolver vía API.
    let publicDriverId: string | null = profile?.id ? String(profile.id) : null;
    let currentActiveBookingId: string | null = null;
    let warnedNoSession = false;

    const reevaluate = async () => {
      if (cancelled) return;
      try {
        const session = await getSafeSession();
        if (!session?.access_token) {
          if (!warnedNoSession) {
            warnedNoSession = true;
            console.warn('[GlobalDriverTracking] sin sesión JWT — se reintenta cuando haya login');
          }
          return;
        }
        warnedNoSession = false;

        const headers = await getSupabaseAuthHeaders();
        if (!hasUserAuthHeader(headers)) {
          if (!warnedNoSession) {
            warnedNoSession = true;
            console.warn('[GlobalDriverTracking] sin JWT de usuario — se reintenta cuando haya login');
          }
          return;
        }
        if (!publicDriverId) {
          publicDriverId = await resolveDriverPublicId(idCandidates, headers);
          if (cancelled) return;
          if (!publicDriverId) {
            console.warn('[GlobalDriverTracking] could not resolve users.id from', idCandidates);
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
        currentActiveBookingId = activeBookingId ?? null;
        console.log('[GlobalDriverTracking] bookings query rows:', rows?.length ?? 0, rows?.[0] ?? 'none');
        if (activeBookingId) {
          console.log('[GlobalDriverTracking] active booking found:', activeBookingId, rows[0].status);
          const ok = await startDriverLocationTracking(activeBookingId, publicDriverId);
          if (!ok) {
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
            table: 'reserva',
            filter: `id_conductor=eq.${publicDriverId}`,
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

    const watchdogInterval = setInterval(async () => {
      if (cancelled) return;
      if (!currentActiveBookingId || !publicDriverId) return;
      try {
        const raw = await AsyncStorage.getItem(LAST_INSERT_KEY);
        if (!raw) {
          return;
        }
        const last = JSON.parse(raw) as { lat: number; lng: number; time: number };
        const gap = Date.now() - (last?.time ?? 0);
        if (gap > WATCHDOG_GAP_MS) {
          console.warn(
            '[GlobalDriverTracking] watchdog: gap de ' + Math.round(gap / 1000) +
            's sin puntos GPS con booking activo ' + currentActiveBookingId +
            ' — forzando stop+start del tracking',
          );
          await stopDriverLocationTracking();
          await startDriverLocationTracking(currentActiveBookingId, publicDriverId);
          try {
            await supabase.from('notification_events' as any).insert({
              user_id: publicDriverId,
              event_type: 'tracking_gap',
              booking_id: currentActiveBookingId,
            } as any);
          } catch {
            // tabla no existe todavía o inserción bloqueada por RLS — ignorar
          }
        }
      } catch (e) {
        console.warn('[GlobalDriverTracking] watchdog exception:', e);
      }
    }, WATCHDOG_INTERVAL_MS);

    setupChannel();

    return () => {
      cancelled = true;
      clearInterval(pollInterval);
      clearInterval(watchdogInterval);
      if (channel) supabase.removeChannel(channel);
      stopDriverLocationTracking();
    };
  }, [isDriver, candidatesKey]);
}
