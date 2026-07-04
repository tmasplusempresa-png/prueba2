
import React, { useEffect, useState } from "react";
import { LogBox, Platform, View, Text, Button, StyleSheet, Alert } from "react-native";
import { Provider, useDispatch, } from "react-redux";
import { supabase } from "@/config/SupabaseConfig";
import AppContainer from "@/app/Navigation/Navigation";
import { registerForPushNotificationsAsync } from "@/common/actions/NotificationService";
import store, { AppDispatch, RootState } from "@/common/store";
// Use dynamic import for notifications so we don't trigger auto-registration in Expo Go
import { updatePushToken, updateUserLocation } from "@/common/actions/authactions";
/* import FirebaseConfig from "@/config/SupabaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage"; */
import GetPushToken from "@/components/GetPushToken";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Sentry from "@sentry/react-native";
import Constants from 'expo-constants';
import { login, logout } from "@/common/reducers/authReducer";
import { checkAppVersion } from "@/hooks/UpdateVersionApp";
import { Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  restoreAppState, 
  clearActiveTripId, 
  setDriverModeActive 
} from '@/common/services/AppStateRestoration';
import { 
  cancelActiveTripNotification 
} from '@/common/services/ActiveTripNotificationService';
import { 
  dismissDriverNotification 
} from '@/hooks/DriverNotificationService';
// AsyncStorage/router/auth helper imports removed (no longer needed here)

// TODO: Sentry disabled for build testing - uncomment after successful build
// Inicialización de Sentry
// Sentry.init({
//   dsn: "...",
// });

const LOCATION_TASK_NAME = 'background-location-task';

// We'll set the notification handler dynamically during initialization.

// Handler para mensajes en segundo plano (solo si está disponible el módulo de messaging)
let _messagingModule = null;
try {
  // intentar requerir el módulo @react-native-firebase/messaging si está instalado
  // lo hacemos en tiempo de ejecución para evitar errores cuando no esté disponible
  // eslint-disable-next-line global-require
  const messagingImport = require('@react-native-firebase/messaging');
  _messagingModule = messagingImport && (typeof messagingImport.default === 'function' ? messagingImport.default : messagingImport);
} catch (e) {
  _messagingModule = null;
}

    if (_messagingModule) {
      try {
        _messagingModule().setBackgroundMessageHandler(async (remoteMessage: any) => {
          try {
            const { data } = remoteMessage || {};
            if (data) {
              const body = typeof data.body === 'string' ? (JSON.parse(data.body).message || 'Nueva notificación') : 'Nueva notificación';
              try {
                const Notifications = await import('expo-notifications');
                await Notifications.scheduleNotificationAsync({
                  content: { title: data.title || 'Nueva Notificación', body },
                  trigger: null,
                });
              } catch (nerr) {
                console.warn('Could not schedule notification (expo-notifications not available):', nerr);
              }
            }
          } catch (error) {
            console.error('Error manejando el mensaje en segundo plano:', error);
          }
        });
      } catch (err) {
        console.warn('No se pudo configurar setBackgroundMessageHandler:', err);
      }
    } else {
  // Módulo de mensajería no disponible en este entorno (dev client / Expo Go sin plugin)
  // Esto es esperado si no se instaló react-native-firebase/messaging.
}

// Tarea para la captura de ubicación en segundo plano
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data: { locations }, error }: { data: { locations: any[] }; error: any }) => {
  if (error || !locations?.length) {
    console.error("Error o sin ubicaciones en la tarea de localización:", error);
    return;
  }

  // Check current user via Supabase session
  let user: any = null;
  try {
    const { data: { session } } = await supabase.auth.getSession();
    user = session?.user ?? null;
  } catch (e) {
    user = null;
  }

  if (!user) {
    const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
    if (isTaskRegistered) await TaskManager.unregisterTaskAsync(LOCATION_TASK_NAME);
    return;
  }

  const { latitude = 0, longitude = 0 } = locations[locations.length - 1]?.coords || {};
  //console.log(`Ubicación recibida: latitud=${latitude}, longitud=${longitude}`);

  store.dispatch(updateUserLocation(latitude, longitude));
});
//arreglado
const requestPermissions = async () => {
  try {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      console.warn("Permiso de localización en primer plano no concedido");
      return false;
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn("Permiso de localización en segundo plano no concedido");
      return false;
    }

    //console.log("Permisos concedidos");

    return true;
  } catch (error) {
    console.error("Error al solicitar permisos de localización:", error);
    return false;
  }
};

