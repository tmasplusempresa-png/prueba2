## 📱 PRUEBA DE LLAMADA P2P - 2 DISPOSITIVOS

### 🎯 Objetivo
Hacer una videollamada P2P real entre conductor y cliente usando Agora + Supabase Edge Functions

---

## 📋 Pre-requisitos

✅ SQL ejecutado en Supabase (`call_notifications` tabla)
✅ Edge Functions desplegadas (`generateAgoraToken`, `notifyIncomingCall`)
✅ App en 2 dispositivos (o emuladores Android/iOS)
✅ Ambos logueados con usuarios diferentes (1 driver, 1 customer)

---

## 🚀 PASO 1: PREPARAR 2 DISPOSITIVOS

### Dispositivo A: **CONDUCTOR** 📍
```
1. Abre la app
2. Login como DRIVER (usuario tipo = "driver")
3. Crea o selecciona una reserva activa
4. Navega a: ReservationTripScreen (Viajes activos)
5. Deberías ver: botón "📞 Llamar"
```

### Dispositivo B: **CLIENTE** 📱
```
1. Abre la app
2. Login como CUSTOMER (usuario tipo = "customer")
3. Ten la app abierta (en segundo plano está bien)
4. Espera para recibir notificación de llamada
```

---

## 📞 PASO 2: INICIAR LLAMADA

### En Dispositivo A (CONDUCTOR):

```
1. Abre ReservationTripScreen
2. Ve el detalle de la reserva:
   - Nombre cliente: "Juan Cliente"
   - Teléfono: "+1234567890"
   - Estado: "TRIP_STARTED"

3. Toca el botón: "📞 Llamar"
```

**Qué esperar en consola Expo:**

```
📞 [CALL] Iniciando llamada P2P a cliente...
✅ [CALL] Token generado, estableciendo llamada...
✅ AgoraUIKit renderizado
🎥 Video stream activo
🔊 Audio activado
```

### En Dispositivo B (CLIENTE):

```
Si todo funciona verás:

1. Notificación push: "📞 Llamada entrante"
   "Juan Conductor te está llamando..."

2. O en Realtime: 
   Nueva fila en call_notifications tabla

3. Modal de llamada entrante:
   - "Llamada de Juan Conductor"
   - Botón: "Aceptar" / "Rechazar"
```

---

## ✅ PASO 3: VALIDAR LLAMADA ESTABLECIDA

### Cuando AMBOS aceptan:

**Dispositivo A (Conductor) debe mostrar:**
```
✓ Video del cliente en pantalla
✓ Tu video en esquina (PiP)
✓ Botones: Mute, Speaker, End Call
✓ Timer de llamada contando
```

**Dispositivo B (Cliente) debe mostrar:**
```
✓ Video del conductor en pantalla
✓ Tu video en esquina (PiP)
✓ Botones: Mute, Speaker, End Call
✓ Timer sincronizado
```

---

## 🔍 PASO 4: VERIFICAR EN SUPABASE

Mientras llamas, abre SQL Editor:

```sql
-- Ver registro de la llamada
SELECT * FROM public.call_notifications 
WHERE channel_name LIKE 'call_%'
ORDER BY created_at DESC 
LIMIT 1;

-- Resultado esperado:
-- id          | uuid-xxx
-- customer_id | uuid-cliente
-- driver_id   | uuid-conductor
-- driver_name | Juan Conductor
-- channel_name| call_uuid-conductor_uuid-cliente
-- status      | pending (o accepted si ambos aceptaron)
-- created_at  | 2026-04-04 10:30:45
```

---

## 📊 PASO 5: MONITOREAR LOGS EN VIVO

Abre 2 PowerShells:

```powershell
# PowerShell 1: Ver logs de generateAgoraToken
npx supabase functions logs generateAgoraToken --project-ref=utofhxgzkdhljrixperh --follow

# PowerShell 2: Ver logs de notifyIncomingCall
npx supabase functions logs notifyIncomingCall --project-ref=utofhxgzkdhljrixperh --follow
```

**Cuando hagas la llamada verás:**

```
[generateAgoraToken]
✅ Generated token for channel: call_uuid_uuid, uid: 12345
⏱️ Token válido por 3600 segundos

[notifyIncomingCall]
✅ Notified customer: uuid-cliente of call from Juan Conductor
📍 Notification saved to call_notifications table
```

---

## 🎥 PASO 6: TERMINAR LLAMADA

