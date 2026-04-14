import { useState, useCallback } from 'react';
import Constants from 'expo-constants';
import { supabase, clearStoredSession } from '@/config/SupabaseConfig';
import { normalizeEmail } from '@/common/utils/validators';

interface LoginPayload {
  email: string;
  password: string;
}

interface SignupPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  usertype?: string;
}

export const useAuth = () => {
  const [error, setError] = useState('');

  const login = useCallback(async (payload: LoginPayload) => {
    try {
      setError('');
      
      if (!payload.email || !payload.password) {
        throw new Error('Email y contraseña son requeridos');
      }

      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: normalizeEmail(payload.email),
        password: payload.password,
      });

      if (authError) {
        const message = authError.message.includes('Email not confirmed') || authError.message.toLowerCase().includes('confirm')
          ? 'Debes confirmar tu cuenta desde el correo antes de iniciar sesión.'
          : authError.message.includes('Invalid login credentials')
          ? 'Correo o contraseña incorrectos'
          : authError.message || 'Error al iniciar sesión';
        setError(message);
        throw new Error(message);
      }

      if (!data.user) {
        throw new Error('No se pudo iniciar sesión');
      }

      const emailConfirmed = Boolean(data.user.email_confirmed_at);
      if (!emailConfirmed) {
        const message = 'Debes confirmar tu cuenta desde el correo antes de iniciar sesión.';
        setError(message);
        await clearStoredSession();
        throw new Error(message);
      }

      if (!data.session) {
        const message = 'Debes confirmar tu cuenta desde el correo antes de iniciar sesión.';
        setError(message);
        throw new Error(message);
      }

      return data.user;
    } catch (err: any) {
      const message = err.message || 'Error al iniciar sesión';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const signup = useCallback(async (payload: SignupPayload) => {
    try {
      setError('');
      
      if (!payload.email || !payload.password || !payload.firstName) {
        throw new Error('Faltan campos requeridos');
      }

      const sanitizedEmail = normalizeEmail(payload.email);
      
      // Registrar en Supabase Auth
      const expoConfig = Constants.expoConfig as any;
      const manifest = Constants.manifest as any;
      const extra = expoConfig?.extra || manifest?.extra || {};
      const defaultRedirect = __DEV__
        ? 'http://localhost:5173/register-driver'
        : 'https://dashboard.tmasplus.com/register-driver';
      const emailRedirectTo =
        extra?.SUPABASE_EMAIL_REDIRECT_TO ||
        (process.env?.SUPABASE_EMAIL_REDIRECT_TO as string | undefined) ||
        defaultRedirect;

      console.log('[useAuth.signUp] emailRedirectTo:', emailRedirectTo);
      const { data, error: authError } = await supabase.auth.signUp({
        email: sanitizedEmail,
        password: payload.password,
        options: {
          emailRedirectTo,
          data: {
            first_name: payload.firstName,
            last_name: payload.lastName,
            phone: payload.phone,
            user_type: payload.usertype || 'customer',
          },
        },
      });

      if (authError) {
        console.error('[useAuth.signUp] authError', authError);
        throw authError;
      }
      if (!data.user) throw new Error('No se pudo registrar el usuario');

      const emailConfirmed = Boolean(data.user.email_confirmed_at);
      const confirmationRequired = !emailConfirmed;

      // Crear registro en tabla users
      const userRecord = {
        auth_id: data.user.id,
        email: sanitizedEmail,
        first_name: payload.firstName,
        last_name: payload.lastName,
        mobile: payload.phone,
        user_type: payload.usertype || 'customer',
        is_active: true,
        updated_at: new Date().toISOString(),
      };

      const usersTable = supabase.from('users' as any) as any;

      const { data: existingUser, error: selectError } = await usersTable
        .select('id')
        .eq('auth_id', data.user.id)
        .limit(1)
        .maybeSingle();

      if (selectError) {
        console.warn('Advertencia al verificar usuario existente en users:', selectError.message);
      }

      if (existingUser) {
        const { error: updateError } = await usersTable
          .update({
            email: userRecord.email,
            first_name: userRecord.first_name,
            last_name: userRecord.last_name,
            mobile: userRecord.mobile,
            user_type: userRecord.user_type,
            is_active: userRecord.is_active,
            updated_at: userRecord.updated_at,
          })
          .eq('auth_id', data.user.id);

        if (updateError) {
          console.warn('Advertencia al actualizar usuario en users:', updateError.message);
        }
      } else {
        const { error: insertError } = await usersTable
          .insert([userRecord]);

        if (insertError) {
          console.warn('Advertencia al insertar en users:', insertError.message);
        }
      }

      if (confirmationRequired) {
        await clearStoredSession();
      }

      return data.user;
    } catch (err: any) {
      const message = err?.message || err?.error_description || 'Error al registrarse';
      console.error('[useAuth.signUp] error', err);
      setError(message);
      throw new Error(message);
    }
  }, []);

  return {
    login,
    signup,
    error,
    setError,
  };
};
