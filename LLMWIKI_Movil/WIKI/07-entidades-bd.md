# Entidades de base de datos

> Tablas clave del esquema Postgres. Detalle de columnas vive en los `.sql` de
> `App/sql/` y en `database.types.ts` (móvil y web).

---
tags: [entidad, bd, postgres]
entidades: [users, bookings, cars, wallet_history, memberships]
---

## Tablas centrales

| Tabla | Función |
|-------|---------|
| `users` | Perfil unificado. `user_type` ∈ {`client`, `driver`, `admin`}; flags `approved`, `blocked`. `auth_id` enlaza a Supabase Auth. |
| `cars` | Vehículos. Placa única. Asociados a un conductor. |
| `car_types` | Categorías de vehículo (afecta tarifa). |
| `bookings` | Reservas/viajes. Campos: `booking_type` / `booking_mode` (inmediato vs programado), estado (`ACCEPTED → ARRIVED → STARTED → ...`). |
| `tracking` / `booking_tracking` | Última ubicación del conductor publicada en background. |
| `wallet_history` | Movimientos de la billetera interna. |
| `notifications` | Notificaciones in-app. |
| `user_ratings` | Calificaciones cliente↔conductor. |
| `saved_addresses` | Direcciones favoritas del cliente. |
| `promos` | Promociones / códigos. |
| `memberships` | Planes activos del usuario. |
| `chat_messages` | Mensajería cliente↔conductor. |
| `complaints` | PQR. |

## Tablas auxiliares mencionadas

- Sistema de referidos: tablas creadas por `create-referral-system-app.sql` (referrer/referido + conteo).
- Precios programados: `SQL_SETUP_SCHEDULED_PRICES.sql`.

## RPC clave

| RPC | Llamado desde |
|-----|---------------|
| `get_auth_profile` | Web `AuthContext` (bypass RLS) |
| `check_email_exists` | Registro |
| `get_memberships` | App móvil + web |
| Plate-tracking RPCs | Tracking por placa |

## RLS

Todas las tablas anteriores tienen políticas RLS por `auth.uid()` y rol.
Hay un parche puntual en `AplicacionWebTmasplus/cars_rls_fix.sql`.

## Storage buckets

Ver [[05-backend-supabase]] §Storage buckets.

## Fuentes
- `App/documentacion/ARQUITECTURA.md` §8
- `App/config/database.types.ts`
- `App/sql/` (53 scripts)
- `TmasPlus_webSite/src/config/database.types.ts`
- `TmasPlus_webSite/docs/DATABASE_SCHEMA.md`
- `TmasPlus_webSite/cars_rls_fix.sql`
