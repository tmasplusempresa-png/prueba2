import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '@/common/store';
import { fetchMyCompanies, MyCompany } from '@/common/services/companiesService';

// Última lista por usuario: evita que la card/selector empresarial parpadee al volver a una pantalla.
let cache: { userKey: string; companies: MyCompany[] } | null = null;

/**
 * Empresas vinculadas al cliente logueado. Se refresca cada vez que la pantalla gana foco,
 * así un vínculo creado o desactivado desde la web se refleja sin reiniciar la app.
 */
export function useMyCompanies(): { companies: MyCompany[]; loading: boolean } {
  const user = useSelector((state: RootState) => state.auth.user) as any;
  const userKey = String(user?.id || user?.auth_id || '');
  const cached = cache && cache.userKey === userKey ? cache.companies : null;
  const [companies, setCompanies] = useState<MyCompany[]>(cached || []);
  const [loading, setLoading] = useState(!cached);

  useFocusEffect(
    useCallback(() => {
      if (!userKey) {
        setCompanies([]);
        setLoading(false);
        return;
      }
      const controller = new AbortController();
      fetchMyCompanies(controller.signal)
        .then((list) => {
          if (controller.signal.aborted) return;
          cache = { userKey, companies: list };
          setCompanies(list);
        })
        .catch(() => {})
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return () => controller.abort();
    }, [userKey])
  );

  return { companies, loading };
}
