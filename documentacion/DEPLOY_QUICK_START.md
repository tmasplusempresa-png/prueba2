# 🚀 DEPLOY EDGE FUNCTIONS - QUICK START

## 2 Pasos Simples

### **PASO 1: Crear tabla en Supabase**

1. Abre: https://app.supabase.com
2. Selecciona tu proyecto
3. Abre **SQL Editor** (izquierda)
4. Haz click en **"New Query"**
5. **Copia y pega el SQL seguro de:**
   - 📄 `masterchiefpar1/sql/create_call_notifications_safe.sql`
6. Haz click en **"RUN"** ✅

Este SQL es **idempotente** - puedes ejecutarlo múltiples veces sin problemas.

---

### **PASO 2: Desplegar Edge Functions**

**Opción A: Script automático (MÁS FÁCIL)**

```powershell
# Abre PowerShell y ejecuta:
cd "c:\Users\andre\Desktop\Proyecto 2026\Completion_2.0"
.\deploy-edge-functions.ps1
```

**Opción B: Comandos manuales**

```powershell
cd "c:\Users\andre\Desktop\Proyecto 2026\Completion_2.0"

# Primera vez: login
npx supabase login

# Desplegar
npx supabase functions deploy --project-ref=utofhxgzkdhljrixperh
```

---

## ✅ Listo

Si ves esto:

```
✓ Deploying function generateAgoraToken...
✓ Deploying function notifyIncomingCall...
```

**¡Ya funciona!** 🎉

---

## 🧪 Probar que funciona

```powershell
curl -X POST https://utofhxgzkdhljrixperh.supabase.co/functions/v1/generateAgoraToken `
  -H "Content-Type: application/json" `
  -d '{\"channel\":\"test\",\"uid\":12345,\"role\":\"publisher\"}'
```

Deberías recibir un token JWT ✅

---

## 📚 Ver documentación completa

- [SETUP_READY_TO_DEPLOY.md](./masterchiefpar1/SETUP_READY_TO_DEPLOY.md) - Guía detallada
- [SUPABASE_EDGE_FUNCTIONS_GUIDE.md](./masterchiefpar1/SUPABASE_EDGE_FUNCTIONS_GUIDE.md) - Documentación técnica
