# TmasPlus — Guía del Frontend y onboarding

Esta guía explica **cómo está organizado el frontend, dónde está cada cosa y por dónde
empezar para meterle código**. Para la visión general del sistema ver
[ARQUITECTURA.md](./ARQUITECTURA.md); para datos/endpoints ver
[ENDPOINTS_Y_CONSULTAS.md](./ENDPOINTS_Y_CONSULTAS.md).

---

## 1. Cómo arranca el frontend (cadena de montaje)

```
expo-router/entry
   └─ app/_layout.tsx          → RootLayout: <Provider store> + sesión Supabase + hooks globales
        └─ app/Navigation/Navigation.tsx   → Stack principal (React Navigation native-stack)
             ├─ Prelogin / Login / ResetPassword / EmailVerification   (no autenticado)
             └─ components/TabNavigator.tsx → Tabs (autenticado) + resto de pantallas push
```

- **Entry point:** `"main": "expo-router/entry"` en [package.json](../package.json).
- **Layout raíz:** [app/_layout.tsx](../app/_layout.tsx) — monta Redux, restaura la sesión de
  Supabase, carga el perfil de `users` y activa `useGlobalDriverTracking` +
  `useWalletAndMembershipSync`.
- **Router real:** aunque el proyecto usa Expo Router (carpeta `app/`), la navegación está
  centralizada en un **stack de React Navigation** en
  [app/Navigation/Navigation.tsx](../app/Navigation/Navigation.tsx). Ahí se registran TODAS
  las rutas con `<Stack.Screen name="..." component={...} />`.
- **Tabs:** [components/TabNavigator.tsx](../components/TabNavigator.tsx) +
  [components/CustomTabBar.tsx](../components/CustomTabBar.tsx).

> 🔑 **Para añadir o encontrar una pantalla, empieza siempre por `Navigation.tsx`**: es el
> mapa maestro de qué `name` apunta a qué componente.

---

## 2. Estructura de carpetas del frontend (dónde está cada cosa)

| Carpeta | Qué contiene | Cuándo tocarla |
|---------|--------------|----------------|
| [app/](../app/) | **Pantallas** (screens). Subcarpetas por dominio | Crear/editar una vista |
| `app/(tabs)/` | 36 pantallas principales (Home, Map, Wallet, Perfil, reservas…) | La mayoría de pantallas |
| `app/login/` | Login, PreLogin, registro, verificación de email, reset | Flujo de autenticación |
| `app/Booking/` | Viaje activo, tracking de placa, navegación WebView | Flujo de viaje en curso |
| `app/Vehicle/` | Alta/edición de vehículos | Gestión de vehículos del conductor |
| `app/Subscription/` | Membresías y planes | Suscripciones |
| `app/Daviplata/` | Pago con Daviplata | Pasarela de pago |
| [components/](../components/) | **35 componentes UI reutilizables** (modales, mapas, cards, tab bar) | UI compartida |
| [hooks/](../hooks/) | **21 hooks** (auth, tracking, OTP timer, llamadas, sync) | Lógica reutilizable con estado |
| [common/services/](../common/services/) | Servicios de dominio (lógica + Supabase) | Lógica de negocio / llamadas a datos |
| [common/actions/](../common/actions/) | Acciones/thunks Redux + helpers (FareCalculator, api) | Lógica que despacha al store |
| [common/store/](../common/store/) + [common/reducers/](../common/reducers/) | Store Redux y slices | Estado global |
| [common/utils/](../common/utils/) | Validadores, formatos, reglas | Helpers puros |
| [config/](../config/) | Supabase, Mapbox, Firebase, Agora, tipos de BD | Configuración / clientes |
| [constants/](../constants/) | Colores, constantes Daviplata/Topus | Constantes y theming |
| [assets/](../assets/) | Imágenes, vídeo, fuentes, animaciones Lottie | Recursos estáticos |

---

## 3. Mapa de navegación (ruta → archivo → para qué sirve)

Rutas registradas en [Navigation.tsx](../app/Navigation/Navigation.tsx). Se navega con
`navigation.navigate("<name>")`.

### Autenticación
| Ruta (`name`) | Archivo | Función |
|---|---|---|
| `Prelogin` | [app/login/PreLogin.tsx](../app/login/PreLogin.tsx) | Pantalla inicial / bienvenida |
| `Login` | [app/login/LoginScreen.tsx](../app/login/LoginScreen.tsx) | Inicio de sesión + reset por email |
| `EmailVerificationScreen` | [app/login/EmailVerification.tsx](../app/login/EmailVerification.tsx) | Verificación de correo |
| `ResetPassword` | [app/login/ResetPassword.tsx](../app/login/ResetPassword.tsx) | Restablecer contraseña |