### Desde cualquier dispositivo:
```
1. Toca botón: "Finalizar llamada" (rojo)
2. Modal se cierra
3. Vuelves a ReservationTripScreen
```

**Verificar en BD:**
```sql
-- Ver estado actualizado
SELECT status FROM public.call_notifications 
WHERE id = 'uuid-de-la-llamada';

-- Debería cambiar: pending → ended
```

---

## 🧪 CASOS DE PRUEBA

### ✅ Test 1: Llamada completada
```
1. Conductor llama
2. Cliente recibe notificación
3. Ambos ven video
4. Cualquiera termina
5. Verificar registro en BD
```

### ✅ Test 2: Cliente rechaza
```
1. Conductor llama
2. Cliente ve modal
3. Cliente toca: "Rechazar"
4. Conductor ve: "Llamada rechazada"
5. Verificar status = "declined" en BD
```

### ✅ Test 3: Llamada fallida (sin internet)
```
1. Desconecta internet en Cliente
2. Conductor llama
3. Debería ver: "Llamada no disponible"
4. Fallback a llamada nativa (tel:+1234567890)
```

### ✅ Test 4: Mismo usuario llama
```
1. Mismo usuario en ambos dispositivos
2. Intenta llamar
3. Debería fallar o ignorarse
```

---

## 🐛 TROUBLESHOOTING

### Problema: No se abre el modal en Conductor
```
❌ Error: "Token generation failed"
✅ Solución: 
   - Verifica Edge Function está desplegada
   - Revisa logs: npx supabase functions logs generateAgoraToken
   - Recarga app
```

### Problema: Cliente no recibe notificación
```
❌ No ve notificación push
✅ Solución:
   - Verifica que notifyIncomingCall se ejecutó
   - Revisa logs: npx supabase functions logs notifyIncomingCall
   - Supabase Realtime está habilitado
   - Cliente tiene tabla escuchando cambios
```

### Problema: Video no aparece
```
❌ Modal abierto pero pantalla negra
✅ Solución:
   - Verifica permisos: cámara/micrófono
   - Ambos en mismo canal (channel_name idéntico)
   - Token JWT válido (verifica en jwt.io)
   - Conexión a internet estable
```

### Problema: Llamada se corta
```
❌ Se desconecta en medio
✅ Solución:
   - Mala conexión WiFi/LTE
   - Token expiró (3600 seg)
   - Agora SDK error - revisar logs Expo
```

---

## 📈 MÉTRICAS A VALIDAR

```
✅ Tiempo respuesta:
   - Generación token: <500ms
   - Notificación: <1s
   - Conexión video: <3s

✅ Latencia video:
   - <200ms es bueno
   - <500ms es aceptable
   - >1s es sobre-laggy

✅ Calidad audio:
   - Clara sin ruido
   - Sin cortes
   - Sincronizado con video
```

---

## 📹 RECORD DE PRUEBA

Para documentar que funciona, captura:

```
1. Screenshot: Modal de llamada con video
2. Video corto: Ambos viendo video cada uno
3. Screenshot: Registro en call_notifications tabla
4. Logs: Output de Edge Functions
```

---

## ✅ CHECKLIST - LLAMADA EXITOSA

- [ ] Conductor toca "📞 Llamar"
- [ ] Modal de AgoraUIKit se abre
- [ ] Dispositivo A muestra video
- [ ] Dispositivo B recibe notificación
- [ ] Cliente ve "Llamada entrante" 
- [ ] Cliente toca "Aceptar"
- [ ] Ambos ven video P2P
- [ ] Audio funciona en ambas direcciones
- [ ] Botones (Mute, Speaker) funcionan
- [ ] Registro en call_notifications creado
- [ ] Status cambió de pending → accepted
- [ ] Uno toca "Finalizar" 
- [ ] Modal se cierra en ambos
- [ ] Vuelven a ReservationTripScreen

**Si todos ✅ → SISTEMA COMPLETAMENTE FUNCIONAL** 🎉

---

## 📞 REFERENCIAS RÁPIDAS

- **Agora Error Codes**: https://docs.agora.io/en/video-calling/reference/error-codes
- **Token JWT Decoder**: https://jwt.io/
- **Testing Guide**: Repite tests en diferentes redes (WiFi, 4G, 5G)
- **Supabase Status**: npx supabase status --project-ref=utofhxgzkdhljrixperh
