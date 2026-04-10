import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

// ==================== TIPOS UNIFICADOS ====================
// Definición simplificada pero compatible con UserRow
export interface UserProfile {
  id: string;
  auth_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  mobile: string | null;
  user_type: 'customer' | 'driver' | 'company';
  wallet_balance: number;
  location: any;
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

interface AuthError {
  flag: boolean;
  msg: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: AuthError;
  verificationId: string | null;
  // Campos derivados para facilitar acceso
  userType: 'customer' | 'driver' | 'company' | null;
  walletBalance: number;
  isVerified: boolean;
  driverActiveStatus: boolean;
}

// ==================== ESTADO INICIAL ====================
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  profile: null,
  session: null,
  loading: false,
  error: { flag: false, msg: null },
  verificationId: null,
  userType: null,
  walletBalance: 0,
  isVerified: false,
  driverActiveStatus: false,
};

// ==================== SLICE DE AUTENTICACION ====================
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Login exitoso
    loginSuccess: (state, action: PayloadAction<{ user: SupabaseUser; session: Session }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.session = action.payload.session;
      state.loading = false;
      state.error = { flag: false, msg: null };
    },

    // Logout
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.profile = null;
      state.session = null;
      state.userType = null;
      state.walletBalance = 0;
      state.isVerified = false;
      state.driverActiveStatus = false;
      state.loading = false;
      state.error = { flag: false, msg: null };
      state.verificationId = null;
    },

    // Establecer perfil - CON CAST SEGURO
    setProfile: (state, action: PayloadAction<UserProfile>) => {
      state.profile = action.payload;
      // Cast seguro para evitar problemas de tipos profundos
      const userType = String(action.payload.user_type) as 'customer' | 'driver' | 'company';
      state.userType = userType;
      state.walletBalance = Number(action.payload.wallet_balance) || 0;
      state.isVerified = Boolean(action.payload.is_verified);
      state.driverActiveStatus = Boolean(action.payload.driver_active_status);
    },

    // Establecer estado de carga
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    // Establecer error
    setError: (state, action: PayloadAction<{ flag: boolean; msg: string | null }>) => {
      state.error = action.payload;
      state.loading = false;
    },

    // Limpiar error
    clearError: (state) => {
      state.error = { flag: false, msg: null };
    },

    // Actualizar wallet balance
    updateWalletBalance: (state, action: PayloadAction<number>) => {
      const newBalance = Number(action.payload) || 0;
      state.walletBalance = newBalance;
      if (state.profile) {
        state.profile.wallet_balance = newBalance;
      }
    },

    // Actualizar estado de conductor
    updateDriverStatus: (state, action: PayloadAction<boolean>) => {
      const newStatus = Boolean(action.payload);
      state.driverActiveStatus = newStatus;
      if (state.profile) {
        state.profile.driver_active_status = newStatus;
      }
    },

    // Establecer verification ID
    setVerificationId: (state, action: PayloadAction<string | null>) => {
      state.verificationId = action.payload;
    },

    // Actualizar datos del perfil
    updateProfile: (state, action: PayloadAction<Partial<UserProfile>>) => {
      if (state.profile) {
        state.profile = { ...state.profile, ...action.payload };
        
        // Actualizar campos derivados si cambiaron
        if (action.payload.user_type) {
          state.userType = String(action.payload.user_type) as 'customer' | 'driver' | 'company';
        }
        if (action.payload.wallet_balance !== undefined) {
          state.walletBalance = Number(action.payload.wallet_balance) || 0;
        }
        if (action.payload.is_verified !== undefined) {
          state.isVerified = Boolean(action.payload.is_verified);
        }
        if (action.payload.driver_active_status !== undefined) {
          state.driverActiveStatus = Boolean(action.payload.driver_active_status);
        }
      }
    },

    // Establecer sesión
    setSession: (state, action: PayloadAction<Session | null>) => {
      state.session = action.payload;
      if (action.payload) {
        state.isAuthenticated = true;
        state.user = action.payload.user;
      }
    }
  }
});

// ==================== EXPORTAR ACCIONES ====================
export const {
  loginSuccess,
  logout,
  setProfile,
  setLoading,
  setError,
  clearError,
  updateWalletBalance,
  updateDriverStatus,
  setVerificationId,
  updateProfile,
  setSession
} = authSlice.actions;

// ==================== SELECTORES ====================
export const authSelectors = {
  selectIsAuthenticated: (state: { auth: AuthState }) => state.auth.isAuthenticated,
  selectUser: (state: { auth: AuthState }) => state.auth.user,
  selectProfile: (state: { auth: AuthState }) => state.auth.profile,
  selectSession: (state: { auth: AuthState }) => state.auth.session,
  selectLoading: (state: { auth: AuthState }) => state.auth.loading,
  selectError: (state: { auth: AuthState }) => state.auth.error,
  selectUserType: (state: { auth: AuthState }) => state.auth.userType,
  selectWalletBalance: (state: { auth: AuthState }) => state.auth.walletBalance,
  selectIsVerified: (state: { auth: AuthState }) => state.auth.isVerified,
  selectDriverActiveStatus: (state: { auth: AuthState }) => state.auth.driverActiveStatus,
  selectVerificationId: (state: { auth: AuthState }) => state.auth.verificationId
};

// ==================== EXPORTAR REDUCER Y TIPOS ====================
export default authSlice.reducer;
export type { AuthState, AuthError };