//solucionado
const startBackgroundLocation = async () => {
  try {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    if (!LOCATION_TASK_NAME) {
      console.error("LOCATION_TASK_NAME no está definido.");
      return;
    }

    try {
      const isTaskRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
      if (!isTaskRegistered) {
       // console.log("Iniciando la captura de ubicación en segundo plano...");
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.High,
          showsBackgroundLocationIndicator: true,
          activityType: Location.ActivityType.AutomotiveNavigation,
          foregroundService: {
            notificationTitle: 'Servicio de Localización Activo',
            notificationBody: 'La aplicación está rastreando tu ubicación en segundo plano.',
          },
        });
      } else {
       // console.log("La tarea de ubicación en segundo plano ya está registrada.");
      }
    } catch (error) {
      console.error('Error al iniciar la captura de ubicación en segundo plano:', error);
    }
  } catch (error) {
    console.error('Error al solicitar permisos de localización:', error);
  }
};

//arreglado

const startForegroundLocationUpdates = async (dispatch: AppDispatch) => {
  // Verificar que dispatch es una función válida
  if (!dispatch || typeof dispatch !== 'function') {
    console.error("El dispatch proporcionado no es una función válida");
    return;
  }

  let subscription: Location.LocationSubscription | null = null;

  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      console.warn("Permiso de ubicación no concedido");
      return;
    }

    // Iniciar la suscripción a las actualizaciones de ubicación
    subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
        distanceInterval: 50,
      },
      (location) => {
        // Validar que location y location.coords existen
        if (location && location.coords) {
          const { latitude, longitude } = location.coords;

          // Verificar que latitude y longitude son números válidos
          if (
            typeof latitude === "number" &&
            typeof longitude === "number" &&
            !isNaN(latitude) &&
            !isNaN(longitude)
          ) {
            try {
              // Asegurarse de que updateUserLocation está definido
              if (typeof updateUserLocation === "function") {
                dispatch(updateUserLocation(latitude, longitude));
              } else {
                console.error("La función updateUserLocation no está definida");
              }
            } catch (error) {
              console.error("Error al actualizar la ubicación del usuario:", error);
            }
          } else {
            console.warn("Datos de ubicación inválidos recibidos");
          }
        } else {
          console.warn("Objeto de ubicación vacío o inválido recibido");
        }
      }
    );
  } catch (error) {
    console.error("Error al iniciar las actualizaciones de ubicación en primer plano:", error);
  }

  // Retornar la función de limpieza para detener las actualizaciones cuando sea necesario
  return () => {
    if (subscription && typeof subscription.remove === "function") {
      subscription.remove();
    } else {
      console.warn("No se pudo eliminar la suscripción porque es nula o inválida");
    }
  };
};




