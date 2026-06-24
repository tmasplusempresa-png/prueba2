# TmasPlus — Endpoints y consultas a Supabase

Referencia de **cómo la app habla con el backend**, los **endpoints** disponibles y las
**consultas más útiles que puedes ejecutar en Supabase**. Complementa la colección Postman
en [POSTMAN_REST_API.md](./POSTMAN_REST_API.md).

> Proyecto Supabase: `utofhxgzkdhljrixperh` · Base URL: `https://utofhxgzkdhljrixperh.supabase.co`

---

## 1. Capas de acceso a datos (cómo se comunica el front)

| Vía | Cuándo se usa | Dónde |
|-----|---------------|-------|
| **Supabase REST** (`/rest/v1/...`) con `fetch` + JWT | Lecturas/escrituras normales. Se prefiere a veces sobre el SDK porque en RN el SDK puede colgarse por el lock de auth | `getSupabaseAuthHeaders` en [config/SupabaseConfig.ts](../config/SupabaseConfig.ts); servicios en [common/services/](../common/services/) |
| **Supabase SDK** (`supabase.from(...)`, `supabase.auth`) | Auth (login, signUp, reset) y queries puntuales | [config/SupabaseConfig.ts](../config/SupabaseConfig.ts), [config/SupabaseAuth.ts](../config/SupabaseAuth.ts) |
| **Supabase Realtime** | Suscripción a nuevas reservas y cambios de booking | [common/services/BookingRealtimeService.ts](../common/services/BookingRealtimeService.ts) |
| **Supabase RPC** (`/rest/v1/rpc/<fn>`) | Lógica en BD (memberships, plate tracking, email check…) | ver §4 |
| **Edge Functions** (`/functions/v1/<fn>`) | Tokens Agora, push de llamadas, sync | [supabase/functions/](../supabase/functions/) |
| **Firebase RTDB / Cloud Functions** (legado) | Daviplata y datos heredados | [config/configureFirebase.tsx](../config/configureFirebase.tsx), [common/actions/api.ts](../common/actions/api.ts) |
| **Topus** (externo) | Verificación de identidad | [common/topus-integration/](../common/topus-integration/) |

### Headers comunes (REST)
```
apikey: <SUPABASE_ANON_KEY>
Authorization: Bearer <ANON_KEY>            # lecturas públicas
Authorization: Bearer <USER_ACCESS_TOKEN>   # escrituras que pasan por RLS
Content-Type: application/json
```
El `USER_ACCESS_TOKEN` se obtiene de AsyncStorage (`tmasplus_auth_session`) o vía login
(`POST /auth/v1/token?grant_type=password`). Ver POSTMAN §0.

---

## 2. Endpoints REST de Supabase (resumen)

Documentados al detalle (body + respuesta) en [POSTMAN_REST_API.md](./POSTMAN_REST_API.md):

| # | Método | Endpoint | Para qué |
|---|--------|----------|----------|
| 0 | POST | `/auth/v1/token?grant_type=password` | Login → access_token |
| 1 | GET | `/rest/v1/users?or=(auth_id.eq.{id},id.eq.{id})&limit=1` | Perfil completo |
| 4 | PATCH | `/rest/v1/users?auth_id=eq.{id}` | Actualizar datos personales |
| 5 | GET | `/rest/v1/users?...&select=id` | Resolver `driver_id` (UUID) |
| 6 | POST | `/rest/v1/cars` | Crear vehículo |
| 7 | GET | `/rest/v1/cars?driver_id=eq.{id}&plate=eq.ABC123` | Buscar vehículo por placa |
| 8 | POST | `/storage/v1/object/vehicle-images/{CAR_ID}/car_image.jpg` | Subir imagen (Storage) |
| 9 | PATCH | `/rest/v1/cars?id=eq.{CAR_ID}` | Asociar imagen al vehículo |

Patrón general PostgREST: filtros `?columna=eq.valor`, selección `&select=a,b,c`, orden
`&order=created_at.desc`, límite `&limit=N`. Insert: `POST /rest/v1/<tabla>` con header
`Prefer: return=representation`.

---

## 3. Edge Functions (`/functions/v1/...`)

Código en [supabase/functions/](../supabase/functions/). Se invocan con
`Authorization: Bearer <ANON_KEY>` (POST, body JSON).

