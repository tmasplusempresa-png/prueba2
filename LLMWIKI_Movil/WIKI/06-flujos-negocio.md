# Flujos de negocio

> Secuencias críticas cliente↔conductor↔backend. Cada flujo enlaza pantallas,
> servicios y tablas.

---
tags: [flujo, negocio]
entidades: [bookings, OtpService, Agora, Daviplata, referrals]
---

## 1. Autenticación y registro

```
PreLogin → LoginScreen / register-driver → EmailVerification → AuthLoadingScreen
```

- Sesión Supabase persistida (`config/SupabaseConfig.ts`, `react-native-persistance.js`).
- Conductor: validación de identidad **Topus** + carga de documentos OCR
  (Google Cloud Vision via `common/vision-backend/`).
- Web: registro multi-step con recuperación de progreso (mini-sesión) — ver `04-app-web-dashboard` (ver LLMWIKITmasPlus/ raíz del workspace, no existe en esta copia).

## 2. Reserva de viaje (inmediato vs programado)

1. Cliente elige origen/destino → `app/(tabs)/CustomerMap.tsx`.
2. UI de creación → `CreateReservationScreen.tsx`.
3. Cálculo de tarifa → `common/actions/FareCalculator.tsx`.
4. Persistencia → `common/actions/saveBooking.ts`.
5. Campo discriminador: `booking_type` / `booking_mode` (inmediato | programado).

## 3. Asignación y tracking en tiempo real

1. Conductor recibe solicitudes vía `BookingRealtimeService` (canal Realtime por ciudad).
2. Al aceptar, ubicación se publica en `booking_tracking` por la background
   task `driverLocationTask` (TaskManager).
3. Cliente observa con `useBookingDriverPosition` / `useDriverTracking`.
4. Marker animado con `useAnimatedDriverMarker` (interpolación).
5. **Tracking por placa** alternativo: `app/Booking/PlateTrackingScreen.tsx`.

## 4. OTP de inicio de viaje

1. Cliente recibe / entrega OTP de 4 dígitos generado por `OtpService`.
2. Conductor lo valida en `DriverOtpVerificationModal` con `useOtpTimer`
   (timer persistente).
3. Estado del viaje: `ACCEPTED → ARRIVED → STARTED → …`

Más detalle en guías históricas: `App/OTP_SYSTEM_README.md`, `App/OTP_DEBUG_COMPLETE_FLOW.md`, `App/OTP_TIMER_PERSISTENT_GUIDE.md`.

## 5. Pago al finalizar

- **Daviplata** — `app/Daviplata/Daviplata.tsx` + `components/DaviplataPayment/`.
  Constantes en `constants/daviplata.constants.ts`. Cobro real ejecutado por
  Cloud Functions Firebase `treasupdate` (`daviplata-oauthDaviplata`,
  `-buyTransactionDaviplata`, `-readOtpDaviplata`, `-confirmBuyDaviplata`).
- **Billetera interna** — `app/(tabs)/WalletDetails.tsx`, slice `wallet`.

## 6. Membresías y referidos

- Pantallas: `app/Subscription/{ChosePlan,Memberships,SubscriptionScreen}`.
- Servicios: `membershipsService` (móvil), `memberships.service.ts` (web).
- Referidos: `referralsService` + SQL `create-referral-system-app.sql` + spec
  en `TmasPlus_webSite/docs/REFERIDOS_SPEC.md`.

## 7. Comunicación durante el viaje

- Llamadas voz/video — Agora: `useAgoraCall`, `AgoraCallModal`, `IncomingCallModal`.
  Token emitido por Edge Function `generateAgoraToken`. Push de llamada
  entrante por `notifyIncomingCall`.
- Chat — `chatService` con polling REST, pantalla `OnlineChat.tsx`.

## 8. Seguridad / familia

- Compartir viaje con contactos: `common/utils/tripShare.ts`.
- Contactos de respaldo: `Myfamily.tsx`, `SecurityContactScreen.tsx`.

## 9. Flujos exclusivos del dashboard web

- **Aprobación de conductor** — admin valida documentos y marca `approved: true`.
- **Reserva corporativa** — `AddBooking` crea reservas para clientes corporativos.
- **Gestión de contratos / billing / peajes** — solo desde web.
- **Cambio de turno** (`ShiftChanger`) — admin reasigna turnos a conductores.

## Fuentes
- `App/documentacion/ARQUITECTURA.md` §7
- `App/documentacion/FLUJOS_SISTEMA.md`
- `App/RESERVAS_VS_INMEDIATOS.md`
- `App/REAL_TIME_TRACKING_SETUP.md`
- `App/IMPLEMENTACION_INMEDIATO_PROGRAMADO.md`
- `TmasPlus_webSite/docs/WORKFLOWS.md`
- `TmasPlus_webSite/docs/REFERIDOS_SPEC.md`
