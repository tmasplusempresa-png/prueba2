# Backend — Supabase

> Proyecto `utofhxgzkdhljrixperh` en `https://utofhxgzkdhljrixperh.supabase.co`.
> Backend principal compartido por [[03-app-movil]] y `04-app-web-dashboard` (ver LLMWIKITmasPlus/ raíz del workspace, no existe en esta copia).

---
tags: [backend, supabase, postgres, rls]
entidades: [Supabase, Postgres, Edge Functions]
---

## Servicios usados

- **Auth** — sesión, perfiles, email de verificación y reset.
- **Postgres** — esquema principal de negocio (ver [[07-entidades-bd]]).
- **Storage** — perfiles, documentos, imágenes de vehículo, media de reservas.
- **Realtime** — canales por ciudad para `bookings`; cambios de reserva específica.
- **Edge Functions** — lógica de servidor en Deno.

## Configuración por plataforma

### Móvil
- `App/config/SupabaseConfig.ts` — cliente + headers JWT + manejo de sesión.
- `App/config/SupabaseAuth.ts`, `SupabaseDatabase.ts`, `SupabaseStorage.ts`.
- `App/config/database.types.ts` — tipos generados.
- `App/config/react-native-persistance.js` — storage seguro de la sesión.

### Web
- `TmasPlus_webSite/src/config/supabase.ts`.
- `TmasPlus_webSite/src/config/database.types.ts` — incluye RPC `get_auth_profile`.

## Patrón fetch directo

En móvil, varios servicios (`membershipsService`, etc.) llaman REST de Supabase
con `getSupabaseAuthHeaders` en lugar del SDK, porque en RN el SDK puede
bloquearse por el lock de auth. La web sí usa el SDK.

## Edge Functions

Ubicación: `App/supabase/functions/` (móvil) y `TmasPlus_webSite/supabase/`
(web tiene utilidades adicionales).

| Función | Propósito |
|---------|-----------|
| `generateAgoraToken` | Emite token de canal Agora (voz/video) |
| `notifyIncomingCall` | Push de llamada entrante |
| `sync-driver-to-primary` | Sincronización del conductor a estado primario |

## SQL — `App/sql/` (53 scripts)

Categorías:

- **Esquema** — `create-users-table-with-rls.sql`, `bookings-schema.sql`,
  `storage-buckets-setup.sql`.
- **RLS policies** — por tabla. Hay un fix de RLS en cars en
  `AplicacionWebTmasplus/cars_rls_fix.sql`.
- **RPC** — `check_email_exists`, `get_memberships`, `get_auth_profile`, plate
  tracking, etc.
- **Seeds y setup OTP** — `EJECUTAR_PRIMERO_OTP_SETUP.sql`.
- **Sistema de referidos** — `create-referral-system-app.sql`.

Orden recomendado para bootstrap (móvil):
1. `EJECUTAR_PRIMERO_OTP_SETUP.sql`
2. `create-users-table-with-rls.sql`
3. `bookings-schema.sql`
4. `storage-buckets-setup.sql`

## Storage buckets

Ver `StorageConfiguration` en `App/config/AppConfig.ts`:

- Perfiles de usuario
- Documentos de usuario / vehículo / conductor
- Imágenes de vehículo
- Media adjunta a reservas

## RLS y RPC clave para la web

| RPC | Por qué existe |
|-----|----------------|
| `get_auth_profile` | Bypassa RLS al cargar perfil tras login admin/driver. Sin esta RPC el `AuthContext` queda en silencio fallido — ver `04-app-web-dashboard` (ver LLMWIKITmasPlus/ raíz del workspace, no existe en esta copia) §Autenticación. |
| `check_email_exists` | Validación previa al registro. |
| `get_memberships` | Lista membresías sin pelear con RLS desde el cliente. |

## Correo

Salida principal: **Supabase Auth** (mailer integrado o SMTP propio configurado
en el panel del proyecto, no en código). Camino legado: Firebase
`smtpdata` + `sendEmailVerification` (a retirar — ver [[10-deuda-tecnica]]).

Redirección post-verificación: `https://dashboard.tmasplus.com/welcome`
(`SUPABASE_EMAIL_REDIRECT_TO`).

## Fuentes
- `App/documentacion/ARQUITECTURA.md` §8
- `App/documentacion/ENDPOINTS_Y_CONSULTAS.md`
- `App/documentacion/POSTMAN_REST_API.md`
- `App/sql/*`
- `App/supabase/functions/*`
- `TmasPlus_webSite/docs/DATABASE_SCHEMA.md`
- `TmasPlus_webSite/cars_rls_fix.sql`
