# Aplicación móvil

> Binaria única React Native + Expo con dos experiencias resueltas por
> `userType`: cliente y conductor. Punto de entrada `app/_layout.tsx`.

---
tags: [movil, react-native, expo]
entidades: [Expo Router, Redux, Supabase, Agora, Daviplata]
---

## Estructura de carpetas

```
App/
├── app/                    # Pantallas (Expo Router)
│   ├── _layout.tsx         # Provider Redux + sesión Supabase + tracking global
│   ├── Navigation/         # Stack principal (React Navigation)
│   ├── (tabs)/             # ~35 pantallas: Home, Map, Booking, Wallet, Perfil, etc.
│   ├── login/              # Login, PreLogin, registro, verificación email, reset
│   ├── Booking/            # Flujo de viaje activo, tracking de placa
│   ├── Vehicle/            # Alta/edición de vehículos
│   ├── Subscription/       # Membresías y planes
│   ├── Daviplata/          # Pago Daviplata
│   ├── register-driver.tsx # Registro de conductores desde móvil
│   ├── AuthLoadingScreen.tsx
│   ├── +not-found.tsx
│   └── +html.tsx
├── components/             # ~40 componentes UI reutilizables
├── hooks/                  # 22 hooks
├── common/
│   ├── store/              # Redux (activo: index.ts; legado: store.ts)
│   ├── reducers/           # slices: auth, wallet, settings, memberships
│   ├── actions/            # FareCalculator, saveBooking, api
│   ├── services/           # 15 servicios de dominio
│   ├── utils/              # validadores, formatos, tripShare
│   ├── topus-integration/  # validación de identidad
│   └── vision-backend/     # microservicio OCR Google Cloud Vision
├── config/                 # Supabase, Mapbox, Firebase, Agora
├── supabase/               # config.toml, migrations, edge functions
├── sql/                    # 53 scripts SQL
└── functions/              # Cloud functions Firebase auxiliares
```

## Arranque (`app/_layout.tsx`)

1. Desactiva escalado de fuente del sistema.
2. Registra `driverLocationTask` (background TaskManager) **antes** de que el SO la despache.
3. Monta `<Provider store={store}>` + stack `Navigation`.
4. Restaura sesión Supabase, carga perfil `users` por `auth_id`, despacha `login` / `setProfile` / `logout`.
5. Activa hooks globales: `useGlobalDriverTracking`, `useWalletAndMembershipSync`, `useDriverCarSync`. Monta `CancellationNotifier` y `DriverLocationDisclosureGate`.

## Estado global (Redux Toolkit)

Store activo: `common/store/index.ts`. Slices:

| Slice | Responsabilidad |
|-------|-----------------|
| `auth` | Sesión, perfil, rol |
| `bookings` | Lista y estado de reservas/viajes |
| `vehicles` | Vehículos del conductor |
| `wallet` | Saldo y movimientos |
| `memberships` | Membresía activa |
| `complains` | Quejas / PQR |
| `promodata` | Promociones / códigos |
| `settings` | Configuración general |
| `kilometers` | Kilometraje registrado |

Slices adicionales en `common/store/`: `authThunks` (operaciones async de auth), `backgroundTask`, `permissions`, `types`.

⚠️ Existe store legado en `common/store/store.ts` (`combineReducers` + `actionTypes`). No es el que monta `_layout.tsx`. Ver [[10-deuda-tecnica]].

Hooks tipados: `common/store/hooks.ts`.

## Servicios de dominio (`common/services/`)

| Servicio | Función |
|----------|---------|
| `OtpService` | Genera (4 dígitos), guarda y valida OTP de inicio de viaje |
| `BookingRealtimeService` | Suscripción Realtime a nuevas reservas por ciudad + cambios de reserva |
| `DriverTrackingService` | Lee última ubicación del conductor desde `booking_tracking` |
| `driverLocationTask` | Tarea de ubicación en segundo plano (TaskManager) |
| `ActiveTripNotificationService` | Notificación persistente con viaje activo |
| `backgroundLocationConsent` | Gestión de consentimiento de ubicación en segundo plano |
| `AppStateRestoration` | Restaura estado al volver del background |
| `NotificationService` | Notifica llamadas entrantes vía Edge Functions |
| `NotificationHandlers` | Routing de notificaciones recibidas |
| `CallService` | Wrapper Agora (voz/video) |
| `chatService` | Mensajería cliente↔conductor (polling REST) |
| `membershipsService` | Consulta de membresías por REST directo (evita RLS del SDK) |
| `referralsService` | Código de referido propio y conteo de referidos |
| `ValidationService` | Validaciones de negocio |

Varios usan **fetch REST + JWT** (`getSupabaseAuthHeaders`) en lugar del SDK
Supabase para evitar el lock de auth.

