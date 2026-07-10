# Esquema `users` + RLS

> Tabla principal de perfiles. Enlaza con `auth.users` por `auth_id`.
> RLS reescrito varias veces — versión vigente en `create-users-table-with-rls.sql`.

---
tags: [bd, esquema, users, rls]
entidades: [users, auth.users]
---

## Columnas base (`create-users-table-with-rls.sql`)

| Columna | Tipo | Notas |
|---------|------|-------|
| `id` | `UUID PK` | `gen_random_uuid()` |
| `auth_id` | `UUID FK → auth.users(id) ON DELETE CASCADE` | Enlace con Auth |
| `email` | `VARCHAR(255) UNIQUE NOT NULL` | Constraint `valid_email` regex |
| `first_name`, `last_name` | `VARCHAR(100)` | |
| `mobile` | `VARCHAR(20)` | |
| `user_type` | `VARCHAR(50) CHECK (... IN ('customer','driver','company','admin')) DEFAULT 'customer'` | |
| `car_type`, `car_image`, `vehicle_number`, `vehicle_make` | varios | Históricos en `users` — duplicados con `cars` |
| `company_name` | `VARCHAR(255)` | |
| `profile_image` | `TEXT` | |
| `rating` | `DECIMAL(3,2)` | |
| `total_trips` | `INTEGER DEFAULT 0` | |
| `total_earnings` | `DECIMAL(10,2) DEFAULT 0` | |
| `is_active` | `BOOLEAN DEFAULT true` | |
| `verified` | `BOOLEAN DEFAULT false` | |
| `created_at`, `updated_at` | `TIMESTAMPTZ` | trigger `update_users_updated_at` |

## Columnas añadidas por scripts incrementales

| Origen | Columnas |
|--------|----------|
| `add-document-and-referral-columns.sql` | `document_type`, `document_number`, `referral_id`, `referred_by_code` |
| `add-document-image-columns.sql` | `*_image` para anverso/reverso de docs |
| `add-city-column-users.sql` | `city` |
| Histórico (mencionado en doc) | `wallet_balance`, `is_verified`, `approved`, `blocked`, `driver_active_status`, `license_*`, `push_token` |

⚠️ Doc `ARQUITECTURA.md` lista `approved` y `blocked`, pero el script base
crea `is_active` y `verified`. Algunos scripts añaden `approved`/`blocked`
(usados por la web `AuthContext`). Convivencia confusa — ver [[10-deuda-tecnica]].

## `user_type` — valores reales

```
customer | driver | company | admin
```

⚠️ Doc móvil habla solo de "cliente / conductor / admin". El schema acepta
`company` también — usado por reservas corporativas creadas en web `AddBooking`.

## Índices

```
idx_users_auth_id, idx_users_email, idx_users_user_type, idx_users_is_active
```

## RLS — versión vigente

7 políticas limpias (script al final crea desde `rls_users_select_own`
hasta `rls_users_delete_admin`). Patrón:

| # | Operación | Quién | Condición |
|---|-----------|-------|-----------|
| P1 | SELECT | dueño | `auth_id = auth.uid()` |
| P2 | SELECT | admin | `EXISTS (SELECT 1 FROM users WHERE auth_id=auth.uid() AND user_type='admin')` |
| P3 | UPDATE | dueño | `auth_id = auth.uid()` |
| P4 | UPDATE | admin | rol admin |
| P5 | INSERT | autenticado | `auth_id = auth.uid()` |
| P6 | INSERT | admin | rol admin |
| P7 | DELETE | admin | rol admin |

(Los nombres exactos en el SQL son `rls_users_*` — script dropea ~20 políticas
heredadas antes de crear estas 7.)

## Trigger `handle_new_user`

Definido en `user-registration-setup.sql`. AFTER INSERT en `auth.users`
inserta fila base en `public.users` con `auth_id`, `email`, defaults.

## Vinculación con otras tablas

- `bookings.customer / bookings.driver` → `users.id` (no `auth.users.id`).
- `cars.driver_id` → `users.id`.
- `wallet_history.user_id` → `users.id`.
- `memberships.conductor` → **`auth.users.id`** ⚠️ — inconsistente.

Ver [[14-servicio-memberships]] §FK.

## RPC `get_auth_profile` (web)

Vive como bypass al RLS para devolver el perfil al `AuthContext` web sin pelea.
Equivale a `SELECT * FROM users WHERE auth_id = auth.uid() LIMIT 1` ejecutado
con SECURITY DEFINER.

## Fuentes
- `App/sql/create-users-table-with-rls.sql`
- `App/sql/cleanup-rls-policies.sql`
- `App/sql/fix-rls-users-debug.sql`
- `App/sql/user-registration-setup.sql`
- `App/sql/add-document-and-referral-columns.sql`
- `App/sql/add-document-image-columns.sql`
- `App/sql/add-city-column-users.sql`
- `App/sql/approve-driver-andresfelipecristancho2014.sql`
