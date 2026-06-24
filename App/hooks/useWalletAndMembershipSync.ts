import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/common/store';
import supabase from '@/config/SupabaseConfig';
import { setProfile } from '@/common/reducers/authReducer';
import { fetchMemberships } from '@/common/reducers/membershipSlice';

/**
 * Mantiene billetera (users.wallet_balance) y membresías sincronizadas en
 * tiempo real durante toda la sesión. Se monta en _layout y reacciona al
 * cambio de auth.user para suscribirse / limpiar canales.
 *
 * - users (UPDATE filtrado por auth_id) → dispatch setProfile, lo que refresca
 *   user.walletBalance, driver_active_status, etc.
 * - memberships (* filtrado por conductor) → re-dispatch fetchMemberships para
 *   que activeMembership y el bloqueo de handleAccept queden al día sin abrir
 *   la pantalla WalletDetails.
 */
export function useWalletAndMembershipSync() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((s: RootState) => s.auth.user);
  const profile = useSelector((s: RootState) => s.auth.profile);

  const authId = (user as any)?.id || (profile as any)?.auth_id || null;

  const driverConductorId = useMemo(() => {
    const candidates = [
      (profile as any)?.auth_id,
      (user as any)?.auth_id,
      (profile as any)?.id,
      (user as any)?.id,
      (user as any)?.uid,
    ]
      .map((v) => (v ? String(v) : ''))
      .filter(Boolean);
    return candidates[0] || null;
  }, [
    (profile as any)?.auth_id,
    (profile as any)?.id,
    (user as any)?.auth_id,
    (user as any)?.id,
    (user as any)?.uid,
  ]);

  const syncedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!authId) {
      syncedKeyRef.current = null;
      return;
    }
    const key = `${authId}|${driverConductorId || ''}`;
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

    const usersChannel = supabase
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
      .subscribe();

    return () => {
      if (membershipsChannel) supabase.removeChannel(membershipsChannel);
      supabase.removeChannel(usersChannel);
    };
  }, [authId, driverConductorId, dispatch]);
}