### Cliente — home, mapa y reserva
| Ruta | Archivo | Función |
|---|---|---|
| `HomeScreen` / tab `CustomerHome` | [app/(tabs)/CustomerHomeScreen.tsx](<../app/(tabs)/CustomerHomeScreen.tsx>) | Home del cliente |
| tab `CustomerMap` | [app/(tabs)/CustomerMap.tsx](<../app/(tabs)/CustomerMap.tsx>) | Mapa para pedir viaje |
| `Search` | [app/(tabs)/SearchScreen.tsx](<../app/(tabs)/SearchScreen.tsx>) | Buscar origen/destino |
| tab `TripPreviewScreen` | [app/(tabs)/TripPreviewScreen.tsx](<../app/(tabs)/TripPreviewScreen.tsx>) | Previsualizar tarifa/ruta |
| `CreateReservation` | [app/(tabs)/CreateReservationScreen.tsx](<../app/(tabs)/CreateReservationScreen.tsx>) | Crear reserva (inmediata/programada) |
| `Booking` | [app/(tabs)/BookingScreen.tsx](<../app/(tabs)/BookingScreen.tsx>) | Pantalla de booking |
| `BookingS` | [app/Booking/BookingCabScren.tsx](../app/Booking/BookingCabScren.tsx) | Solicitud de cabina/cab |

### Viaje en curso y tracking
| Ruta | Archivo | Función |
|---|---|---|
| `BookingActive` | [app/Booking/ActiveBookingScreen.tsx](../app/Booking/ActiveBookingScreen.tsx) | Viaje activo (conductor) |
| `CustomerActiveTrip` | [app/(tabs)/CustomerActiveTripScreen.tsx](<../app/(tabs)/CustomerActiveTripScreen.tsx>) | Viaje activo (cliente) |
| `PlateTracking` | [app/Booking/PlateTrackingScreen.tsx](../app/Booking/PlateTrackingScreen.tsx) | Seguir vehículo por placa |
| `NavigationWebView` | [app/Booking/NavigationWebView.tsx](../app/Booking/NavigationWebView.tsx) | Navegación turn-by-turn (WebView) |
| `MapSensors` | [app/(tabs)/mapaSensors.tsx](<../app/(tabs)/mapaSensors.tsx>) | Mapa con sensores |
| `ReceiveLocation` | [app/(tabs)/ReceiveLocationScreen.tsx](<../app/(tabs)/ReceiveLocationScreen.tsx>) | Recibir ubicación compartida |

### Reservas
| Ruta | Archivo | Función |
|---|---|---|
| `ReservationsScreen` | [app/(tabs)/ReservationsScreen.tsx](<../app/(tabs)/ReservationsScreen.tsx>) | Lista de reservas |
| `ReservationDetail` | [app/(tabs)/ReservationDetailScreen.tsx](<../app/(tabs)/ReservationDetailScreen.tsx>) | Detalle de reserva |
| `ReservationTrip` | [app/(tabs)/ReservationTripScreen.tsx](<../app/(tabs)/ReservationTripScreen.tsx>) | Viaje de una reserva |
| `DriverReservations` | [app/(tabs)/DriverReservationsScreen.tsx](<../app/(tabs)/DriverReservationsScreen.tsx>) | Reservas del conductor |

### Conductor
| Ruta | Archivo | Función |
|---|---|---|
| `DriverActivity` | [app/(tabs)/DriverActivityScreen.tsx](<../app/(tabs)/DriverActivityScreen.tsx>) | Actividad del conductor |
| `MyEarning` | [app/(tabs)/DriverIncomeScreen.tsx](<../app/(tabs)/DriverIncomeScreen.tsx>) | Ingresos |
| `Rating` | [app/(tabs)/DriverRating.tsx](<../app/(tabs)/DriverRating.tsx>) | Calificaciones |
| `CarsScreen` | [app/Vehicle/carScreen.tsx](../app/Vehicle/carScreen.tsx) | Vehículos |
| `CarsEdit` | [app/Vehicle/CarsEditScreen.tsx](../app/Vehicle/CarsEditScreen.tsx) | Editar vehículo |
| `Carnet` | [app/(tabs)/CarnetScreen.tsx](<../app/(tabs)/CarnetScreen.tsx>) | Carnet del conductor |
| `Docs` | [app/(tabs)/DocumentsScreen.tsx](<../app/(tabs)/DocumentsScreen.tsx>) | Documentos |

