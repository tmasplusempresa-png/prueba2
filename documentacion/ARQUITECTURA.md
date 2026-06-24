# TmasPlus — Documentación de arquitectura

> **TmasPlus** (`com.releaseunocero` / `tmasplus.tmasplus`) es una app de transporte
> urbano inteligente tipo *ride-hailing* (cliente ↔ conductor) para Colombia.
> Soporta viajes **inmediatos** y **reservas programadas**, tracking en tiempo real,
> verificación OTP, pagos con **Daviplata** y **billetera**, **membresías**, llamadas
> de voz/video, chat y un sistema de **referidos**.

Esta es la documentación curada de **lo más importante**. La referencia de código
auto-generada (todas las funciones, tipos y servicios) está en
[`docs/api/`](./api/README.md) y se regenera con `npm run docs`.

---

## 1. Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | **React Native 0.81.5** + **Expo SDK 54** |
| Routing | **Expo Router 6** (file-based) + React Navigation (native-stack) |
| Lenguaje | **TypeScript** (modo `strict`) |
| Estado | **Redux Toolkit** + `react-redux` |
| Backend principal | **Supabase** (Auth, Postgres, Storage, Realtime, Edge Functions) |
| Backend secundario | **Firebase** (auth, messaging/push, storage) |
| Mapas | **Mapbox** (`@rnmapbox/maps`), `react-native-maps`, Google Maps + Directions |
| Llamadas | **Agora** (voz/video sobre UIKit) |
| Notificaciones | **Expo Notifications** + Firebase Cloud Messaging |
| Pagos | **Daviplata** (pasarela Colombia) + billetera interna |
| Identidad/OCR | **Topus** (validación documental) + **Google Cloud Vision** |
| i18n | `i18next` / `react-i18next` / `i18n-js` |
| Observabilidad | **Sentry** (`@sentry/react-native`) |
| Build/OTA | **EAS Build** + **Expo Updates** |

Configuración del proyecto: [app.config.js](../app.config.js) (deriva todo de `.env`),
y [config/AppConfig.ts](../config/AppConfig.ts) (lectura tipada en runtime vía
`Constants.expoConfig.extra`).

---

## 2. Roles de usuario

La app es **una sola binaria con dos experiencias** que dependen de `userType`/rol del
perfil cargado desde la tabla `users`:

- **Cliente** — solicita viajes, reserva, paga, califica, comparte el viaje con familia.
- **Conductor** — recibe solicitudes, navega, emite/valida OTP, registra ingresos,
  gestiona vehículo y documentos.

El rol se resuelve al iniciar sesión en [app/_layout.tsx](../app/_layout.tsx) (carga el
perfil de `users` por `auth_id`) y condiciona las pantallas y suscripciones realtime.

---

## 3. Estructura del repositorio

```
App/
├── app/                    # Pantallas (Expo Router)
│   ├── _layout.tsx         # Layout raíz: Provider Redux + sesión Supabase + tracking global
│   ├── Navigation/         # Stack de navegación principal (React Navigation)
│   ├── (tabs)/             # 36 pantallas: Home, Map, Booking, Wallet, Perfil, etc.
│   ├── login/              # Login, PreLogin, registro, verificación email, reset
│   ├── Booking/            # Flujo de viaje activo, tracking de placa, navegación
│   ├── Vehicle/            # Alta/edición de vehículos
│   ├── Subscription/       # Membresías y planes
│   └── Daviplata/          # Pago Daviplata
├── components/             # 35 componentes UI reutilizables (modales, mapas, cards…)
├── hooks/                  # 21 hooks (auth, tracking, OTP timer, llamadas, sync…)
├── common/
│   ├── store/              # configureStore + slices (bookings, vehicles…)
│   ├── reducers/           # slices/reducers (auth, wallet, settings, memberships…)
│   ├── actions/            # acciones/thunks + lógica (FareCalculator, api…)
│   ├── services/           # 14 servicios de dominio (ver §6)
│   ├── utils/              # validadores, formatos, reglas de vehículo, compartir viaje
│   ├── topus-integration/  # validación de identidad Topus
│   └── vision-backend/     # microservicio OCR con Google Cloud Vision
├── config/                 # Supabase, Mapbox, Firebase, Agora, tipos de BD
├── constants/              # colores, constantes Daviplata y Topus
├── supabase/               # config.toml, migrations, edge functions
├── sql/                    # 53 scripts SQL (esquema, RLS, RPC, seeds)
├── functions/              # Cloud functions (Firebase) auxiliares
└── docs/                   # Esta documentación + API generada + Postman
```

