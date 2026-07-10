# Servicio membershipsService

> Lectura de membresías del conductor con doble vía: REST + JWT primero, SDK
> como fallback. Patrón explícito para esquivar problemas de RLS del SDK.

---
tags: [movil, servicio, membresias, supabase]
entidades: [membershipsService, memberships, auth.users]
---

## Ubicación

`App/common/services/membershipsService.ts` — funciones top-level.

## API

| Función | Vía | Notas |
|---------|-----|-------|
| `getMembershipsViaREST(conductorId)` | `GET /rest/v1/memberships?conductor=eq.{id}&order=created_at.desc` + JWT | Headers vía `getSupabaseAuthHeaders(true)` + `Prefer: return=representation` |
| `getMembershipsViaSDK(conductorId)` | `supabase.from('memberships').select(...).eq('conductor', id).order(...)` | Fallback |
| `getMemberships(conductorId)` | REST → si vacío, SDK | Estrategia principal |

## Tipo `MembershipData`

```ts
interface MembershipData {
  uid: string;
  conductor: string;        // FK a auth.users(id), NO public.users(id)
  status: string;           // 'ACTIVA' | 'CANCELADA' | 'EXPIRADA' | 'PENDIENTE'
  costo: number;            // default 90600 COP
  fecha_inicio: string;     // ISO date
  fecha_terminada: string;  // ISO date
  periodo: number;          // días, default 30
  created_at: string;
  updated_at: string;
}
```

⚠️ **`conductor` apunta a `auth.users(id)`, no a `public.users(id)`** — ver
schema. Esto rompe joins naturales `memberships → users`. Para resolver, el
cliente debe pasar `auth.uid()` (no `users.id`). Anotado en [[10-deuda-tecnica]].

## RLS sobre `memberships`

Tres políticas (`App/sql/create-memberships-table.sql`):

- `SELECT USING (conductor = auth.uid())` — solo dueño.
- `INSERT WITH CHECK (conductor = auth.uid())` — solo se auto-inserta.
- `UPDATE USING (conductor = auth.uid())` — solo dueño.

Adicionalmente existen scripts de fix/disable:
- `fix-rls-memberships.sql`
- `disable-rls-memberships-final.sql`
- `update-rls-policies-memberships.sql`
- `diagnose-rls-memberships.sql`

Histórico: la RLS dio problemas repetidos. Hoy convive con la RPC
`get_my_memberships(conductor_id uuid)` como bypass seguro.

## Triggers automáticos

- `crear_membresia_al_registrarse` — al insertar nuevo `users` con
  `user_type='driver'`, crea membresía `PENDIENTE` con `fecha_terminada = CURRENT_DATE + 30`. Definido en `auto-memberships-trigger.sql`.

## Por qué doble vía

SDK Supabase en RN se queda esperando indefinidamente cuando RLS rechaza
silencioso o cuando auth lock está tomado. REST con `Authorization: Bearer
<USER_JWT>` evita ambos casos. Si REST devuelve `[]` (válido, no error), prueba
SDK por si una nueva fila quedó cacheada de forma distinta.

## Tabla auxiliar

`memberships_audit` registra cambios de status (`status_anterior`,
`status_nuevo`, `razon`). No expuesta al cliente.

## Fuentes
- `App/common/services/membershipsService.ts`
- `App/sql/create-memberships-table.sql`
- `App/sql/auto-memberships-trigger.sql`
- `App/sql/memberships-setup-complete.sql`
- `App/sql/memberships-activate-deactivate.sql`
- `App/sql/create-rpc-get-memberships.sql`
