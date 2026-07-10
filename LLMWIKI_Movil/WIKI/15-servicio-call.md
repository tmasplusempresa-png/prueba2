# Servicio CallService + Agora

> Wrapper mínimo sobre Agora RN UIKit. Genera channel ID determinista para
> llamadas 1-a-1 y arma config de conexión. Token real lo emite Edge Function.

---
tags: [movil, servicio, llamadas, agora]
entidades: [CallService, useAgoraCall, generateAgoraToken]
---

## Ubicación

`App/common/services/CallService.ts` — funciones puras + tipos.

## Tipos

```ts
interface CallConnection { appId: string; channel: string; token: string | null; uid?: number; }
interface CallUser { userId: string; name: string; phone: string; image?: string; }
```

## API

| Función | Lógica |
|---------|--------|
| `generateChannelId(userId1, userId2)` | Ordena ambos IDs lexicográficamente y devuelve `call_{a}_{b}`. **Determinista** — mismo par produce el mismo canal sin importar quién llama. |
| `createAgoraConnection(appId, channel, token?, uid?)` | Construye objeto `CallConnection`. Token `null` si no se pasa. |

## Flujo de llamada

1. Cliente o conductor pulsa "Llamar" → `generateChannelId(myId, otherId)`.
2. Llama Edge Function `generateAgoraToken` con `{ channelName, uid }` →
   recibe token RTC.
3. `createAgoraConnection(AGORA_APP_ID, channel, token, uid)`.
4. Hook `useAgoraCall` monta `AgoraCallModal` con esa connection.
5. Push de entrante en el otro lado vía Edge Function `notifyIncomingCall`
   (service role). Llega a `IncomingCallModal`.
6. Tabla `call_notifications` (script `create_call_notifications_safe.sql`)
   registra metadata.

## Credenciales y endpoints

- **Agora App ID:** `e7f6e9aeecf14b2ba10e3f40be9f56e7` (embebido).
- **App Certificate:** `AGORA_APP_CERTIFICATE` en `.env` — usado SOLO por la
  Edge Function `generateAgoraToken` para firmar el token. Nunca al cliente.
- **Edge Function token:** `POST {SUPABASE_URL}/functions/v1/generateAgoraToken`
  body `{ channelName, uid }` con `Authorization: Bearer <ANON_KEY>`.
- **Edge Function push:** `POST {SUPABASE_URL}/functions/v1/notifyIncomingCall`
  body `{ toUserId, fromUser, channel, ... }`.

## Hooks y componentes

- `App/hooks/useAgoraCall.ts` — orquesta join/leave + estados de llamada.
- `App/components/AgoraCallModal.tsx` — UI activa.
- `App/components/IncomingCallModal.tsx` — UI entrante.
- `App/common/services/NotificationService.ts` — wrapper push para llamadas.

## Limitación

Solo 1-a-1 hoy. Para grupo habría que cambiar la convención de `channel_id`
y renderizar lista de remotos.

## Fuentes
- `App/common/services/CallService.ts`
- `App/supabase/functions/generateAgoraToken/index.ts`
- `App/supabase/functions/notifyIncomingCall/index.ts`
- `App/sql/create_call_notifications_safe.sql`
- `App/AGORA_SETUP_GUIDE.md`, `AGORA_SIMPLIFIED_GUIDE.md`