---

## 4. Arranque de la aplicación

El punto de entrada es `expo-router/entry` → [app/_layout.tsx](../app/_layout.tsx), que:

1. Desactiva el escalado de fuente del sistema (tamaños fijos).
2. Registra la **background location task** del conductor
   ([common/services/driverLocationTask.ts](../common/services/driverLocationTask.ts))
   antes de que el SO la pueda despachar.
3. Monta `<Provider store={store}>` (Redux) y el stack de
   [Navigation](../app/Navigation/Navigation.tsx).
4. Restaura la sesión de Supabase y carga el perfil de `users`, despachando
   `login`/`setProfile`/`logout`.
5. Activa hooks globales: `useGlobalDriverTracking` y `useWalletAndMembershipSync`,
   y monta `CancellationNotifier`.

---

## 5. Estado global (Redux)

El store activo es [common/store/index.ts](../common/store/index.ts). Slices/reducers:

| Slice | Responsabilidad |
|-------|-----------------|
| `auth` | Sesión, perfil de usuario, rol |
| `bookings` | Lista y estado de reservas/viajes |
| `vehicles` | Vehículos del conductor |
| `wallet` | Saldo y movimientos de la billetera |
| `memberships` | Membresía activa del usuario |
| `complains` | Quejas/PQR |
| `promodata` | Promociones / códigos |
| `settings` | Configuración general de la app |

> ⚠️ **Nota de mantenimiento:** existe un segundo store legado en
> [common/store/store.ts](../common/store/store.ts) que usa
> [common/reducers/reducers.ts](../common/reducers/reducers.ts) (con `combineReducers` y
> reducers basados en `actionTypes`). El que realmente monta `_layout.tsx` es
> `common/store/index.ts`. Conviene unificarlos para evitar confusión.

Hooks tipados de acceso al store: [common/store/hooks.ts](../common/store/hooks.ts).

---

## 6. Servicios de dominio (`common/services/`)

Los servicios encapsulan la lógica de negocio y la comunicación con Supabase. Varios
usan **fetch REST directo con el JWT** (`getSupabaseAuthHeaders`) en lugar del SDK,
porque en React Native el SDK de Supabase puede bloquearse por el lock de auth.

| Servicio | Qué hace |
|----------|----------|
| [`OtpService`](../common/services/OtpService.ts) | Genera (4 dígitos), guarda y valida el OTP de inicio de viaje |
| [`BookingRealtimeService`](../common/services/BookingRealtimeService.ts) | Suscripciones Realtime de Supabase a nuevas reservas por ciudad y a cambios de una reserva |
| [`DriverTrackingService`](../common/services/DriverTrackingService.ts) | Lee la última ubicación del conductor desde `booking_tracking` |
| [`driverLocationTask`](../common/services/driverLocationTask.ts) | Tarea de ubicación en segundo plano (TaskManager) |
| [`ActiveTripNotificationService`](../common/services/ActiveTripNotificationService.ts) | Notificación persistente mientras hay viaje activo |
| [`AppStateRestoration`](../common/services/AppStateRestoration.ts) | Restaura el estado al volver del background |
| [`NotificationService`](../common/services/NotificationService.ts) | Notifica llamadas entrantes vía Edge Functions |
| [`NotificationHandlers`](../common/services/NotificationHandlers.ts) | Manejo/routeo de notificaciones recibidas |
| [`CallService`](../common/services/CallService.ts) | Wrapper de llamadas Agora (voz/video) |
| [`chatService`](../common/services/chatService.ts) | Mensajería cliente↔conductor (polling REST) |
| [`membershipsService`](../common/services/membershipsService.ts) | Consulta de membresías por REST (evita RLS del SDK) |
| [`referralsService`](../common/services/referralsService.ts) | Código de referido propio y conteo de referidos |
| [`ValidationService`](../common/services/ValidationService.ts) | Validaciones de negocio |

---

## 7. Flujos principales

### 7.1 Autenticación y registro
`PreLogin → LoginScreen / register-driver → EmailVerification → AuthLoadingScreen`.
Sesión gestionada por Supabase Auth con persistencia segura
([config/SupabaseConfig.ts](../config/SupabaseConfig.ts),
[config/react-native-persistance.js](../config/react-native-persistance.js)).
Para conductores hay validación de identidad **Topus** y carga de documentos (OCR Vision).

