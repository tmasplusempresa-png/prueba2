# Cuentas y credenciales

> Inventario de **dónde vive** cada secreto. No reproducimos claves aquí —
> solo apuntamos al archivo / panel donde residen.

---
tags: [credencial, cuenta, seguridad]
entidades: [Supabase, Firebase, Daviplata, Topus, Agora, EAS, Sentry]
---

| Servicio | Cuenta / Identificador | Uso | Dónde está la credencial |
|----------|------------------------|-----|--------------------------|
| **Supabase** | Proyecto `utofhxgzkdhljrixperh` · `https://utofhxgzkdhljrixperh.supabase.co` | Auth, Postgres, Storage, Realtime, Edge Functions, correo | `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` en `.env` (móvil); `VITE_SUPABASE_ANON_KEY` en `.env.local` (web) |
| **Firebase / Google Cloud** | Proyecto `treasupdate` · bucket `treasupdate.appspot.com` · Sender ID `212923549236` · App ID `1:212923549236:ios:741af1701f01091c266c61` | Realtime DB legado, **Cloud Functions Daviplata**, FCM, storage/auth legado | `google-services.json` (gitignored) · ⚠️ `GoogleService-Info.plist` está versionado |
| **Daviplata** | `idComercio: "0010203040"` · `us-central1-treasupdate.cloudfunctions.net` | Cobros | Cloud Functions del proyecto Firebase `treasupdate`; constantes en `App/constants/daviplata.constants.ts` |
| **Topus** | `https://topus.com.co/ApiRest/` · `HISTORIC_USER_ID_PROCESS = 38` | Verificación de identidad | ⚠️ `TOKEN_BUSSINESS` hardcodeado en `App/config/keys.ts` — mover a `.env` |
| **Google Cloud Vision** | Proyecto Google `212923549236` | OCR | `App/common/vision-backend/` |
| **Google Maps / Directions** | Proyecto Google `212923549236` | Mapas, rutas, geocoding | `GOOGLE_MAPS_API_KEY_ANDROID` / `_IOS` / `_DEV` / `_PROD` en `.env` |
| **Google Sign-In** | iOS y Android client IDs `212923549236-...` | Login con Google | `GoogleService-Info.plist` |
| **Mapbox** | Cuenta Mapbox | Render mapas RN | `MAPBOX_ACCESS_TOKEN`, `RNMAPBOX_MAPS_DOWNLOAD_TOKEN` en `.env` |
| **Agora** | App ID `e7f6e9aeecf14b2ba10e3f40be9f56e7` | Llamadas voz/video | App ID embebido; `AGORA_APP_CERTIFICATE` en `.env`; token vía Edge `generateAgoraToken` |
| **Expo / EAS** | Owner `tmasplus_cto` · slug `tmasplus` · projectId `16f8e33a-1dda-48f1-84a6-eeb3c8c5c51f` | Build, OTA, push | Cuenta Expo (login `eas`) |
| **Sentry** | Org/proyecto Sentry T+Plus | Errores | DSN en config `@sentry/react-native` |
| **Vercel** | Cuenta T+Plus | Hosting dashboard web | `vercel.json` + dashboard Vercel |
| **App stores** | Android `com.tmasplus.tmasplus` · iOS `tmasplus.tmasplus` | Publicación | EAS + cuentas de las tiendas |

## Variables clave por entorno

### Móvil (`.env` consumido por `app.config.js`)

- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_MAPS_API_KEY_ANDROID` / `_IOS` / `_DEV` / `_PROD`
- `MAPBOX_ACCESS_TOKEN`, `RNMAPBOX_MAPS_DOWNLOAD_TOKEN`
- `APP_IDENTIFIER`, `EXPO_PROJECT_ID`, `EXPO_OWNER`
- `APP_VERSION`, `EXPO_RUNTIME_VERSION`, `ANDROID_APP_VERSION`
- `AGORA_APP_CERTIFICATE`
- `SUPABASE_EMAIL_REDIRECT_TO=https://dashboard.tmasplus.com/welcome`

### Web (`.env.local`)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_VERSION`
- `VITE_NODE_ENV`
- `VITE_POLLING_INTERVAL=5000`

## Reglas duras

- 🔐 **No commitear** `.env`, `.env.local`, `google-services.json`, ni claves reales.
- ⚠️ `GoogleService-Info.plist` **está** versionado actualmente — ver [[10-deuda-tecnica]].
- ⚠️ `TOKEN_BUSSINESS` de Topus **está** hardcodeado — mover a `.env`.

## Fuentes
- `App/documentacion/ARQUITECTURA.md` §12.2–§12.3
- `App/app.config.js`
- `App/config/AppConfig.ts`
- `App/config/keys.ts`
- `TmasPlus_webSite/.env.example`
- `TmasPlus_webSite/README.md` §Variables de Entorno