| Función | Método | Body | Devuelve / hace |
|---------|--------|------|-----------------|
| [`generateAgoraToken`](../supabase/functions/generateAgoraToken/index.ts) | POST | `{ channelName, uid }` | Token RTC de Agora para unirse a un canal de llamada |
| [`notifyIncomingCall`](../supabase/functions/notifyIncomingCall/index.ts) | POST | `{ toUserId, fromUser, channel, ... }` | Envía push de llamada entrante (usa service role) |
| [`sync-driver-to-primary`](../supabase/functions/sync-driver-to-primary/index.ts) | POST | datos del conductor | Sincroniza el conductor a una BD Supabase primaria |

Ejemplo:
```bash
curl -X POST "https://utofhxgzkdhljrixperh.supabase.co/functions/v1/generateAgoraToken" \
  -H "Authorization: Bearer $ANON_KEY" -H "Content-Type: application/json" \
  -d '{"channelName":"booking_123","uid":1}'
```

### Otros backends
- **Daviplata** (Cloud Functions de Firebase, proyecto `treasupdate`):
  `https://us-central1-treasupdate.cloudfunctions.net/daviplata-{oauthDaviplata|buyTransactionDaviplata|readOtpDaviplata|confirmBuyDaviplata}` — flujo en
  [app/Daviplata/Daviplata.tsx](../app/Daviplata/Daviplata.tsx).
- **Topus**: `https://topus.com.co/ApiRest/request` y `/ApiRest/stateRequest`
  ([common/topus-integration/](../common/topus-integration/)).

---

## 4. Funciones RPC en la base de datos

Definidas en [sql/](../sql/). Se llaman con `POST /rest/v1/rpc/<nombre>` (body = params) o
`supabase.rpc('<nombre>', { ...params })`.

| RPC | Parámetros | Qué hace |
|-----|-----------|----------|
| `check_email_exists` | `check_email text` | ¿Existe ese correo? (registro) |
| `get_my_memberships` | `conductor_id uuid` | Membresías del conductor (evita RLS) |
| `get_customer_recent_trips` | `p_user_id text` | Viajes recientes del cliente |
| `get_active_booking_by_plate` | `p_plate text` | Reserva activa por placa (tracking) |
| `search_immediate_bookings` | filtros (ciudad/ubicación) | Buscar viajes inmediatos disponibles |
| `get_favorite_count` | `p_user_id uuid` | Nº de lugares favoritos |
| `generate_referral_code` / `ensure_referral_code` | `p_name` / `p_user_id` | Código de referido |
| `cancel_expired_booking_requests` | — | Limpia solicitudes expiradas |

Triggers automáticos (no se llaman a mano): `handle_new_user` (crea fila en `users` al
registrarse), `crear_membresia_al_registrarse`, `generate_booking_reference`,
`calculate_total_cost`, `notify_new_booking`, `fill_vehicle_info_on_driver_assign`.

Ejemplo de llamada RPC:
```bash
curl -X POST "https://utofhxgzkdhljrixperh.supabase.co/rest/v1/rpc/check_email_exists" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" -d '{"check_email":"test@correo.com"}'
```

---

## 5. Tablas y columnas clave

(Tipos en [config/database.types.ts](../config/database.types.ts).)

- **`users`** — `id, auth_id, email, first_name, last_name, mobile, user_type, wallet_balance,
  rating, is_verified, approved, blocked, referral_id, referred_by_code, document_type,
  document_number, city, driver_active_status, license_*, push_token, created_at`
- **`cars`** — `id, driver_id, make, model, year, color, plate, car_image, capacity,
  is_active, created_at`
- **`car_types`** — tarifas: `base_price, price_per_km, rate_per_hour, min_fare,
  delta_aeropuerto, convenience_fee, umbral_intermunicipal_km`
- **`bookings`** — `id, customer_id, driver_id, car_type_id, car_id, status,
  pickup_location, destination_location, distance, duration, price, trip_start_time,
  trip_end_time, payment_mode, rating, reason, cancelled_by, reference, created_at`
- **`tracking`** / `booking_tracking` — `booking_id, status, latitude, longitude,
  timestamp_ms`
