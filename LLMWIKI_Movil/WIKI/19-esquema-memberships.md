# Esquema `memberships`

> Membresía mensual del conductor. PK `uid`, costo default 90600 COP,
> periodo 30 días. **FK a `auth.users`, no a `public.users`** — anomalía.

---
tags: [bd, esquema, memberships, rls]
entidades: [memberships, memberships_audit, auth.users]
---

## Tabla `memberships`

| Columna | Tipo | Default / Notas |
|---------|------|------------------|
| `uid` | `UUID PK` | `gen_random_uuid()` |
| `conductor` | `UUID NOT NULL FK → auth.users(id) ON DELETE CASCADE` | ⚠️ Apunta a `auth.users` directo, no a `public.users.id`. Para join con perfil hay que pasar por `users.auth_id`. |
| `status` | `VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'` | `CHECK IN ('ACTIVA','CANCELADA','EXPIRADA','PENDIENTE')` |
| `costo` | `DECIMAL(10,2) NOT NULL DEFAULT 90600` | COP |
| `fecha_inicio` | `DATE NOT NULL DEFAULT CURRENT_DATE` | |
| `fecha_terminada` | `DATE NOT NULL` | Sin default — trigger la calcula |
| `periodo` | `INTEGER NOT NULL DEFAULT 30` | Días |
| `created_at`, `updated_at` | `TIMESTAMP WITH TIME ZONE` | |

## Índices

```
idx_memberships_conductor, idx_memberships_status, idx_memberships_fecha_terminada
```

## RLS

| Policy | Operación | Condición |
|--------|-----------|-----------|
| `Conductores ven sus membresías` | SELECT | `conductor = auth.uid()` |
| `Insertar membresías` | INSERT | `conductor = auth.uid()` (CHECK) |
| `Actualizar membresías propias` | UPDATE | `conductor = auth.uid()` |

Historia de problemas → scripts fix:
- `fix-rls-memberships.sql`
- `update-rls-policies-memberships.sql`
- `disable-rls-memberships-final.sql` (workaround)
- `diagnose-rls-memberships.sql`

## Trigger automático

`crear_membresia_al_registrarse` (en `auto-memberships-trigger.sql`):
al insertar un `users` con `user_type='driver'`, crea fila `PENDIENTE` con
`fecha_terminada = CURRENT_DATE + INTERVAL '30 days'`.

## Tabla auxiliar `memberships_audit`

| Columna | Tipo |
|---------|------|
| `id` | `UUID PK` |
| `conductor` | `UUID NOT NULL` |
| `membership_uid` | `UUID FK → memberships(uid)` |
| `status_anterior` | `VARCHAR(20)` |
| `status_nuevo` | `VARCHAR(20)` |
| `fecha_cambio` | `TIMESTAMP WITH TIME ZONE` |
| `razon` | `TEXT` |

No expuesta al cliente.

## Activación / desactivación

`memberships-activate-deactivate.sql` define UPDATEs idempotentes para mover
`status` con su `updated_at`. `memberships-setup-complete.sql` es el setup
total (tabla + trigger + RLS + seed).

## Costo

`update-costo-memberships.sql` cambia default cuando suban precio. Hoy 90600 COP.

## RPC

`get_my_memberships(conductor_id uuid)` definido en
`create-rpc-get-memberships.sql`. Bypassa RLS — útil cuando el cliente sufre
los problemas históricos.

## Por qué FK a `auth.users` es problema

Al pasar `users.id` (que es el PK público) al servicio
`getMemberships(conductorId)` no coincide con `memberships.conductor`. Hay que
pasar `auth.uid()` o `users.auth_id`. Si el cliente confunde columnas → consulta
devuelve vacío sin error → silent fail. Documentado en [[10-deuda-tecnica]].

## Fuentes
- `App/sql/create-memberships-table.sql`
- `App/sql/auto-memberships-trigger.sql`
- `App/sql/memberships-setup-complete.sql`
- `App/sql/memberships-activate-deactivate.sql`
- `App/sql/update-costo-memberships.sql`
- `App/sql/create-rpc-get-memberships.sql`
- `App/sql/fix-rls-memberships.sql`
