# Guía de Despliegue - Supabase Edge Functions

## ✅ Cambios Realizados

Se ha migrado de Firebase Functions a **Supabase Edge Functions**:

1. ✅ **Creadas 2 Edge Functions en `supabase/functions/`**:
   - `generateAgoraToken/` - Genera tokens JWT para Agora RTC
   - `notifyIncomingCall/` - Registra notificaciones de llamadas entrantes

2. ✅ **Actualizado hook `useAgoraCall`**:
   - Ahora genera tokens desde Supabase Edge Function
   - Método `makeCall()` y `acceptCall()` ahora son async

3. ✅ **Actualizado `ReservationTripScreen`**:
   - Cuando conductor llama, notifica al cliente via Edge Function
   - Genera canal de llamada determinístico

4. ✅ **Creado servicio `NotificationService`**:
   - `notifyIncomingCall()` - Llamar Edge Function
   - `subscribeToCallNotifications()` - Escuchar cambios Realtime

5. ✅ **Actualizado `.env`**:
   - Agregada `SUPABASE_SERVICE_ROLE_KEY` (placeholder)

---

## 🚀 Pasos para Desplegar

### Paso 1: Obtener Service Role Key

1. Abre https://app.supabase.com/
2. Selecciona tu proyecto
3. Ve a **Settings** → **API**
4. Copia la **"service_role" key** (no la anon key)
5. Actualiza `.env`:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3M...
```

### Paso 2: Instalar Supabase CLI

```powershell
npm install -g supabase
```

### Paso 3: Crear tabla en Supabase

Abre **Supabase → SQL Editor** y ejecuta:

```sql
CREATE TABLE call_notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES auth.users(id),
  driver_id uuid NOT NULL REFERENCES auth.users(id),
  driver_name TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Habilitar Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE call_notifications;

-- Crear RLS Policy
ALTER TABLE call_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own call notifications"
  ON call_notifications FOR SELECT
  USING (auth.uid() = customer_id OR auth.uid() = driver_id);
```

### Paso 4: Desplegar Edge Functions

```powershell
# Login a Supabase
supabase login

# Navega a la carpeta del proyecto (la raíz, no masterchiefpar1)
cd "c:\Users\andre\Desktop\Proyecto 2026\Completion_2.0"

# Desplegar las funciones
npx supabase functions deploy --project-ref=utofhxgzkdhljrixperh

# O desplegar solo una función:
npx supabase functions deploy generateAgoraToken --project-ref=utofhxgzkdhljrixperh
npx supabase functions deploy notifyIncomingCall --project-ref=utofhxgzkdhljrixperh
```

### Paso 5: Verificar despliegue

```powershell
npx supabase functions list --project-ref=utofhxgzkdhljrixperh
```

Deberías ver:
```
✓ generateAgoraToken
✓ notifyIncomingCall
```

### Paso 6: Verificar URLs de las funciones

Las funciones estarán disponibles en:

```
https://utofhxgzkdhljrixperh.supabase.co/functions/v1/generateAgoraToken
https://utofhxgzkdhljrixperh.supabase.co/functions/v1/notifyIncomingCall
```

Prueba una con:

```powershell
curl -X POST https://utofhxgzkdhljrixperh.supabase.co/functions/v1/generateAgoraToken \
  -H "Content-Type: application/json" \
  -d '{"channel":"test","uid":12345,"role":"publisher"}'
```

---

## 🔧 Configuración Automática (Opcional)

Si tienes supabase.json en la raíz del proyecto (no en masterchiefpar1):

```json
{
  "project_id": "utofhxgzkdhljrixperh",
  "api": {
    "enabled": true,
    "port": 54321,
    "schemas": [],
    "extra_search_path": [],
    "max_rows": 1000
  }
}
```

---

## 📋 Checklist

- [ ] Obtuviste SUPABASE_SERVICE_ROLE_KEY
- [ ] Actualizaste `.env` con la Service Role Key
- [ ] Instalaste Supabase CLI
- [ ] Ejecutaste el SQL para crear la tabla `call_notifications`
- [ ] Desplegaste las Edge Functions
- [ ] Verificaste que las funciones están en vivo
- [ ] La app está lista para hacer llamadas

---

## 🐛 Troubleshooting

### Error: "Table does not exist"
→ Ejecuta el SQL de crear tabla en Supabase SQL Editor

### Error: "Service role key is invalid"
→ Asegúrate que SUPABASE_SERVICE_ROLE_KEY en `.env` sea correcta

### Functions no se despliegan
```bash
# Limpia y redeploy
supabase functions delete generateAgoraToken --force-delete
supabase functions deploy generateAgoraToken
```

### Ver logs de una función
```bash
supabase functions logs generateAgoraToken --project-ref=utofhxgzkdhljrixperh
```

---

## 📚 Referencias

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- [Agora Authentication](https://docs.agora.io/en/video-calling/develop/authentication-workflow)
