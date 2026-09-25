import { useEffect } from 'react';
import { Text, TextInput, LogBox } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import Navigation from './Navigation/Navigation';
import { Provider } from 'react-redux';
import store from '@/common/store';
import supabase, { Auth, clearStoredSession, getSafeSession, isPasswordRecoveryInProgress } from '@/config/SupabaseConfig';
import { login, logout, setProfile } from '@/common/reducers/authReducer';
// Define la background location task antes de que el OS pueda despacharla.
import '@/common/services/driverLocationTask';
import { useGlobalDriverTracking } from '@/hooks/useGlobalDriverTracking';
import { useWalletAndMembershipSync } from '@/hooks/useWalletAndMembershipSync';
import { useDriverCarSync } from '@/hooks/useDriverCarSync';
import CancellationNotifier from '@/components/CancellationNotifier';
import DriverLocationDisclosureGate from '@/components/DriverLocationDisclosureGate';
import { setupNotificationHandler } from '@/hooks/NotificationService';
import { stopNewServiceLoop } from '@/hooks/DriverNotificationService';
import { usePushTokenRegistration } from '@/hooks/usePushTokenRegistration';

// El SDK de Supabase, al arrancar, intenta refrescar la sesión guardada. Si el
// refresh token fue revocado en el servidor (p. ej. tras un reset de contraseña,
// signOut en otro dispositivo o rotación del token), responde "Refresh Token Not
// Found" y GoTrueClient hace console.error(error) por su cuenta, mostrando una
// pantalla roja de LogBox en dev. Es benigno y se autocorrige: el SDK borra la
// sesión y emite SIGNED_OUT (ver setupAuthListeners en SupabaseConfig), que
// limpia el storage. Silenciamos solo ese error concreto para no asustar en dev.
LogBox.ignoreLogs([
  /Invalid Refresh Token/,
  /Refresh Token Not Found/,
  /AuthApiError/,
  /linking in multiple places/,
  /deep links should only be handled/,
]);

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
  // Configura el handler global de notificaciones antes que cualquier otro
  // efecto. Sin esto, las push en foreground NO aparecen en el centro de
  // notificaciones (Android) ni como banner (iOS) — la app las recibe pero
  // el usuario no ve nada. Ver hooks/NotificationService.tsx.
  //
  // También registra un listener global que, ante push type='booking-taken',
  // cancela el loop de sonido de la reserva mencionada (otro conductor la
  // tomó mientras esta app estaba en background).
  useEffect(() => {
    setupNotificationHandler().catch((e) =>
      console.warn('[RootLayout] setupNotificationHandler falló:', e),
    );

    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        // Listener global de foreground: si llega booking-taken, silencia loop.
        const sub = Notifications.addNotificationReceivedListener((notif) => {
          const data = (notif?.request?.content?.data ?? {}) as any;
          if (data?.type === 'booking-taken' && data?.bookingId) {
            stopNewServiceLoop(String(data.bookingId)).catch(() => {
              // ignore
            });
          }
        });
        cleanup = () => sub.remove();
      } catch {
        // expo-notifications no disponible (Expo Go / dev sin native module)
      }
    })();

    return () => {
      if (cleanup) cleanup();
    };
  }, []);

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
    let lastProfileAuthId: string | null = null;

    const loadProfile = async (authUid: string) => {
      try {
        // Sin JWT = rol anon → vista users toca persona sin GRANT → spam 42501.
        // No otorgamos SELECT a anon; simplemente no consultamos deslogueados.
        const session = await getSafeSession();
        if (!session?.access_token) {
          console.warn('[loadProfile] omitido: sin JWT (evita permission denied en persona)');
          return;
        }
        if (lastProfileAuthId === authUid) {
          return; // Evita tormenta en TOKEN_REFRESHED / listeners duplicados
        }
        lastProfileAuthId = authUid;

        // Preferir RPC (SECURITY DEFINER) si existe
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('get_perfil_movil' as any);
          if (!rpcError && rpcData) {
            const profile = rpcData as any;
            if (profile.blocked === true) {
              console.warn('[loadProfile] cuenta bloqueada (rpc) — cerrando sesión');
              await clearStoredSession('blocked-account');
              if (isMounted) store.dispatch(logout());
              return;
            }
            if (isMounted) store.dispatch(setProfile(profile));
            return;
          }
        } catch {
          // fallback a vista users
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', authUid)
          .maybeSingle();
        if (error) {
          console.warn('[loadProfile] error:', error.message);
          return;
        }
        if (data && (data as any).blocked === true) {
          console.warn('[loadProfile] cuenta bloqueada — cerrando sesión');
          await clearStoredSession('blocked-account');
          if (isMounted) store.dispatch(logout());
          return;
        }
        if (data && isMounted) store.dispatch(setProfile(data as any));
      } catch (e) {
        console.warn('[loadProfile] exception:', (e as any)?.message);
      }
    };

    const syncInitialSession = async () => {
      try {
        const session = await Auth.getCurrentSession();

        if (!isMounted) return;

        if (session?.user) {
          store.dispatch(login(session.user));
          await loadProfile(session.user.id);
        }
      } catch (e) {
        console.warn('Error syncing initial auth session:', e);
      }
    };

    syncInitialSession();

    let _lastRefreshLogAt = 0;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (process.env.NODE_ENV === 'development') {
        if (event === 'TOKEN_REFRESHED') {
          const now = Date.now();
          if (now - _lastRefreshLogAt >= 60_000) {
            _lastRefreshLogAt = now;
            console.log('[auth:_layout]', event, session?.user?.id || 'No user');
          }
        } else {
          console.log('[auth:_layout]', event, session?.user?.id || 'No user');
        }
      }
      // Durante el restablecimiento por deep link no tocamos el estado global de
      // auth: la sesión es temporal y solo sirve para que ResetPassword pueda
      // llamar a updateUser. Así el navegador no conmuta de stack ni desmonta
      // la pantalla. (PASSWORD_RECOVERY también lo ignoramos por seguridad.)
      if (event === 'PASSWORD_RECOVERY' || isPasswordRecoveryInProgress()) return;

      // TOKEN_REFRESHED: NO dispatch(login). Cada login pisa el user mergeado
      // (persona.id) y re-dispara efectos → getSession storm → rotación de
      // refresh_token → SIGNED_OUT.
      if (event === 'TOKEN_REFRESHED') return;

      if (event === 'SIGNED_OUT' || !session?.user) {
        lastProfileAuthId = null;
        store.dispatch(logout());
        return;
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') {
        store.dispatch(login(session.user));
      }

      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        const uid = session.user.id;
        setTimeout(() => {
          if (isMounted) loadProfile(uid);
        }, 0);
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
  useDriverCarSync();
  usePushTokenRegistration();
  return null;
}