const RootLayout = () => {
  const [authStateChecked, setAuthStateChecked] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState<string | null>(null);
  const dispatch = useDispatch<AppDispatch>();


  // Manejo de deep links para intercambiar tokens de Supabase
  useEffect(() => {
    const parseFragment = (url: string) => {
      const hashIndex = url.indexOf('#');
      if (hashIndex === -1) return {} as Record<string, string>;
      const fragment = url.substring(hashIndex + 1);
      return fragment.split('&').reduce((acc: Record<string, string>, pair) => {
        const [k, v] = pair.split('=');
        if (!k) return acc;
        acc[decodeURIComponent(k)] = decodeURIComponent(v || '');
        return acc;
      }, {} as Record<string, string>);
    };

    const processUrl = async (url?: string | null) => {
      if (!url) return;
      try {
        const params = parseFragment(url);
        if (params.error) {
          console.warn('Supabase auth redirect error:', params);
          // Si es otp_expired, indicar al usuario que reenvíe el enlace
          if (params.error_code === 'otp_expired') {
            // Aquí puedes mostrar un modal/alert en la app haciéndolo más visible
            console.warn('El enlace de confirmación ha expirado. Reenvía el correo.');
          }
          return;
        }

        // Si tenemos tokens en el fragmento, setear la sesión manualmente.
        // Solo lo hacemos cuando tenemos refresh_token para evitar dejar una sesión incompleta.
        if (params.access_token && params.refresh_token) {
          try {
            await supabase.auth.setSession({
              access_token: params.access_token,
              refresh_token: params.refresh_token,
            });
            console.log('Sesión iniciada desde deep link');
            setConfirmationMessage('Email confirmado. ¡Bienvenido!');
          } catch (e) {
            console.warn('No se pudo establecer la sesión desde el deep link:', e);
            setConfirmationMessage('Confirmación completada. Puedes cerrar esta ventana.');
          }
          return;
        }

        if (params.access_token && !params.refresh_token) {
          console.warn('Deep link de auth no incluyó refresh_token. Se omite setSession manual y se usa getSessionFromUrl si está disponible.');
        }

        // Fallback: intentar que supabase procese la URL (en caso de que la SDK lo soporte)
        try {
          // Algunos entornos exponen getSessionFromUrl
          // @ts-ignore
          if (typeof supabase.auth.getSessionFromUrl === 'function') {
            // @ts-ignore
            const { data, error } = await supabase.auth.getSessionFromUrl({ storeSession: true });
            if (error) console.warn('getSessionFromUrl error:', error);
            if (data?.session) console.log('Sesion obtenida via getSessionFromUrl');
          }
        } catch (e) {
          // ignore
        }
      } catch (err) {
        console.error('Error procesando deep link de autenticacion:', err);
      }
    };

    (async () => {
      const initial = await Linking.getInitialURL();
      if (initial) await processUrl(initial);
    })();

    const sub = Linking.addEventListener('url', ({ url }) => processUrl(url));
    return () => {
      try { sub.remove(); } catch { /* noop */ }
    };
  }, []);


  useEffect(() => {
    if (Constants.appOwnership === 'expo') {
      return;
    }

    let foregroundSubscription: any = null;
    let backgroundSubscription: any = null;
    let unsubscribeMessage: (() => void) | null = null;

    (async () => {
      try {
        const Notifications = await import('expo-notifications');
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: true,
            shouldPlaySound: true,
            shouldSetBadge: false,
            shouldShowBanner: true,
            shouldShowList: true,
          }),
        });

        foregroundSubscription = Notifications.addNotificationReceivedListener(() => {});
        backgroundSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
          // ✅ Tapping any notification brings the app to the foreground automatically.
          // For driver-active notifications, the OS foregrounds the app on tap.
          const data = response.notification.request.content.data as Record<string, unknown> | undefined;
          if (data?.type === 'driver-active') {
            // App is now foregrounded — no extra navigation needed
            console.log('[_layout] Notificación de conductor activo tocada');
          }
          if ((data?.type === 'active-trip' || data?.type === 'customer-active-trip') && typeof data?.bookingId === 'string') {
            // ✅ Guardar para navegación — se procesa en AppStateRestoration
            AsyncStorage.setItem('pending_customer_active_trip', data.bookingId).catch(() => {
              // ignore storage errors
            });
            console.log('[_layout] Notificación de viaje activo guardada para navegación');
          }
        });

        try {
          if (_messagingModule) {
            const m = typeof _messagingModule === 'function' ? _messagingModule() : _messagingModule;
            if (m && typeof m.onMessage === 'function') {
              unsubscribeMessage = m.onMessage(async (remoteMessage: any) => {
                const { title = 'Nueva Notificación', message = 'Has recibido una nueva notificación' } = remoteMessage.data || {};
                try {
                  await Notifications.scheduleNotificationAsync({ content: { title, body: message }, trigger: null });
                } catch (nerr) {
                  console.warn('Could not schedule notification (expo-notifications not available):', nerr);
                }
              });
            }
          }
        } catch (e) {
          console.warn('Error setting up message listener:', e);
        }
      } catch (e) {
        console.warn('expo-notifications not available; skipping notification listeners', e);
      }
    })();

    return () => {
      try {
        if (foregroundSubscription && typeof foregroundSubscription.remove === 'function') foregroundSubscription.remove();
        if (backgroundSubscription && typeof backgroundSubscription.remove === 'function') backgroundSubscription.remove();
        if (unsubscribeMessage) unsubscribeMessage();
      } catch (err) {
        // ignore cleanup errors
      }
    };
  }, []);

  useEffect(() => {
    // Suppress the verbose expo-notifications Expo Go warning during development.
    // The underlying limitation remains: remote notifications are not available in Expo Go.
    LogBox.ignoreLogs([
      'expo-notifications: Android Push notifications',
      'expo-notifications',
      '`expo-notifications` functionality is not fully supported',
      "Couldn't find a screen named 'Home' to use as 'initialRouteName'",
    ]);
    LogBox.ignoreAllLogs(true);

    const initializeApp = async () => {
      try {
        await registerForPushNotificationsAsync();
        if (_messagingModule) {
          const m = typeof _messagingModule === 'function' ? _messagingModule() : _messagingModule;
          if (m && typeof m.onNotificationOpenedApp === 'function') {
            m.onNotificationOpenedApp((remoteMessage: any) => {
              // Manejar la notificación abierta
            });
          }
          if (m && typeof m.getInitialNotification === 'function') {
            const initialNotification = await m.getInitialNotification();
            if (initialNotification) {
              // Manejar la notificación inicial
            }
          }
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  useEffect(() => {
    checkAppVersion(dispatch);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ?? null;
      if (user) {
        dispatch(login(user));
        // Profile data will be fetched as needed in individual screens
        const token = (await GetPushToken()) || "token_error";
        dispatch(updatePushToken(token, Platform.OS === "ios" ? "IOS" : "ANDROID"));
        // La ubicación en SEGUNDO PLANO ya NO se solicita aquí: violaba la
        // Prominent Disclosure de Google (se pedía a todos al iniciar sesión,
        // sin explicación previa). Ahora solo se solicita a los conductores,
        // tras aceptar la divulgación, cuando empieza un viaje activo
        // (ver DriverLocationDisclosureGate y driverLocationTask).
        await startForegroundLocationUpdates(dispatch);
        
        // ✅ RESTAURAR ESTADO DE VIAJES ACTIVOS Y NOTIFICACIONES
        await restoreAppState(user.id);
      } else {
        dispatch(logout());

        // ✅ LIMPIAR NOTIFICACIONES Y ESTADO AL CERRAR SESIÓN
        await cancelActiveTripNotification();
        await dismissDriverNotification();
        await clearActiveTripId();
        await setDriverModeActive(false);

        // Limpiar flags de saludo por voz para que se vuelva a saludar en el próximo login
        try {
          const keys = await AsyncStorage.getAllKeys();
          const greetedKeys = keys.filter((k) => k.startsWith('greeted_'));
          if (greetedKeys.length > 0) await AsyncStorage.multiRemove(greetedKeys);
        } catch {}
      }
      setAuthStateChecked(true);
    });

    return () => subscription.unsubscribe();
  }, [dispatch]);
  

  if (confirmationMessage) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>{confirmationMessage}</Text>
        <Text style={styles.sub}>Puedes cerrar esta ventana o continuar en la app.</Text>
        <View style={{ marginTop: 16 }}>
          <Button title="Continuar" onPress={() => setConfirmationMessage(null)} />
        </View>
      </View>
    );
  }

  return <AppContainer />;
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sub: {
    fontSize: 14,
    color: '#666',
  },
 
});

const RootApp: React.FC = () => {
  return (
    <Provider store={store}>
      <RootLayout />
    </Provider>
  );
};

export default RootApp;