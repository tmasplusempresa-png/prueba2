# ✅ SISTEMA DE LLAMADAS P2P - LISTO PARA DESPLEGAR

## 📋 Estado Actual

✅ **Base de datos**: RLS policies actualizadas en Supabase
✅ **Backend Supabase**: Edge Functions creadas y listas
✅ **Frontend**: Integración completa
✅ **.env**: Credenciales configuradas correctamente
✅ **Firebase Functions**: Limpiado (solo funciones existentes)

---

## 🚀 2 Pasos Finales

### **PASO 1: Crear tabla en Supabase** (1 minuto)

Ve a: https://app.supabase.com → Tu proyecto → SQL Editor

Copia y pega esto:

```sql
-- Crear tabla para notificaciones de llamadas
CREATE TABLE IF NOT EXISTS call_notifications (
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

CREATE POLICY "Users can view their own call notifications" ON call_notifications
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() = driver_id);
```

Luego haz click en **"RUN"** ✅

---

### **PASO 2: Desplegar Edge Functions**

En PowerShell, ejecuta:

```powershell
# Navega a la carpeta raíz del proyecto
cd "c:\Users\andre\Desktop\Proyecto 2026\Completion_2.0"

# Login a Supabase (solo primera vez)
npx supabase login

# Desplegar las funciones
npx supabase functions deploy --project-ref=utofhxgzkdhljrixperh
```

**Nota**: Usamos `npx supabase` (sin instalar CLI). Descarga automáticamente y ejecuta la versión correcta.

Si todo funciona verás:

```
✓ Deploying function generateAgoraToken...
✓ Deploying function notifyIncomingCall...
```

---

## ✨ Listo para Usar

Una vez hayas completado esos 3 pasos:

1. **Abre la app** en 2 dispositivos
2. **Conductor** abre ReservationTripScreen
3. **Conductor** toca el botón "📞 Llamar"
4. **Cliente** recibe notificación en Realtime
5. **Videollamada P2P** se establece automáticamente ✅

---

## 🔍 Verificar que funciona

Para probar la Edge Function generateAgoraToken:

```powershell
curl -X POST https://utofhxgzkdhljrixperh.supabase.co/functions/v1/generateAgoraToken `
  -H "Content-Type: application/json" `
  -d '{\"channel\":\"test\",\"uid\":12345,\"role\":\"publisher\"}'
```

Deberías recibir un token JWT ✅

---

## 📁 Estructura de Despliegue

```
tu-proyecto/
├── supabase/
│   ├── functions/
│   │   ├── generateAgoraToken/
│   │   │   └── index.ts  ← Se deploya automáticamente
│   │   └── notifyIncomingCall/
│   │       └── index.ts  ← Se deploya automáticamente
│   └── config.toml
├── masterchiefpar1/
│   ├── hooks/
│   │   └── useAgoraCall.ts  ← Ahora genera tokens desde Supabase
│   ├── components/
│   │   └── AgoraCallModal.tsx
│   ├── common/services/
│   │   └── NotificationService.ts  ← Llama Edge Functions
│   ├── app/(tabs)/
│   │   └── ReservationTripScreen.tsx  ← Integrado
│   ├── .env  ← ✅ Credenciales correctas
│   └── functions/
│       └── index.ts  ← Limpiado (solo Firebase existente)
```

---

## 🆘 Si algo falla

### Error: "Table does not exist when calling notifyIncomingCall"
→ No ejecutaste el SQL en paso 1

### Error: "Function not found"
→ Las funciones no se desplegaron. Ejecuta:
```bash
npx supabase functions deploy --project-ref=utofhxgzkdhljrixperh
```

### Error: "Service role key is invalid"
→ Verifica que SUPABASE_SERVICE_ROLE_KEY en `.env` sea correcta.

### Ver logs de la función
```bash
npx supabase functions logs generateAgoraToken --project-ref=utofhxgzkdhljrixperh
```

---

## ✅ Checklist Final

- [ ] Ejecuté el SQL para crear `call_notifications` tabla
- [ ] Ejecuté `npx supabase login` (primera vez)
- [ ] Ejecuté `npx supabase functions deploy --project-ref=utofhxgzkdhljrixperh`
- [ ] Verifiqué que las funciones están en vivo
- [ ] La app está lista para hacer llamadas

---

**¿Preguntas?** Lee `SUPABASE_EDGE_FUNCTIONS_GUIDE.md` para más detalles.
