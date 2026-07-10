# REST endpoints, RPC y Edge Functions

> Catálogo plano de cómo la app habla con Supabase. Para esquema completo de
> cada tabla ver páginas [[17-esquema-bookings]], [[18-esquema-users-rls]],
> [[19-esquema-memberships]].

---
tags: [backend, supabase, rest, rpc, edge]
entidades: [PostgREST, Edge Functions]
---

## Headers comunes

```
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <ANON_KEY>          # lecturas públicas
Authorization: Bearer <USER_ACCESS_TOKEN> # escrituras que pasan por RLS
Content-Type: application/json
```

Token de usuario vive en AsyncStorage `tmasplus_auth_session` o se obtiene con
`POST /auth/v1/token?grant_type=password`. Helper en
`App/config/SupabaseConfig.ts → getSupabaseAuthHeaders(useUserJwt)`.

## Tabla — Endpoints REST principales

| # | Método | Path | Uso |
|---|--------|------|-----|
| 0 | POST | `/auth/v1/token?grant_type=password` | Login → `access_token` |
| 1 | GET | `/rest/v1/users?or=(auth_id.eq.{id},id.eq.{id})&limit=1` | Perfil completo |
| 2 | PATCH | `/rest/v1/users?auth_id=eq.{id}` | Actualizar perfil |
| 3 | GET | `/rest/v1/users?...&select=id` | Resolver `driver_id` (UUID) |
| 4 | POST | `/rest/v1/cars` | Crear vehículo (Prefer: return=representation) |
| 5 | GET | `/rest/v1/cars?driver_id=eq.{id}&plate=eq.ABC123` | Buscar por placa |
| 6 | POST | `/storage/v1/object/vehicle-images/{CAR_ID}/car_image.jpg` | Subir imagen |
| 7 | PATCH | `/rest/v1/cars?id=eq.{CAR_ID}` | Asociar imagen al vehículo |
| 8 | PATCH | `/rest/v1/bookings?id=eq.{id}` | Set OTP, estado, etc. (ver [[11-servicio-otp]]) |
| 9 | GET | `/rest/v1/memberships?conductor=eq.{id}&order=created_at.desc` | Ver [[14-servicio-memberships]] |
| 10 | POST | `/rest/v1/booking_tracking` | Publicar punto (driver JWT) |

PostgREST patrón: `?columna=eq.valor`, `&select=a,b`, `&order=created_at.desc`,
`&limit=N`. Insert con header `Prefer: return=representation` para recibir la
fila creada.

## RPC en `/rest/v1/rpc/<fn>`

| RPC | Params | Hace |
|-----|--------|------|
| `check_email_exists` | `check_email text` | Bool — usado en registro previo a signUp |
| `get_my_memberships` | `conductor_id uuid` | Membresías del conductor (bypassa RLS) |
| `get_customer_recent_trips` | `p_user_id text` | Últimos viajes del cliente |
| `get_active_booking_by_plate` | `p_plate text` | Reserva activa por placa (tracking) |
| `search_immediate_bookings` | filtros (ciudad/ubicación) | Búsqueda de viajes inmediatos disponibles |
| `get_favorite_count` | `p_user_id uuid` | Conteo favoritos |
| `generate_referral_code` / `ensure_referral_code` | `p_name` / `p_user_id` | Código de referido |
| `cancel_expired_booking_requests` | — | Limpia solicitudes expiradas |

Llamada:
```bash
curl -X POST "{SUPABASE_URL}/rest/v1/rpc/check_email_exists" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"check_email":"test@correo.com"}'
```

## Triggers (no se llaman a mano)

| Trigger | Tabla | Qué hace |
|---------|-------|----------|
| `handle_new_user` | `auth.users` (signup) | Crea fila en `public.users` |
| `crear_membresia_al_registrarse` | `users` (insert driver) | Inserta `memberships` PENDIENTE 30 días |
| `generate_booking_reference` | `bookings` BEFORE INSERT | Genera código `reference` 6 chars |
| `calculate_total_cost` | `bookings` BEFORE INSERT/UPDATE | `total_cost = trip_cost + convenience_fees - discount` |
| `notify_new_booking` | `bookings` AFTER INSERT | `pg_notify('new_booking', ...)` |
| `fill_vehicle_info_on_driver_assign` | `bookings` | Llena `car_model`, `plate_number`, etc. al asignar driver |
| `update_bookings_updated_at` | `bookings` BEFORE UPDATE | Refresca `updated_at` |
| `update_users_updated_at` | `users` BEFORE UPDATE | Idem |

## Edge Functions — `/functions/v1/<fn>`

| Función | Body | Hace |
|---------|------|------|
| `generateAgoraToken` | `{ channelName, uid }` | Devuelve token RTC firmado con `AGORA_APP_CERTIFICATE` |
| `notifyIncomingCall` | `{ toUserId, fromUser, channel, ... }` | Service role; push de llamada entrante |
| `sync-driver-to-primary` | Datos del conductor | Sincroniza driver a BD primaria |

## Backends externos

- **Daviplata** (Cloud Functions Firebase):
  `https://us-central1-treasupdate.cloudfunctions.net/daviplata-{oauthDaviplata|buyTransactionDaviplata|readOtpDaviplata|confirmBuyDaviplata}`.
- **Topus**: `https://topus.com.co/ApiRest/{request,stateRequest}`.

## Realtime channels

Tres canales activos — ver detalle en [[20-realtime-channels]].

## Fuentes
- `App/documentacion/ENDPOINTS_Y_CONSULTAS.md`
- `App/documentacion/POSTMAN_REST_API.md`
- `App/sql/bookings-schema.sql`
- `App/sql/check_email_exists.sql`, `rpc-get-recent-trips.sql`, `002_plate_tracking_rpc.sql`, `search-immediate-bookings.sql`
- `App/supabase/functions/*`
