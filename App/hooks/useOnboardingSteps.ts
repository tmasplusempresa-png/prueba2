import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import type { RootState } from '@/common/store/store';
import {
  SUPABASE_URL,
  getSafeSession,
  getSupabaseAuthHeaders,
  hasUserAuthHeader,
} from '@/config/SupabaseConfig';
import {
  ONBOARDING_USER_COLUMNS,
  buildOnboardingSteps,
  mergeProfiles,
  type OnboardingProfile,
  type OnboardingStep,
} from '@/common/utils/onboardingSteps';
import { setOnboardingSnapshot } from '@/common/services/onboardingGate';

// Solo el perfil (fila de users) es fiable: al arrancar, `user` trae un tipo por
// defecto ('customer') que luego cambia a 'driver'; usarlo abría el modal del
// cliente a un conductor y saltaba el enfriamiento.
function pickUserType(profile: any): string {
  return String(profile?.user_type || '').trim().toLowerCase();
}

export type OnboardingState = {
  userType: string;
  steps: OnboardingStep[];
  pending: number;
  total: number;
  loading: boolean;
  refresh: () => Promise<void>;
};

/**
 * Pasos de registro pendientes según el tipo de usuario. Lee `users` (y `cars`
 * para el vehículo, la misma vista que usa CarsEditScreen) con el token del
 * usuario; si la consulta falla, cae al perfil de Redux y no marca pendiente
 * el vehículo. Refresca al enfocar la pantalla y al volver a primer plano.
 */
export function useOnboardingSteps(): OnboardingState {
  const user = useSelector((s: RootState) => (s as any).auth?.user as any);
  const profile = useSelector((s: RootState) => (s as any).auth?.profile as any);

  const userType = pickUserType(profile);
  const lookupId = String(profile?.id || user?.id || user?.auth_id || '');

  const [remote, setRemote] = useState<OnboardingProfile | null>(null);
  const [vehicleCount, setVehicleCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const reqSeq = useRef(0);

  const refresh = useCallback(async () => {
    if ((userType !== 'driver' && userType !== 'customer') || !lookupId) {
      setLoading(false);
      return;
    }
    const seq = ++reqSeq.current;
    try {
      const session = await getSafeSession();
      if (!session?.access_token) return;
      const headers = await getSupabaseAuthHeaders();
      if (!hasUserAuthHeader(headers)) return;

      const cols = ONBOARDING_USER_COLUMNS.join(',');
      const id = encodeURIComponent(lookupId);
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/users?or=(id.eq.${id},auth_id.eq.${id})&select=${cols}&limit=1`,
        { headers },
      );
      if (!r.ok) return;
      const rows = await r.json();
      const row = Array.isArray(rows) ? rows[0] : null;
      if (seq !== reqSeq.current) return;
      if (row) setRemote(row);

      if (userType === 'driver' && row?.id) {
        const c = await fetch(
          `${SUPABASE_URL}/rest/v1/cars?driver_id=eq.${encodeURIComponent(String(row.id))}&select=id&limit=1`,
          { headers },
        );
        if (c.ok && seq === reqSeq.current) {
          const cars = await c.json();
          setVehicleCount(Array.isArray(cars) ? cars.length : null);
        }
      }
    } catch (e) {
      console.warn('[useOnboardingSteps] refresh falló:', e);
    } finally {
      if (seq === reqSeq.current) setLoading(false);
    }
  }, [userType, lookupId]);

  // Al enfocar la pantalla (incluye volver de ImageGallery / Docs / CarsEdit).
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  // Al volver la app a primer plano.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const steps = useMemo(
    () => buildOnboardingSteps(userType, mergeProfiles(remote, profile), vehicleCount),
    [userType, remote, profile, vehicleCount],
  );
  const pending = steps.filter((s) => !s.done).length;

  useEffect(() => {
    setOnboardingSnapshot({ userType, pending, loaded: !loading });
  }, [userType, pending, loading]);

  return { userType, steps, pending, total: steps.length, loading, refresh };
}
