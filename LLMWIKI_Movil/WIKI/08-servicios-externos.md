# Servicios externos

> Integraciones de terceros usadas por la plataforma. Detalle de cuentas y
> credenciales en [[09-cuentas-credenciales]].

---
tags: [externo, integracion]
entidades: [Mapbox, Agora, Daviplata, Topus, Vision, FCM, Sentry, EAS]
---

## Mapas

- **Mapbox** (`@rnmapbox/maps`) — render principal en RN.
- **Google Maps + Directions** — rutas, geocoding, autocompletado.
- **react-native-maps** — fallback / casos puntuales.
- **Leaflet** — render en dashboard web.

## Llamadas voz/video

- **Agora UIKit** (App ID `e7f6e9aeecf14b2ba10e3f40be9f56e7`).
- Token de canal emitido por Edge Function `generateAgoraToken`.
- Push de entrante por `notifyIncomingCall`.
- Wrapper móvil: `CallService` + hook `useAgoraCall`.

## Pagos

- **Daviplata** — pasarela colombiana. `idComercio: "0010203040"`.
- Backend de pagos: Cloud Functions Firebase del proyecto `treasupdate` en
  `us-central1-treasupdate.cloudfunctions.net`:
  - `daviplata-oauthDaviplata`
  - `daviplata-buyTransactionDaviplata`
  - `daviplata-readOtpDaviplata`
  - `daviplata-confirmBuyDaviplata`
- Constantes: `App/constants/daviplata.constants.ts`.

## Identidad / OCR

- **Topus** — verificación documental colombiana.
  - API: `https://topus.com.co/ApiRest/` (`request`, `stateRequest`).
  - `HISTORIC_USER_ID_PROCESS = 38`.
  - Integración: `App/common/topus-integration/`.
- **Google Cloud Vision** — OCR de documentos. Microservicio en
  `App/common/vision-backend/`.

## Notificaciones / Push

- **Expo Notifications** (móvil).
- **Firebase Cloud Messaging** — push transversal (proyecto `treasupdate`).
- Edge Function `notifyIncomingCall` para llamadas entrantes.

## Build / OTA

- **EAS Build** — Android e iOS (owner `tmasplus_cto`, slug `tmasplus`,
  projectId `16f8e33a-1dda-48f1-84a6-eeb3c8c5c51f`).
- **Expo Updates** — OTA con runtime version `EXPO_RUNTIME_VERSION`.

## Hosting web

- **Vercel** — dashboard. Config `TmasPlus_webSite/vercel.json`.

## Observabilidad

- **Sentry** (`@sentry/react-native`) — móvil. DSN en config.

## Login social

- **Google Sign-In (OAuth)** — clientes:
  - iOS `212923549236-fdfsd...apps.googleusercontent.com`
  - Android `212923549236-37eptr...apps.googleusercontent.com`

## Email

- Salida principal: **Supabase Auth** (SMTP del panel del proyecto).
- Camino legado: Firebase `smtpdata` + `sendEmailVerification` — a retirar.
- Automatización adicional documentada en `TmasPlus_webSite/docs/RESEND_AUTOMATION.md` (Resend).

## Fuentes
- `App/documentacion/ARQUITECTURA.md` §12
- `App/config/configureFirebase.tsx`
- `App/constants/daviplata.constants.ts`
- `App/config/keys.ts`
- `App/common/topus-integration/`
- `App/common/vision-backend/`
- `TmasPlus_webSite/docs/RESEND_AUTOMATION.md`