### Pagos y planes
| Ruta | Archivo | Función |
|---|---|---|
| `Wallet` | [app/(tabs)/WalletDetails.tsx](<../app/(tabs)/WalletDetails.tsx>) | Billetera |
| `Payment` | [app/(tabs)/PaymentDeais.tsx](<../app/(tabs)/PaymentDeais.tsx>) | Detalles de pago |
| `DaviplataPayment` | [app/Daviplata/Daviplata.tsx](../app/Daviplata/Daviplata.tsx) | Pago Daviplata |
| `Memberships` | [app/Subscription/Memberships.tsx](../app/Subscription/Memberships.tsx) | Membresías |
| `ChosePlan` | [app/Subscription/ChosePlan.tsx](../app/Subscription/ChosePlan.tsx) | Elegir plan |
| `SubscriptionScreen` | [app/Subscription/SubscriptionScreen.tsx](../app/Subscription/SubscriptionScreen.tsx) | Suscripción |

### Soporte, seguridad y perfil
| Ruta | Archivo | Función |
|---|---|---|
| `Chat` | [app/(tabs)/OnlineChat.tsx](<../app/(tabs)/OnlineChat.tsx>) | Chat cliente↔conductor |
| `Soporte` | [app/(tabs)/CustomerSupport.tsx](<../app/(tabs)/CustomerSupport.tsx>) | Soporte |
| `Complain` | [app/(tabs)/ComplainScreen.tsx](<../app/(tabs)/ComplainScreen.tsx>) | Quejas/PQR |
| `Notifications` | [app/(tabs)/NotificationsScreen.tsx](<../app/(tabs)/NotificationsScreen.tsx>) | Notificaciones |
| `Updates` | [app/(tabs)/UpdatesScreen.tsx](<../app/(tabs)/UpdatesScreen.tsx>) | Novedades |
| `Myfamily` | [app/(tabs)/Myfamily.tsx](<../app/(tabs)/Myfamily.tsx>) | Familia / contactos |
| `SecurityContact` | [app/(tabs)/SecurityContactScreen.tsx](<../app/(tabs)/SecurityContactScreen.tsx>) | Contacto de seguridad |
| `Segurity` | [app/(tabs)/Segurity.tsx](<../app/(tabs)/Segurity.tsx>) | Seguridad |
| `Insurance` | [app/(tabs)/Insurance.tsx](<../app/(tabs)/Insurance.tsx>) | Seguro |
| `General` | [app/(tabs)/GeneralScreen.tsx](<../app/(tabs)/GeneralScreen.tsx>) | Ajustes generales / perfil |
| `ChangePassword` | [app/(tabs)/ChangePasswordScreen.tsx](<../app/(tabs)/ChangePasswordScreen.tsx>) | Cambiar contraseña |
| `UserLookup` | [app/(tabs)/UserLookupScreen.tsx](<../app/(tabs)/UserLookupScreen.tsx>) | Buscar usuario |
| `WebViewLayout` | [app/(tabs)/WebViewLayout.tsx](<../app/(tabs)/WebViewLayout.tsx>) | Contenedor WebView |
| `ImageGallery` | [components/ImageGalleryComponent.tsx](../components/ImageGalleryComponent.tsx) | Galería de imágenes |

---

## 4. Componentes y hooks que se reutilizan más

**Componentes** ([components/](../components/)): `CustomAlert`, `OtpModal` /
`DriverOtpVerificationModal`, `AgoraCallModal` / `IncomingCallModal`, `MapContainer` /
`GoogleMaps`, `VehicleCard` / `CarDetails`, `CancelModal` / `CountdownModal`,
`CustomTabBar`, `PaymentDetails`, `ThemedText` / `ThemedView`.

**Hooks** ([hooks/](../hooks/)): [`useAuth`](../hooks/useAuth.ts),
[`useDriverTracking`](../hooks/useDriverTracking.ts) /
[`useGlobalDriverTracking`](../hooks/useGlobalDriverTracking.ts),
[`useBookingDriverPosition`](../hooks/useBookingDriverPosition.ts),
[`useAnimatedDriverMarker`](../hooks/useAnimatedDriverMarker.ts),
[`useOtpTimer`](../hooks/useOtpTimer.ts), [`useAgoraCall`](../hooks/useAgoraCall.ts),
[`useWalletAndMembershipSync`](../hooks/useWalletAndMembershipSync.ts),
[`useBookingRequestTimer`](../hooks/useBookingRequestTimer.ts),
[`useEmailValidation`](../hooks/useEmailValidation.ts) /
[`usePhoneValidation`](../hooks/usePhoneValidation.ts).

