## 🧪 PLAN DE PRUEBAS - SISTEMA DE LLAMADAS P2P

### ✅ Checklist de Validación

---

## 1️⃣ VALIDAR TABLA EN SUPABASE

Abre **Supabase → SQL Editor** y ejecuta:

```sql
-- Verificar que la tabla existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'call_notifications'
) AS table_exists;

-- Ver estructura
\d public.call_notifications

-- Contar registros
SELECT COUNT(*) as total_notifications FROM public.call_notifications;

-- Ver RLS policies
SELECT * FROM pg_policies WHERE tablename = 'call_notifications';
```

**Resultado esperado:**
```
✅ table_exists: true
✅ 3 columns: id, customer_id, driver_id, driver_name, channel_name, status, created_at, updated_at
✅ RLS policy: "Users can view their own call notifications"
```

---

## 2️⃣ VALIDAR EDGE FUNCTIONS DESPLEGADAS

En PowerShell:

```powershell
# Ver funciones desplegadas
npx supabase functions list --project-ref=utofhxgzkdhljrixperh
```

**Resultado esperado:**
```
✓ generateAgoraToken
✓ notifyIncomingCall
```

---

## 3️⃣ PROBAR EDGE FUNCTION: generateAgoraToken

Genera un token JWT de Agora:

```powershell
curl -X POST https://utofhxgzkdhljrixperh.supabase.co/functions/v1/generateAgoraToken `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0b2ZoeGd6a2RobGpyaXhwZXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzAzNTcsImV4cCI6MjA3MjYwNjM1N30.m3I2UMBCDz8b3TwChMpws53B3FtvhCL9nydaYbOydew" `
  -d '{\"channel\":\"test_channel\",\"uid\":12345,\"role\":\"publisher\"}'
```

**Resultado esperado:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "expiresIn": 3600
}
```

---

## 4️⃣ PROBAR EDGE FUNCTION: notifyIncomingCall

**NOTA:** Primero, obtén 2 UUIDs de usuarios reales de tu Supabase:

```sql
-- En Supabase SQL Editor
SELECT id FROM auth.users LIMIT 2;
```

Copia los 2 UUIDs y ejecuta:

```powershell
$customerId = "UUID_CLIENTE"
$driverId = "UUID_CONDUCTOR"

curl -X POST https://utofhxgzkdhljrixperh.supabase.co/functions/v1/notifyIncomingCall `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0b2ZoeGd6a2RobGpyaXhwZXJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwMzAzNTcsImV4cCI6MjA3MjYwNjM1N30.m3I2UMBCDz8b3TwChMpws53B3FtvhCL9nydaYbOydew" `
  -d "{\"customerId\":\"$customerId\",\"driverId\":\"$driverId\",\"driverName\":\"Test Driver\",\"channelName\":\"test_call\"}"
```

**Resultado esperado:**
```json
{
  "success": true,
  "notification": {
    "id": "uuid-xxx",
    "customer_id": "uuid-xxx",
    "driver_id": "uuid-xxx",
    "driver_name": "Test Driver",
    "channel_name": "test_call",
    "status": "pending",
    "created_at": "2026-04-04T10:00:00Z"
  }
}
```

**Valida que se registró:**

```sql
SELECT * FROM public.call_notifications 
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 5️⃣ VALIDAR APP: FRONTEND INTEGRATION

### Test en App Real (2 dispositivos):

**Dispositivo A (Conductor):**
1. Abre ReservationTripScreen
2. Haz click en botón "📞 Llamar"
3. Verifica en consola (Expo): `✅ [CALL] Iniciando llamada P2P a cliente...`
4. Espera que se abra AgoraCallModal

**Verificar en consola:**
```
✅ [CALL] Iniciando llamada P2P a cliente...
// Si todo falla, debería hacer fallback a llamada nativa
```

### Validar que se llamó la API:

En Supabase → SQL Editor:
```sql
SELECT * FROM public.call_notifications 
WHERE channel_name NOT LIKE 'test%'
ORDER BY created_at DESC 
LIMIT 1;
```

Debería ver el registro de la llamada que hiciste desde la app.

---

## 6️⃣ VALIDAR LOGS DE EDGE FUNCTIONS

Ver qué sucedió en generateAgoraToken:

```powershell
npx supabase functions logs generateAgoraToken --project-ref=utofhxgzkdhljrixperh
```

Ver logs de notifyIncomingCall:

```powershell
npx supabase functions logs notifyIncomingCall --project-ref=utofhxgzkdhljrixperh
```

---

## 📋 CHECKLIST FINAL

- [ ] SQL: Tabla `call_notifications` existe
- [ ] SQL: RLS policy aplicada
- [ ] Supabase: Edge Functions desplegadas (`generateAgoraToken`, `notifyIncomingCall`)
- [ ] HTTP: `generateAgoraToken` retorna token JWT válido
- [ ] HTTP: `notifyIncomingCall` registra en BD
- [ ] APP: Botón "📞 Llamar" abre modal
- [ ] APP: `useAgoraCall` hook genera token
- [ ] APP: Notificación se registra en `call_notifications`
- [ ] Realtime: Se escucha cambios en tabla

---

## 🔗 VER LOGS EN VIVO

Abre otra PowerShell y sigue los logs:

```powershell
# Follow logs en vivo
npx supabase functions logs generateAgoraToken --project-ref=utofhxgzkdhljrixperh --follow
```

Luego desde la app, haz una llamada. Deberías ver los logs en tiempo real.

---

## 🆘 SI ALGO FALLA

**Error: "Function not found"**
→ No está desplegada. Ejecuta:
```bash
npx supabase functions deploy --project-ref=utofhxgzkdhljrixperh
```

**Error: "Table does not exist"**
→ No ejecutaste el SQL. Ve a Supabase → SQL Editor y ejecuta `create_call_notifications_safe.sql`

**App no muestra modal**
→ Verifica consola Expo. Si hay error, reporta el mensaje exacto.

**No ves el registro en BD**
→ Probablemente RLS policy lo está bloqueando. Verifica que hayas hecho login con el mismo usuario.

---

## 📚 REFERENCIAS

- Token JWT generado: https://jwt.io/ (pega el token para decodificar)
- Logs Supabase: `npx supabase functions logs`
- Status: `npx supabase status`