## Hooks notables

- `useGlobalDriverTracking` — global; publica ubicación del conductor.
- `useDriverCarSync` — sincroniza categoría del conductor vía Realtime cuando admin la cambia en web.
- `useBookingDriverPosition` / `useDriverTracking` — cliente observa al conductor.
- `useDriverCancellationWatcher` — detecta cancelaciones del conductor para redirigir al cliente.
- `useDriverSignalHealth` — monitorea calidad de señal de ubicación del conductor.
- `useAnimatedDriverMarker` — interpolación visual del marker.
- `useAgoraCall` — orquesta llamadas.
- `useOtpTimer` — temporizador persistente del OTP.
- `useBookingRequestTimer` — tiempo restante para aceptar una solicitud de viaje.
- `useAuth` — wrapper de Supabase Auth.
- `useWalletAndMembershipSync` — sincroniza saldo y membresía.

## Pantallas críticas

- `app/(tabs)/CustomerMap.tsx` — selección origen/destino.
- `app/(tabs)/CreateReservationScreen.tsx` — crear reserva.
- `app/Booking/PlateTrackingScreen.tsx` — tracking por placa.
- `app/Daviplata/Daviplata.tsx` — pago Daviplata.
- `app/(tabs)/WalletDetails.tsx` — billetera.
- `app/(tabs)/Myfamily.tsx`, `SecurityContactScreen.tsx` — contactos de seguridad.
- `app/Subscription/{ChosePlan,Memberships,SubscriptionScreen}` — membresías.
- `app/(tabs)/OnlineChat.tsx` — chat.

## Comandos

```bash
npm start            # Expo dev client
npm run dev          # APP_VARIANT=development npx expo start
npm run android      # Android
npm run ios          # iOS
npm test             # Jest watch
npm run test:ci      # Jest CI con cobertura
npm run test:e2e     # Maestro
npm run lint         # ESLint (expo lint)
npm run build        # update-version + eas build
npm run docs         # TypeDoc → docs/api/
npm run preview      # EAS preview
npm run production   # EAS production
```

## Emulador Android en Mac Apple Silicon — config recomendada (2026-07-04)

Probado en máquina remota (Mac Apple Silicon) para debug de `mapaSensors.tsx`
(Google Maps vía `react-native-maps`). Config validada que evita los 2
problemas encontrados (mapa en blanco por fallo de superficie GL, y
`OutOfMemoryError` del inspector de red de Expo dev-tools):

| Parámetro | Valor |
|---|---|
| Device profile | Pixel 8 o Pixel 9 Pro (evitar foldables/Pro XL — más resolución = más carga GPU) |
| API Level | 35 (matchea target de Expo SDK 54) |
| Services | **Google Play** (no "Google APIs" solo — Maps SDK necesita Play Services real) |
| ABI | `arm64-v8a` (nativo en Apple Silicon, sin traducción Rosetta) |
| Graphics acceleration | **Hardware** (no dejar en "Automatic") |
| RAM | 4096 MB |
| VM heap size | **≥512 MB** (256 MB default causó `OutOfMemoryError` real en `ExpoRequestCdpInterceptor`/CDP network inspector, con el polling de `fetchHomeImmediateBookings` cada 7s + logs de diagnóstico activos) |
| CPU cores | 4 |

Si el mapa sigue en blanco con esta config (Hardware + arm64-v8a + Google
Play), probar como plan B una imagen **x86_64** — hay reportes de mejor
compatibilidad de Maps específicamente en esa combinación sobre Mac
Apple Silicon, aunque corre traducido (más lento).

⚠️ **Nota aparte, no resuelta:** `mapaSensors.tsx` tiene `syncCamera()`
(línea ~279-287) que hardcodea `pitch: 68, zoom: 19` y se llama
inmediatamente al iniciar tracking y en cada actualización de GPS —
**pisa** cualquier valor puesto en `initialCamera` (línea ~357-363) casi al
instante. Si se quiere probar la hipótesis de que el pitch 3D causa el
fallo de GL, hay que cambiar `syncCamera` también, no solo `initialCamera`
— un diagnóstico previo que solo tocó `initialCamera` concluyó "el pitch no
es la causa" sin haber probado realmente pitch:0, porque `syncCamera` lo
revertía. Sin confirmar aún cuál de las dos causas (config emulador vs pitch
3D) es la real.

## Fuentes
- `App/app/_layout.tsx` — flujo de arranque
- `App/common/store/index.ts` — store activo
- `App/common/services/*` — 15 servicios de dominio
- `App/hooks/*` — 22 hooks
- `App/app/(tabs)/` — pantallas principales
- `App/app/(tabs)/mapaSensors.tsx` — MapView del conductor (Google Maps)
- `App/app/Navigation/Navigation.tsx` — stack de navegación