---

## 5. Convenciones del proyecto

- **TypeScript estricto** (`strict: true`). Tipa props y respuestas.
- **Alias de imports:** `@/` apunta a la raíz de `App/` (ver `tsconfig.json` y
  `babel-plugin-module-resolver`). Ej.: `import supabase from '@/config/SupabaseConfig'`.
- **Acceso a datos:** preferir un **service** en `common/services/` que use `fetch` REST con
  `getSupabaseAuthHeaders` (el SDK de Supabase puede bloquearse en RN — ver nota en
  [chatService.ts](../common/services/chatService.ts)).
- **Estado global:** `useSelector`/`useDispatch` (hooks tipados en
  [common/store/hooks.ts](../common/store/hooks.ts)).
- **Textos:** i18n con `react-i18next` (`useTranslation`).
- **Colores/tema:** [constants/Colors.ts](../constants/Colors.ts) /
  [constants/Colors.modern.ts](../constants/Colors.modern.ts).
- **Sin escalado de fuente:** se fija globalmente en `_layout.tsx`.

---

## 6. Por dónde empezar (onboarding)

### 6.1 Levantar el proyecto
```bash
cd prueba2/App
npm install
# Crear .env con las claves (ver ARQUITECTURA §9). Sin .env la app no conecta.
npm start            # Expo dev client (escanear QR o abrir emulador)
# o:  npm run android   /   npm run ios
```
Requisitos: Node, Expo CLI, y un **dev client** (no Expo Go, por módulos nativos como
Mapbox/Agora). Build de dev client: `npm run developer` (EAS) o `expo run:android`.

### 6.2 Recorrido recomendado para entender el código
1. [app/_layout.tsx](../app/_layout.tsx) — cómo arranca todo.
2. [app/Navigation/Navigation.tsx](../app/Navigation/Navigation.tsx) — el mapa de rutas.
3. [common/store/index.ts](../common/store/index.ts) — el estado global.
4. [config/SupabaseConfig.ts](../config/SupabaseConfig.ts) — cómo se habla con el backend.
5. Una pantalla simple como [app/(tabs)/GeneralScreen.tsx](<../app/(tabs)/GeneralScreen.tsx>)
   y un service como [common/services/membershipsService.ts](../common/services/membershipsService.ts).

### 6.3 Cómo agregar una pantalla nueva (paso a paso)
1. Crea el componente en `app/(tabs)/MiPantalla.tsx` (o la subcarpeta de su dominio).
2. Impórtalo y regístralo en [Navigation.tsx](../app/Navigation/Navigation.tsx):
   ```tsx
   import MiPantalla from "@/app/(tabs)/MiPantalla";
   // dentro del <Stack.Navigator>:
   <Stack.Screen name="MiPantalla" component={MiPantalla} options={{ headerShown: false }} />
   ```
3. Navega hacia ella desde cualquier pantalla: `navigation.navigate("MiPantalla", { ...params })`.

### 6.4 Cómo agregar acceso a datos
1. Crea/edita un service en `common/services/` que use `getSupabaseAuthHeaders` + `fetch`
   (patrón de [membershipsService.ts](../common/services/membershipsService.ts)) — o un RPC.
2. Si el dato es global, añádelo a un slice en `common/store/` o `common/reducers/` y
   despáchalo; si es local, usa `useState`/`useEffect` en la pantalla.
3. Endpoints y consultas disponibles: ver
   [ENDPOINTS_Y_CONSULTAS.md](./ENDPOINTS_Y_CONSULTAS.md).

### 6.5 Cómo agregar estado global
1. Crea un slice con `createSlice` en `common/store/` (ej.
   [bookingsSlice.ts](../common/store/bookingsSlice.ts)).
2. Regístralo en el `reducer` de [common/store/index.ts](../common/store/index.ts).
3. Consúmelo con `useSelector((s: RootState) => s.miSlice)`.

### 6.6 Antes de subir cambios
```bash
npm run lint      # ESLint
npm test          # Jest
npm run docs      # regenerar referencia de API si cambiaste firmas públicas
```

> ⚠️ Hay **deuda técnica** documentada (dos stores Redux, plist de Firebase de otro
> proyecto, secretos en repo). Antes de tocar auth/pagos/Firebase, lee
> [ARQUITECTURA.md §5 y §12](./ARQUITECTURA.md).
