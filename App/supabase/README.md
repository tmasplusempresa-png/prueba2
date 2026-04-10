# Supabase Edge Functions - Setup

Este proyecto usa **Supabase Edge Functions** (en lugar de Firebase) para:
- ✅ Generar tokens de Agora RTC
- ✅ Registrar notificaciones de llamadas entrantes

## Pasos de Instalación

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Login en Supabase

```bash
supabase login
```

### 3. Crear tabla para notificaciones de llamadas

En **Supabase → SQL Editor**, ejecuta:

```sql
CREATE TABLE call_notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES auth.users(id),
  driver_id uuid NOT NULL REFERENCES auth.users(id),
  driver_name TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, missed
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Habilitar Realtime para esta tabla
ALTER PUBLICATION supabase_realtime ADD TABLE call_notifications;

-- Crear RLS Policy
ALTER TABLE call_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own call notifications"
  ON call_notifications FOR SELECT
  USING (
    auth.uid() = customer_id OR auth.uid() = driver_id
  );
```

### 4. Configurar variables de entorno

Edita `supabase/config.toml`:

```toml
[functions]
verify_jwt = true
```

### 5. Desplegar Edge Functions

```bash
# Ir a la carpeta de Edge Functions
cd supabase/functions

# Desplegar todas las funciones
supabase functions deploy

# O desplegar funciones específicas:
supabase functions deploy generateAgoraToken
supabase functions deploy notifyIncomingCall
```

### 6. Verificar despliegue

```bash
supabase functions list
```

## Endpoints de las Edge Functions

### Generate Agora Token

**URL**: `https://[PROJECT_ID].supabase.co/functions/v1/generateAgoraToken`

**Método**: POST

**Body**:
```json
{
  "channel": "call_driver_customer_123",
  "uid": 12345,
  "role": "publisher"
}
```

**Response**:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "expiresIn": 3600
}
```

### Notify Incoming Call

**URL**: `https://[PROJECT_ID].supabase.co/functions/v1/notifyIncomingCall`

**Método**: POST

**Body**:
```json
{
  "customerId": "uuid-customer",
  "driverId": "uuid-driver",
  "driverName": "Juan Conductor",
  "channelName": "call_driver_customer_123"
}
```

**Response**:
```json
{
  "success": true,
  "notification": {
    "id": "uuid",
    "customer_id": "uuid",
    "driver_id": "uuid",
    "driver_name": "Juan Conductor",
    "channel_name": "call_driver_customer_123",
    "status": "pending",
    "created_at": "2026-04-03T10:00:00Z"
  }
}
```

## Integración con la App

Las Edge Functions se llaman desde:

1. **generateAgoraToken**: Llamado antes de establecer llamada Agora
2. **notifyIncomingCall**: Guardada en Supabase y escuchada via Realtime

## Variables de Entorno Necesarias

En `.env`:

```
SUPABASE_URL=https://utofhxgzkdhljrixperh.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Obtener de: Settings → API → Service Role Key
AGORA_APP_ID=e7f6e9aeecf14b2ba10e3f40be9f56e7
AGORA_APP_CERTIFICATE=5e1c44bcfc5942aaadcab5b893a07d56
```

## Troubleshooting

### Error: "Service role key is invalid"

Asegúrate de que `SUPABASE_SERVICE_ROLE_KEY` esté correctamente configurada en `.env`.

Obtén la correcta en:
- Supabase Dashboard → Settings → API
- Copia la **"service_role" key**

### Error: "Table 'call_notifications' does not exist"

Ejecuta el SQL de crear tabla en Supabase SQL Editor.

### Las funciones no se despliegan

```bash
# Ver logs
supabase functions delete generateAgoraToken --force-delete
supabase functions deploy generateAgoraToken
```

## Referencias

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Agora Token Builder](https://docs.agora.io/en/video-calling/develop/authentication-workflow?platform=web)