### 7.2 Reserva de viaje (inmediato vs. programado)
El cliente elige origen/destino en el mapa
([app/(tabs)/CustomerMap.tsx](../app/(tabs)/CustomerMap.tsx),
[CreateReservationScreen](<../app/(tabs)/CreateReservationScreen.tsx>)). La tarifa se
calcula en [common/actions/FareCalculator.tsx](../common/actions/FareCalculator.tsx).
Una reserva puede ser **inmediata** o **programada** (`booking_type`/`booking_mode`).
La reserva se persiste con [common/actions/saveBooking.ts](../common/actions/saveBooking.ts).

### 7.3 Asignación y tracking en tiempo real
El conductor recibe solicitudes vía `BookingRealtimeService` (canal por ciudad).
Al aceptar, su ubicación se publica con la background task y el cliente la observa con
[`useBookingDriverPosition`](../hooks/useBookingDriverPosition.ts) /
[`useDriverTracking`](../hooks/useDriverTracking.ts) y el marcador animado
([`useAnimatedDriverMarker`](../hooks/useAnimatedDriverMarker.ts)). Existe también
**tracking por placa** ([PlateTrackingScreen](../app/Booking/PlateTrackingScreen.tsx)).

### 7.4 Inicio de viaje con OTP
Al llegar el conductor, el cliente recibe/entrega un **OTP de 4 dígitos** generado por
`OtpService`; el conductor lo valida ([DriverOtpVerificationModal](../components/DriverOtpVerificationModal.tsx),
[`useOtpTimer`](../hooks/useOtpTimer.ts)) para arrancar el viaje. Estados del viaje:
`ACCEPTED → ARRIVED → STARTED → …`.

### 7.5 Pago
Al finalizar: **Daviplata** ([app/Daviplata/Daviplata.tsx](../app/Daviplata/Daviplata.tsx),
[components/DaviplataPayment/](../components/DaviplataPayment/),
[constants/daviplata.constants.ts](../constants/daviplata.constants.ts)) o **billetera**
([WalletDetails](<../app/(tabs)/WalletDetails.tsx>), slice `wallet`).

### 7.6 Membresías y referidos
Planes en [app/Subscription/](../app/Subscription/) (`ChosePlan`, `Memberships`,
`SubscriptionScreen`), servidos por `membershipsService`. Programa de referidos vía
`referralsService` y SQL `create-referral-system-app.sql`.

### 7.7 Comunicación durante el viaje
Llamadas voz/video con **Agora** ([`useAgoraCall`](../hooks/useAgoraCall.ts),
[AgoraCallModal](../components/AgoraCallModal.tsx),
[IncomingCallModal](../components/IncomingCallModal.tsx)) y **chat** con `chatService`
([OnlineChat](<../app/(tabs)/OnlineChat.tsx>)).

### 7.8 Seguridad / familia
Compartir viaje con contactos ([common/utils/tripShare.ts](../common/utils/tripShare.ts)),
contactos de respaldo ([Myfamily](<../app/(tabs)/Myfamily.tsx>),
[SecurityContactScreen](<../app/(tabs)/SecurityContactScreen.tsx>)).

---

## 8. Backend (Supabase)

- **Configuración:** [config/SupabaseConfig.ts](../config/SupabaseConfig.ts) (cliente,
  headers JWT, manejo de sesión), `SupabaseAuth.ts`, `SupabaseDatabase.ts`,
  `SupabaseStorage.ts`. Tipos de BD en [config/database.types.ts](../config/database.types.ts).
- **Tablas clave:** `users`, `cars`, `car_types`, `bookings`, `tracking` /
  `booking_tracking`, `wallet_history`, `notifications`, `user_ratings`,
  `saved_addresses`, `promos`, `memberships`, `chat_messages`, `complaints`.
- **Edge Functions** ([supabase/functions/](../supabase/functions/)):
  - `generateAgoraToken` — token de canal Agora.
  - `notifyIncomingCall` — push de llamada entrante.
  - `sync-driver-to-primary` — sincronización del conductor.
- **SQL** ([sql/](../sql/)): 53 scripts con esquema, **políticas RLS**, funciones **RPC**
  (p.ej. `check_email_exists`, `get_memberships`, plate tracking) y seeds. Empezar por
  `EJECUTAR_PRIMERO_OTP_SETUP.sql`, `create-users-table-with-rls.sql`,
  `bookings-schema.sql`, `storage-buckets-setup.sql`.
- **Storage buckets:** perfiles, documentos de usuario/vehículo/conductor, imágenes de
  vehículo y media de reservas (ver `StorageConfiguration` en `AppConfig.ts`).

