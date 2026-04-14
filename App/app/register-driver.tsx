import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform, Linking } from 'react-native';
import { supabase } from '@/config/SupabaseConfig';
import { useRouter } from 'expo-router';

const RegisterDriver = () => {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Procesando confirmación de correo...');

  const parseUrlParams = (url: string) => {
    const params: Record<string, string> = {};

    try {
      const parsed = new URL(url);
      parsed.searchParams.forEach((value, key) => {
        params[key] = value;
      });
    } catch {
      // fallback: ignore invalid URL format
    }

    const hashIndex = url.indexOf('#');
    if (hashIndex !== -1) {
      const fragment = url.substring(hashIndex + 1);
      const searchParams = new URLSearchParams(fragment);
      searchParams.forEach((value, key) => {
        params[key] = value;
      });
    }

    return params;
  };

  const getInitialUrl = async () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      return window.location.href;
    }
    return Linking.getInitialURL();
  };

  useEffect(() => {
    const processConfirmation = async () => {
      try {
        const url = await getInitialUrl();
        const params = url ? parseUrlParams(url) : {};

        if (params.error) {
          const description = params.error_description ? decodeURIComponent(params.error_description) : 'Hubo un error en el enlace de confirmación.';
          setStatus('error');
          setMessage(`Error de confirmación: ${description}`);
          return;
        }

        if (params.access_token && params.refresh_token && typeof supabase.auth.setSession === 'function') {
          const { error } = await supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token });
          if (error) throw error;
          setStatus('success');
          setMessage('Correo confirmado. Ya puedes subir tus documentos.');
          return;
        }

        if (typeof supabase.auth.getSessionFromUrl === 'function') {
          const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
          if (error) throw error;
          if (data?.session) {
            setStatus('success');
            setMessage('Correo confirmado. Ya puedes subir tus documentos.');
            return;
          }
        }

        setStatus('error');
        setMessage('No se pudo procesar la confirmación. Verifica el enlace o intenta reenviar el email.');
      } catch (error: any) {
        setStatus('error');
        setMessage(error?.message || 'Error procesando la confirmación.');
      }
    };

    processConfirmation();
  }, []);

  const handleGoHome = () => {
    if (Platform.OS === 'web') {
      window.location.href = '/';
    } else {
      router.replace('/');
    }
  };

  const handleGoDocuments = () => {
    if (Platform.OS === 'web') {
      window.location.href = '/DocumentsScreen';
    } else {
      router.replace('/DocumentsScreen');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Confirmación de correo</Text>
      <View style={styles.statusBox}>
        {status === 'loading' ? (
          <ActivityIndicator size="large" color="#00f4f5" />
        ) : null}
        <Text style={[styles.message, status === 'error' && styles.errorText]}>{message}</Text>
      </View>

      {status !== 'loading' ? (
        <>
          <TouchableOpacity style={styles.button} onPress={handleGoHome}>
            <Text style={styles.buttonText}>Ir al inicio</Text>
          </TouchableOpacity>
          {status === 'success' ? (
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleGoDocuments}>
              <Text style={styles.secondaryButtonText}>Ir a documentos</Text>
            </TouchableOpacity>
          ) : null}
        </>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#01060a',
  },
  title: {
    color: '#00f4f5',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  statusBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#061623',
    borderRadius: 16,
    width: '100%',
    maxWidth: 420,
  },
  message: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#e91e63',
  },
  button: {
    marginTop: 18,
    backgroundColor: '#00f4f5',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    backgroundColor: '#131f2a',
    borderWidth: 1,
    borderColor: '#00f4f5',
  },
  secondaryButtonText: {
    color: '#00f4f5',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default RegisterDriver;