- **`wallet_history`** — `user_id, type, amount, balance, description, booking_id`
- **`notifications`** — `user_id, title, message, type, is_read, data, booking_id`
- **`user_ratings`** — `user_id, rated_by, booking_id, rate, comment`
- **`saved_addresses`** — `user_id, name, address, latitude, longitude, is_default`
- **`promos`**, **`memberships`**, **`chat_messages`**, **`complaints`**

---

## 6. Consultas más importantes (SQL Editor de Supabase)

> Pégalas en **Supabase → SQL Editor**. Las de lectura son seguras; las marcadas con ⚠️
> **modifican datos** — revisa el `WHERE` antes de ejecutar.

### Usuarios y conductores
```sql
-- Perfil por correo
select id, auth_id, first_name, last_name, mobile, user_type, approved, blocked
from users where email = 'correo@ejemplo.com';

-- Conductores activos y verificados
select id, first_name, last_name, city, rating, driver_active_status
from users
where user_type = 'driver' and approved = true and blocked = false
order by rating desc nulls last;

-- Conductores pendientes de aprobar
select id, first_name, last_name, document_number, created_at
from users where user_type = 'driver' and approved = false;
```

### Reservas / viajes
```sql
-- Últimas reservas
select id, reference, status, customer_id, driver_id, price, created_at
from bookings order by created_at desc limit 50;

-- Reservas por estado (NEW, ACCEPTED, ARRIVED, STARTED, COMPLETED, CANCELLED)
select status, count(*) from bookings group by status order by 2 desc;

-- Viajes activos ahora mismo
select id, reference, status, customer_id, driver_id, created_at
from bookings
where status in ('ACCEPTED','ARRIVED','STARTED')
order by created_at desc;

-- Detalle de un viaje
select * from bookings where id = '<BOOKING_ID>';

-- Tracking (ruta) de un viaje
select latitude, longitude, status, timestamp_ms
from tracking where booking_id = '<BOOKING_ID>' order by timestamp_ms;
```

### Billetera y pagos
```sql
-- Saldo de un usuario
select wallet_balance from users where id = '<USER_ID>';

-- Movimientos de billetera
select type, amount, balance, description, created_at
from wallet_history where user_id = '<USER_ID>' order by created_at desc;
```

### Membresías, ratings y vehículos
```sql
-- Membresías activas
select * from memberships where is_active = true;

-- Calificaciones de un usuario y promedio
select round(avg(rate),2) as promedio, count(*) as total
from user_ratings where user_id = '<USER_ID>';

-- Vehículos de un conductor
select id, plate, make, model, color, is_active
from cars where driver_id = '<DRIVER_ID>';
```

### Operación / soporte
```sql
-- Notificaciones sin leer de un usuario
select title, message, type, created_at
from notifications where user_id = '<USER_ID>' and is_read = false
order by created_at desc;

-- Quejas recientes
select id, user_id, created_at from complaints order by created_at desc limit 30;

-- Métrica: viajes completados por día (últimos 14)
select date(created_at) as dia, count(*)
from bookings where status = 'COMPLETED' and created_at > now() - interval '14 days'
group by 1 order by 1 desc;
```

### Acciones administrativas ⚠️ (modifican datos)
```sql
-- ⚠️ Aprobar un conductor
update users set approved = true where id = '<DRIVER_ID>';

-- ⚠️ Bloquear / desbloquear usuario
update users set blocked = true  where id = '<USER_ID>';

-- ⚠️ Ajustar saldo de billetera
update users set wallet_balance = wallet_balance + 10000 where id = '<USER_ID>';
```

---

## 7. Notas de seguridad (RLS)

- Las tablas tienen **Row Level Security**. Las escrituras desde la app deben ir con el
  **JWT del usuario** (no el anon key) o fallarán. Scripts de políticas en
  [sql/](../sql/): `create-users-table-with-rls.sql`, `rls-driver-new-bookings.sql`,
  `cleanup-rls-policies.sql`, etc.
- El **service role key** salta RLS: úsalo solo en backend/Edge Functions, **nunca** en
  el cliente.
- En el SQL Editor de Supabase corres como `postgres` (omite RLS) — por eso las consultas
  de arriba funcionan ahí aunque la app tenga RLS.
