import { useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@/common/store';
import supabase from '@/config/SupabaseConfig';
import { setProfile } from '@/common/reducers/authReducer';

/**
 * Mantiene el tipo de vehículo del conductor sincronizado con la BD.
 *
 * PROBLEMA que resuelve: el dashboard web actualiza `cars.service_type` cuando
 * un admin corrige la categoría. Sin este hook, la app móvil sigue leyendo el
 * caché (features.carType) hasta que el conductor cierra y vuelve a abrir
 * sesión. Bug operacional: cliente pide categoría corregida, conductor no la
 * ve y no puede aceptar servicios.
 *
 * SOLUCIÓN:
 * 1. Al montar el _layout, hace refetch de la fila `cars` del conductor.
 * 2. Se suscribe a UPDATE de `cars` filtrado por driver_id → sincroniza
 *    Redux `auth.profile.service_type` en cuanto llega el cambio en BD.
 *
 * Solo actúa para conductores (user_type === 'driver').
 */
export function useDriverCarSync() {
  const dispatch = useDispatch<AppDispatch>();
  const profile = useSelector((s: RootState) => s.auth.profile);

  const driverId = useMemo(() => {
    const candidates = [(profile as any)?.id, (profile as any)?.auth_id]
      .map((v) => (v ? String(v) : ''))
      .filter(Boolean);
    return candidates[0] || null;
  }, [(profile as any)?.id, (profile as any)?.auth_id]);

  const userType = (profile as any)?.user_type;
  const isDriver = userType === 'driver';

  const syncedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isDriver || !driverId) {
      syncedKeyRef.current = null;
      return;
    }
    const key = `${driverId}`;
    if (syncedKeyRef.current === key) return;
    syncedKeyRef.current = key;

    // Refetch inicial: siempre traer fresco de BD al arrancar.
    const refetch = async () => {
      try {
        const { data, error } = await supabase
          .from('cars')
          .select('service_type, features, plate, make, model, color, is_active')
          .eq('driver_id', driverId)
          .eq('is_active', true)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!error && data) {
          const svc = (data as any)?.service_type || (data as any)?.features?.carType || null;
          if (svc) {
            dispatch(
              setProfile({
                ...(profile as any),
                service_type: svc,
                active_car: data,
              }),
            );
          }
        }
      } catch (e) {
        console.warn('[useDriverCarSync] refetch error:', (e as any)?.message);
      }
    };

    refetch();

    // Realtime: cuando el admin web hace UPDATE en cars del conductor,
    // sincroniza sin esperar reinicio de la app.
    const carsChannel = supabase
      .channel(`driver-car-${driverId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cars',
          filter: `driver_id=eq.${driverId}`,
        },
        (payload) => {
          const row: any = payload?.new || {};
          const svc = row?.service_type || row?.features?.carType || null;
          if (svc) {
            dispatch(
              setProfile({
                ...(profile as any),
                service_type: svc,
                active_car: row,
              }),
            );
            console.log('[useDriverCarSync] service_type sincronizado:', svc);
          }
        },
      )
      .subscribe();

    return () => {
      if (carsChannel) supabase.removeChannel(carsChannel);
    };
  }, [isDriver, driverId, dispatch]);
}