API REST de referencia: [docs/POSTMAN_REST_API.md](./POSTMAN_REST_API.md).

---

## 9. Configuración y entorno

Todas las claves se inyectan por `.env` y se exponen vía `app.config.js → extra`:

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_MAPS_API_KEY_ANDROID` / `_IOS`, `MAPBOX_ACCESS_TOKEN`,
  `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`
- Identidad app: `APP_IDENTIFIER`, `EXPO_PROJECT_ID`, versiones (`APP_VERSION`,
  `EXPO_RUNTIME_VERSION`, `ANDROID_APP_VERSION`)

> 🔐 No commitear `.env` ni `GoogleService-Info.plist` con secretos reales.

---

## 10. Comandos útiles

```bash
npm start            # Expo dev client
npm run android      # build/run Android
npm run ios          # build/run iOS
npm test             # Jest (watch)
npm run test:ci      # Jest con cobertura (CI)
npm run test:e2e     # Maestro (E2E)
npm run lint         # ESLint (expo lint)
npm run docs         # Genera la referencia de API en docs/api/
npm run preview      # EAS build canal preview
npm run production    # EAS build canal production
```

---

## 11. Pruebas

- **Unitarias/componentes:** Jest + `@testing-library/react-native`
  (`components/__tests__/`, `app/(tabs)/__tests__/`, `common/__tests__/`).
- **E2E:** Maestro (`.maestro/`, p.ej. `login.yaml`, `full_flow.yaml`).

---

## 12. Cuentas y servicios externos

> Esta sección lista **qué servicios usa la app, con qué cuenta/identificador y dónde
> vive cada credencial**. Los identificadores embebidos en el cliente (URLs, project IDs,
> App IDs, OAuth client IDs) se incluyen tal cual; los **secretos** (claves, certificados,
> tokens) **no se reproducen**: solo se indica el archivo donde residen.

### 12.1 Correo electrónico (email)

| Mecanismo | Estado | Detalle |
|-----------|--------|---------|
| **Supabase Auth** (proveedor principal) | ✅ Activo | Envía los correos transaccionales de **verificación de cuenta** (`supabase.auth.signUp` con `emailRedirectTo`) y **restablecimiento de contraseña** (`supabase.auth.resetPasswordForEmail`). Ver [config/SupabaseAuth.ts](../config/SupabaseAuth.ts), [hooks/useAuth.ts](../hooks/useAuth.ts), [app/login/LoginScreen.tsx](../app/login/LoginScreen.tsx). El **SMTP real** lo define la configuración *Auth → SMTP* del proyecto Supabase (mailer integrado de Supabase por defecto, o un SMTP propio configurado en el dashboard — **no está en el código**). Redirección post-verificación: `https://dashboard.tmasplus.com/welcome` (`SUPABASE_EMAIL_REDIRECT_TO`). |
| **Firebase** (`smtpdata` + `sendEmailVerification`) | ⚠️ Legado | El proyecto Firebase guarda credenciales SMTP en el nodo de Realtime DB `smtpdata` (`smtpRef` en [config/configureFirebase.tsx](../config/configureFirebase.tsx)) y SMS en `smsConfig` (`smsRef`) — patrón heredado de la plantilla, consumido por Cloud Functions. Además [app/login/EmailVerification.tsx](../app/login/EmailVerification.tsx) usa `sendEmailVerification` de Firebase Auth (parte del import está comentado). **Recomendación:** consolidar todo el correo en Supabase y retirar el camino Firebase. |

➡️ **Resumen:** el correo de producción sale por **Supabase Auth** (cuenta del proyecto
Supabase `utofhxgzkdhljrixperh`); el SMTP concreto se gestiona en el panel de Supabase.

### 12.2 Inventario de cuentas

