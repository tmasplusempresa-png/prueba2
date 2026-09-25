import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/common/store';
import supabase from '@/config/SupabaseConfig';
import { setProfile } from '@/common/reducers/authReducer';
import { fetchMemberships } from '@/common/reducers/membershipSlice';
import { preferredConductorId } from '@/common/utils/driverIds';

/**
 * Mantiene billetera (users.wallet_balance) y membresías sincronizadas en
 * tiempo real durante toda la sesión. Se monta en _layout y reacciona al
 * cambio de auth.user para suscribirse / limpiar canales.
 *
 * - users (UPDATE filtrado por auth_id) → dispatch setProfile
 * - memberships (* filtrado por conductor = persona.id) → fetchMemberships
 */
export function useWalletAndMembershipSync() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const profile = useSelector((s: RootState) => s.auth.profile);

  const authId =
    (profile as any)?.auth_id ||
    (user as any)?.auth_id ||
    ((user as any)?.id && !(profile as any)?.id ? (user as any).id : null) ||
    null;

  const driverConductorId = useMemo(
    () => preferredConductorId(user, profile),
    [profile, user],
  );

  const syncedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authId && !driverConductorId) {
      syncedKeyRef.current = null;
      return;
    }
    const key = `${authId || ''}|${driverConductorId || ''}`;
    if (syncedKeyRef.current === key) return;
    syncedKeyRef.current = key;

    if (driverConductorId) {
      dispatch(fetchMemberships(driverConductorId));
    }

    const membershipsChannel = driverConductorId
      ? supabase
          .channel(`global-memberships-${driverConductorId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'memberships',
              filter: `conductor=eq.${driverConductorId}`,
            },
            () => {
              dispatch(fetchMemberships(driverConductorId));
            },
          )
          .subscribe()
      : null;

    const usersChannel = authId
      ? supabase
          .channel(`global-users-${authId}`)
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'users',
              filter: `auth_id=eq.${authId}`,
            },
            (payload) => {
              const next = (payload as any)?.new;
              if (next) dispatch(setProfile(next));
            },
          )
          .subscribe()
      : null;

    return () => {
      if (membershipsChannel) supabase.removeChannel(membershipsChannel);
      if (usersChannel) supabase.removeChannel(usersChannel);
    };
  }, [authId, driverConductorId, dispatch]);
}
