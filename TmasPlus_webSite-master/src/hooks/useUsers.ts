import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabaseClient';

export type UserType = 'customer' | 'admin' | 'driver' | 'all';

export interface User {
  id: string;
  auth_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  mobile: string;
  user_type: 'customer' | 'admin' | 'driver';
  wallet_balance: number;
  location: any | null;
  profile_image: string | null;
  rating: number;
  total_rides: number;
  is_verified: boolean;
  approved: boolean;
  blocked: boolean;
  referral_id: string | null;
  city: string | null;
  driver_active_status: boolean;
  license_number: string | null;
  license_image: string | null;
  license_image_back: string | null;
  soat_image: string | null;
  card_prop_image: string | null;
  card_prop_image_bk: string | null;
  verify_id_image: string | null;
  verify_id_image_bk: string | null;
  push_token: string | null;
  user_platform: string | null;
  created_at: string;
  updated_at: string;
}

export const useUsers = (userType: UserType = 'all') => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, [userType]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase.from('users').select('*');

      // Filtrar por tipo de usuario si no es "all"
      if (userType !== 'all') {
        query = query.eq('user_type', userType);
      }

      // Ordenar por fecha de creación (más recientes primero)
      query = query.order('created_at', { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        setError(fetchError.message);
        console.error('Error fetching users:', fetchError);
        return;
      }

      setUsers(data || []);
    } catch (err: any) {
      setError(err.message || 'Error desconocido');
      console.error('Exception fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshUsers = () => {
    fetchUsers();
  };

  return { users, loading, error, refreshUsers };
};