| Servicio | Cuenta / Identificador | Uso | Dónde está la credencial |
|----------|------------------------|-----|--------------------------|
| **Supabase** | Proyecto `utofhxgzkdhljrixperh` · `https://utofhxgzkdhljrixperh.supabase.co` | Auth, Postgres, Storage, Realtime, Edge Functions, **correo** | `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` en `.env` |
| **Firebase / Google Cloud** | Proyecto **`treasupdate`** · bucket `treasupdate.appspot.com` · nº de proyecto / Sender ID `212923549236` · App ID `1:212923549236:ios:741af1701f01091c266c61` | Realtime DB (settings, smtp, sms, cartypes…), **Cloud Functions de pagos**, FCM/push, auth/storage legado | `google-services.json` (gitignored) · ⚠️ `GoogleService-Info.plist` está **versionado** en el repo |
| **Daviplata** (pasarela de pago) | `idComercio: "0010203040"` · backend en `us-central1-treasupdate.cloudfunctions.net` (`daviplata-oauthDaviplata`, `-buyTransactionDaviplata`, `-readOtpDaviplata`, `-confirmBuyDaviplata`) | Cobros con Daviplata | Cloud Functions del proyecto Firebase `treasupdate`; constantes en [constants/daviplata.constants.ts](../constants/daviplata.constants.ts) |
| **Topus** | API `https://topus.com.co/ApiRest/` (`request`, `stateRequest`) · `HISTORIC_USER_ID_PROCESS = 38` | Verificación de identidad documental | `TOKEN_BUSSINESS` en [config/keys.ts](../config/keys.ts) ⚠️ (hardcodeado en el repo — mover a `.env`) |
| **Google Cloud Vision** | Proyecto Google `212923549236` | OCR de documentos | microservicio [common/vision-backend/](../common/vision-backend/) |
| **Google Maps / Directions** | Proyecto Google `212923549236` | Mapas, rutas, geocoding | `GOOGLE_MAPS_API_KEY_ANDROID` / `_IOS` / `_DEV` / `_PROD` en `.env` |
| **Google Sign-In (OAuth)** | iOS `212923549236-fdfsd...apps.googleusercontent.com` · Android `212923549236-37eptr...apps.googleusercontent.com` | Login con Google | `GoogleService-Info.plist` |
| **Mapbox** | Cuenta Mapbox (token de acceso) | Render de mapas RN (`@rnmapbox/maps`) | `MAPBOX_ACCESS_TOKEN`, `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` en `.env` |
| **Agora** | App ID `e7f6e9aeecf14b2ba10e3f40be9f56e7` | Llamadas voz/video | App ID embebido; `AGORA_APP_CERTIFICATE` en `.env`; token vía edge function `generateAgoraToken` |
| **Expo / EAS** | Owner `tmasplus_cto` · slug `tmasplus` · projectId `16f8e33a-1dda-48f1-84a6-eeb3c8c5c51f` | Build, OTA updates, push | Cuenta Expo (login `eas`) |
| **Sentry** | Org/proyecto Sentry | Monitoreo de errores | DSN en configuración de `@sentry/react-native` |
| **App stores** | Android `com.tmasplus.tmasplus` · iOS `tmasplus.tmasplus` | Publicación | EAS / cuentas de las tiendas |

### 12.3 ⚠️ Inconsistencias detectadas (deuda técnica)

- **Firebase pertenece a otro proyecto/plantilla:** el proyecto Firebase es **`treasupdate`**
  y `GoogleService-Info.plist` declara `BUNDLE_ID = com.treasapp.treas24`, que **no coincide**
  con los identificadores reales de TmasPlus (`com.tmasplus.tmasplus` / `tmasplus.tmasplus`).
  Es un resto de la plantilla base "treas". El backend de pagos Daviplata sigue viviendo ahí.
- **Owner/identificadores divergentes entre `.env` y `app.config.js`:** `.env` define
  `EXPO_OWNER=tmasplus_cto` y `APP_IDENTIFIER=com.tmasplus.tmasplus`, mientras
  [app.config.js](../app.config.js) usa fallbacks `tmasplus` y `com.releaseunocero`.
- **Secretos en el repositorio:** `TOKEN_BUSSINESS` de Topus está hardcodeado en
  [config/keys.ts](../config/keys.ts) y `GoogleService-Info.plist` está versionado
  (a diferencia de `google-services.json`, que sí está en `.gitignore`). Conviene mover
  el token a `.env` e ignorar el plist.
- **Doble camino de correo** (Supabase + Firebase) — ver §12.1.

---

## 13. Documentación relacionada

- 🖥️ [Guía del Frontend y onboarding](./FRONTEND.md) — estructura, mapa de rutas y por dónde empezar
- 🔌 [Endpoints y consultas a Supabase](./ENDPOINTS_Y_CONSULTAS.md) — REST/Edge/RPC y consultas SQL útiles
- 📁 [Referencia de API generada (TypeDoc)](./api/README.md) — `npm run docs`
- 📮 [Postman / REST API](./POSTMAN_REST_API.md)
- 📂 `../../documentacion/` y los múltiples `*.md` en la raíz de `App/` contienen guías
  históricas de features (OTP, notificaciones, mapa, tracking, etc.).
