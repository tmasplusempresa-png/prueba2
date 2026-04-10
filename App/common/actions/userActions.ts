import { Dispatch } from "redux";
import { setProfile } from './../reducers/authReducer';
import { UserType } from './../store/types';
import { UserProfile } from './../store/authSlice';
import supabase from '@/config/SupabaseConfig';

const profileFetchInFlight = new Set<string>();
const lastProfileFetchAt = new Map<string, number>();
const PROFILE_FETCH_DEDUP_MS = 1500;

interface SupabaseUserData {
  id: string;
  auth_id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  mobile?: string;
  user_type: UserType;
  car_type?: string;
  car_image?: string;
  vehicle_number?: string;
  vehicle_make?: string;
  company_name?: string;
  profile_image?: string;
  rating?: number;
  total_trips?: number;
  total_earnings?: number;
  total_rides?: number;
  is_active?: boolean;
  wallet_balance?: number;
  location?: any;
  is_verified?: boolean;
  approved?: boolean;
  blocked?: boolean;
  referral_id?: string;
  city?: string;
  driver_active_status?: boolean;
  license_number?: string;
  license_image?: string;
  license_image_back?: string;
  soat_image?: string;
  card_prop_image?: string;
  card_prop_image_bk?: string;
  verify_id_image?: string;
  verify_id_image_bk?: string;
  push_token?: string;
  user_platform?: string;
  verified?: boolean;
  created_at?: string;
  updated_at?: string;
}

const createUserProfile = (userData: SupabaseUserData): UserProfile => {
  return {
    id: userData.id,
    auth_id: userData.auth_id,
    email: userData.email,
    first_name: userData.first_name || '',
    last_name: userData.last_name || '',
    mobile: userData.mobile || null,
    user_type: userData.user_type,
    wallet_balance: userData.wallet_balance || 0,
    location: userData.location || null,
    profile_image: userData.profile_image || null,
    rating: userData.rating || 0,
    total_rides: userData.total_trips || userData.total_rides || 0,
    is_verified: userData.is_verified || false,
    approved: userData.approved || false,
    blocked: userData.blocked || false,
    referral_id: userData.referral_id || null,
    city: userData.city || null,
    driver_active_status: userData.driver_active_status || false,
    license_number: userData.license_number || null,
    license_image: userData.license_image || null,
    license_image_back: userData.license_image_back || null,
    soat_image: userData.soat_image || null,
    card_prop_image: userData.card_prop_image || null,
    card_prop_image_bk: userData.card_prop_image_bk || null,
    verify_id_image: userData.verify_id_image || null,
    verify_id_image_bk: userData.verify_id_image_bk || null,
    push_token: userData.push_token || null,
    user_platform: userData.user_platform || null,
    created_at: userData.created_at || new Date().toISOString(),
    updated_at: userData.updated_at || new Date().toISOString(),
  };
};

/**
 * Actualiza el perfil del usuario en Supabase y Redux
 * @param userId - ID del usuario en la tabla users
 * @param profileData - Datos a actualizar (campos personales)
 * @param dispatch - Dispatch de Redux
 * @param imageUri - (opcional) URI de imagen para subir
 * @returns Resultado de la operación
 */
