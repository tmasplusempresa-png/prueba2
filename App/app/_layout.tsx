import { useEffect } from 'react';
import { Text, TextInput } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Constants from 'expo-constants';
import Navigation from './Navigation/Navigation';
import { Provider } from 'react-redux';
import store from '@/common/store';
import supabase from '@/config/SupabaseConfig';
import { login, logout } from '@/common/reducers/authReducer';

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

    const syncInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          store.dispatch(login(session.user));
        } else {
          store.dispatch(logout());
        }
      } catch (e) {
        console.warn('Error syncing initial auth session:', e);
        if (isMounted) {
          store.dispatch(logout());
        }
      }
    };

    syncInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return;
      if (session?.user) {
        store.dispatch(login(session.user));
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
        <Navigation />
      </Provider>
    </GestureHandlerRootView>
  );
}
