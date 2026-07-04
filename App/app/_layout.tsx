import { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import Navigation from './Navigation/Navigation';
import { Provider } from 'react-redux';
import store from '@/common/store';
import supabase, { Auth, clearStoredSession, isPasswordRecoveryInProgress } from '@/config/SupabaseConfig';
import { login, logout, setProfile } from '@/common/reducers/authReducer';
// Define la background location task antes de que el OS pueda despacharla.
import '@/common/services/driverLocationTask';
import { useGlobalDriverTracking } from '@/hooks/useGlobalDriverTracking';
import { useWalletAndMembershipSync } from '@/hooks/useWalletAndMembershipSync';
import CancellationNotifier from '@/components/CancellationNotifier';
import DriverLocationDisclosureGate from '@/components/DriverLocationDisclosureGate';

// Desactivar el escalado de fuente del sistema — la app usa su propio tamaño fijo
if ((Text as any).defaultProps == null) (Text as any).defaultProps = {};
(Text as any).defaultProps.allowFontScaling = false;
(Text as any).defaultProps.maxFontSizeMultiplier = 1;

if ((TextInput as any).defaultProps == null) (TextInput as any).defaultProps = {};
(TextInput as any).defaultProps.allowFontScaling = false;
(TextInput as any).defaultProps.maxFontSizeMultiplier = 1;

/**
 * Layout raíz requerido por Expo Router.
 * Debe renderizar <Slot /> en el primer render para que el router monte
 * antes de que las rutas hijas (p. ej. index.tsx) intenten navegar.
 */
export default function RootLayout() {
  useEffect(() => {
    (async () => {
      try {
        // Use dynamic import/require to avoid bundler errors when package is absent
        let AuthSession: any = null;
        try {
          // prefer dynamic import
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          AuthSession = require('expo-auth-session');
        } catch (e) {
          try {
            AuthSession = (await import('expo-auth-session'));
          } catch (ie) {
            console.warn('expo-auth-session not available');
          }
        }

        if (!AuthSession) return;

        const proxyUri = AuthSession.makeRedirectUri({ useProxy: true });
        const directUri = AuthSession.makeRedirectUri({ useProxy: false });
        console.log('Redirect URI (proxy):', proxyUri);
        console.log('Redirect URI (direct):', directUri);
        console.log('App scheme from manifest:', Constants.expoConfig?.scheme || Constants.manifest?.scheme);
      } catch (e) {
        console.warn('Error generating redirect URIs:', e);
      }
    })();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfile = async (authUid: string) => {
      try {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authUid)
          .single();
        // Si el administrador bloqueó la cuenta, cerrar la sesión restaurada.
        if (data && (data as any).blocked) {
          await supabase.auth.signOut();
          await clearStoredSession();
          if (isMounted) store.dispatch(logout());
          return;
        }
        if (data) store.dispatch(setProfile(data as any));
      } catch {}
    };

    const syncInitialSession = async () => {
      try {
        const session = await Auth.getCurrentSession();

        if (!isMounted) return;

        if (session?.user) {
          store.dispatch(login(session.user));
          // Carga el perfil para que profile.id (users.id) esté disponible
          // en toda la app — necesario para filtrar bookings correctamente.
          await loadProfile(session.user.id);
        } else {
          store.dispatch(logout());
        }
      } catch (e) {
        console.warn('Error syncing initial auth session:', e);
        await clearStoredSession();
        if (isMounted) {
          store.dispatch(logout());
        }
      }
    };

    syncInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      // Durante el restablecimiento por deep link no tocamos el estado global de
      // auth: la sesión es temporal y solo sirve para que ResetPassword pueda
      // llamar a updateUser. Así el navegador no conmuta de stack ni desmonta
      // la pantalla. (PASSWORD_RECOVERY también lo ignoramos por seguridad.)
      if (event === 'PASSWORD_RECOVERY' || isPasswordRecoveryInProgress()) return;
      if (session?.user) {
        store.dispatch(login(session.user));
        loadProfile(session.user.id);
      } else {
        store.dispatch(logout());
      }
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <GlobalServices />
        <Navigation />
        <CancellationNotifier />
        <DriverLocationDisclosureGate />
      </Provider>
    </GestureHandlerRootView>
  );
}

function GlobalServices() {
  useGlobalDriverTracking();
  useWalletAndMembershipSync();
  return null;
}