export const updateUserProfileSupabase = async (
  userId: string,
  profileData: Record<string, any>,
  dispatch: Dispatch,
  imageUri?: string
) => {
  try {
    console.log('[UserActions] === INICIO UPDATE ===');
    console.log('[UserActions] userId:', userId);
    console.log('[UserActions] profileData:', JSON.stringify(profileData));

    if (!userId) {
      console.error('[UserActions] ERROR: userId es null/undefined');
      return { success: false, error: 'No se encontró el ID del usuario' };
    }

    let imageUrl = profileData.profile_image || null;
    if (imageUri) {
      imageUrl = imageUri;
    }

    const dataToUpdate = { ...profileData, updated_at: new Date().toISOString() };
    if (imageUrl) dataToUpdate.profile_image = imageUrl;

    const updatedFields = Object.keys(dataToUpdate).filter(k => k !== 'updated_at');
    console.log('[UserActions] Campos a actualizar:', updatedFields.join(', '));
    console.log('[UserActions] Data completa para Supabase:', JSON.stringify(dataToUpdate));

    // Actualizar datos en Supabase - intenta por id, si falla intenta por auth_id
    let response = await supabase
      .from('users')
      .update(dataToUpdate)
      .eq('id', userId)
      .select('*')
      .single();

    // Si no encontró por id, intentar por auth_id
    if (response.error || !response.data) {
      console.log('[UserActions] No encontró por id, intentando por auth_id...');
      response = await supabase
        .from('users')
        .update(dataToUpdate)
        .eq('auth_id', userId)
        .select('*')
        .single();
    }

    const { data, error, status, statusText } = response;

    console.log('[UserActions] Respuesta Supabase - status:', status, 'statusText:', statusText);
    console.log('[UserActions] Respuesta data:', data ? 'OK (datos recibidos)' : 'NULL');
    console.log('[UserActions] Respuesta error:', error ? JSON.stringify(error) : 'ninguno');

    if (error) {
      console.error('[UserActions] Error actualizando perfil en Supabase:', error.message);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.warn('[UserActions] No se encontró el registro. Posible problema de RLS o ID incorrecto.');
      return { success: false, error: 'No se encontró el usuario en la base de datos. Verifica permisos (RLS).' };
    }

    console.log('[UserActions] Perfil actualizado correctamente. Campos:', updatedFields.join(', '));

    // Actualizar Redux
    const userProfile = createUserProfile(data as SupabaseUserData);
    dispatch(setProfile(userProfile));

    console.log('[UserActions] === FIN UPDATE (éxito) ===');
    return { success: true, data, updatedFields };
  } catch (err: any) {
    console.error('[UserActions] Error inesperado actualizando perfil:', err);
    return { success: false, error: err?.message || 'Error desconocido' };
  }
};

/**
 * Obtiene el perfil del usuario desde Supabase y lo guarda en Redux
 */
export const fetchUserProfile = async (
  authId: string,
  dispatch: Dispatch
): Promise<{ success: boolean; profile?: UserProfile; error?: string }> => {
  if (profileFetchInFlight.has(authId)) {
    console.log('[UserActions] fetchUserProfile: ya hay un fetch en vuelo, saltando');
    return { success: false, error: 'Fetch already in flight' };
  }
  const lastFetch = lastProfileFetchAt.get(authId) || 0;
  if (Date.now() - lastFetch < PROFILE_FETCH_DEDUP_MS) {
    console.log('[UserActions] fetchUserProfile: demasiado pronto para re-fetch');
    return { success: false, error: 'Too soon to re-fetch' };
  }

  profileFetchInFlight.add(authId);
  lastProfileFetchAt.set(authId, Date.now());

  try {
    console.log('[UserActions] Fetching profile for auth_id:', authId);

    // Intentar primero con auth_id
    let { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authId)
      .maybeSingle();

    console.log('[UserActions] Query auth_id result - data:', data ? 'OK' : 'NULL', 'error:', error?.message || 'none');

    // Si no encuentra por auth_id, intentar por id
    if (!data && !error) {
      console.log('[UserActions] No data por auth_id, intentando por id...');
      const res2 = await supabase
        .from('users')
        .select('*')
        .eq('id', authId)
        .maybeSingle();
      data = res2.data;
      error = res2.error;
      console.log('[UserActions] Query id result - data:', data ? 'OK' : 'NULL', 'error:', error?.message || 'none');
    }

    if (error) {
      console.error('[UserActions] Error fetching profile:', error.message);
      return { success: false, error: error.message };
    }

    if (!data) {
      console.warn('[UserActions] No profile found for:', authId);
      return { success: false, error: 'Profile not found' };
    }

    const userProfile = createUserProfile(data as SupabaseUserData);
    dispatch(setProfile(userProfile));
    console.log('[UserActions] Profile loaded:', userProfile.first_name, userProfile.last_name, '| city:', userProfile.city);
    return { success: true, profile: userProfile };
  } catch (err: any) {
    console.error('[UserActions] fetchUserProfile exception:', err?.message || err);
    return { success: false, error: err?.message || 'Error desconocido' };
  } finally {
    profileFetchInFlight.delete(authId);
  }
};
