## 🤖 ANDROID STUDIO + DISPOSITIVO FÍSICO

### ✅ SÍ FUNCIONA, pero con consideraciones

---

## 🔧 SETUP

### **Opción 1: Emulador + Dispositivo Real** ⭐ RECOMENDADO

```
Android Studio Emulator (en tu PC)
        ↓↑
    Supabase Cloud ← Ambos se conectan aquí
        ↓↑
   Dispositivo Real (teléfono)
```

**Ventajas:**
- ✅ Fácil de debuggear (Android Studio tiene console)
- ✅ Emulador puede ser muy lento para video
- ✅ Dispositivo real tiene cámara/micrófono

**Desventajas:**
- ❌ Emulador lento para videollamada
- ❌ Puede haber lag en video

---

## 📝 PASO 1: CONFIGURAR EMULADOR

### En Android Studio:

```
1. Abre: Device Manager
2. Create Virtual Device
3. Select: Pixel 6 Pro (o similar)
4. Select: API 33+ (Android 13+)
5. RAM: 4GB mínimo (8GB ideal)
6. Click: "Finish"
```

### Iniciar emulador:

```
Device Manager → Pixel 6 Pro → ▶️ Play
```

**Espera 1-2 min a que cargue completamente.**

---

## 📱 PASO 2: INSTALAR APP EN AMBOS

### En Emulador:

```powershell
cd c:\Users\andre\Desktop\Proyecto\ 2026\Completion_2.0\masterchiefpar1

# Instalar APK
expo run:android

# O si tienes built APK:
adb install app-release.apk
```

### En Dispositivo Real:

```powershell
# Conectar teléfono por USB
cd c:\Users\andre\Desktop\Proyecto\ 2026\Completion_2.0\masterchiefpar1

# Instalar
expo run:android

# O scannea QR de Expo
```

---

## 🔌 PASO 3: VERIFICAR CONECTIVIDAD

### En Emulador:

```powershell
# Verificar que puede alcanzar Supabase
adb shell curl https://utofhxgzkdhljrixperh.supabase.co/functions/v1/status
```

### En Dispositivo Real:

```
Abre navegador → https://utofhxgzkdhljrixperh.supabase.co/functions/v1/status

Debería ver un JSON response
```

---

## 📱 PASO 4: LOGIN DIFERENTES USUARIOS

### Emulador (CONDUCTOR):
```
1. App abre
2. Login como: driver@example.com (tipo = "driver")
3. Navega a ReservationTripScreen
```

### Dispositivo Real (CLIENTE):
```
1. App abre
2. Login como: customer@example.com (tipo = "customer")
3. Navega a pantalla de reservas (espera notificación)
```

---

## 📞 PASO 5: LLAMADA

### Emulador (Conductor):

```
1. ReservationTripScreen
2. Toca "📞 Llamar"
3. Verifica en Android Studio Console:
   ✅ [CALL] Iniciando llamada P2P a cliente...
   ✅ Token generado
   ✅ Canal: call_uuid_uuid
```

### Dispositivo Real (Cliente):

```
1. Debería recibir notificación
2. O popup: "Llamada entrante"
3. Toca "Aceptar"
4. Se abre AgoraCallModal
5. Vez video del emulador
```

---

## 🎥 CASOS ESPECIALES

### ❌ PROBLEMA: Emulador sin cámara

**Emulador virtual NO tiene cámara real**

**Soluciones:**

**A) Usar cámara del PC real:**

```powershell
# En configuración del emulador
Settings → Camera → Front camera = Webcam0

# Luego reinicia emulador
```

**B) O usar solo audio (sin video):**

```typescript
// En AgoraCallModal, desabilita video para emulador:
{
  channelName: "call_xxx",
  audio: true,  // ✅ Audio funciona
  video: false  // ❌ Desabilita video en emulador
}
```

**C) O usar 2 dispositivos reales** ⭐ Lo mejor

---

## 🔊 AUDIO TEST (Sin video)

Si solo quieres probar audio:

```
1. Emulador (Conductor): audio + sin video
2. Dispositivo Real (Cliente): audio + video
3. Llama y verifica que se escuchan ambos
```

---

## 🐛 TROUBLESHOOTING

### Error: "Emulador no puede alcanzar Supabase"

```
❌ curl falla
✅ Solución:
   - Emulador → Settings → Wi-Fi → Conectar a misma red
   - O: Usar "10.0.2.2" en lugar de localhost
   - O: Asegurar que Supabase URL es pública (SÍ lo es)
```

### Error: "Video negro en emulador"

```
❌ No se ve cámara
✅ Soluciones:
   1. Habilitar cámara en configuración emulador
   2. O usar solo audio
   3. O usar 2 dispositivos reales
```

### Error: "Notificación no llega"

```
❌ Cliente no ve modal
✅ Soluciones:
   1. Verifica Realtime está escuchando
   2. Verifica que RLS policy permite acceso
   3. Revisa logs: npx supabase functions logs notifyIncomingCall
```

### Error: "Conexión muy lenta"

```
❌ Video laggy, audio cortado
✅ Soluciones:
   1. Emulador usa recursos PC → Cierra otras apps
   2. Aumenta RAM emulador (Settings → Memory = 8GB)
   3. Usa dispositivo real en lugar de emulador
   4. Revisar WiFi (debe ser >5 Mbps)
```

---

## ⚡ RECOMENDACIONES

### Para Testing Rápido:

**Mejor opción: 2 Dispositivos Reales** 📱📱
- ✅ Prueba real de todos los features
- ✅ No hay problemas de emulación
- ✅ Cámara + micrófono funcionan perfecto

### Si SOLO tienes 1 dispositivo:

**Segunda opción: Emulador + Dispositivo Real** 🤖📱
- ✅ Funciona bien
- ⚠️ Emulador lento para video

### Si solo tienes PC:

**Tercera opción: 2 Emuladores** 🤖🤖
- ✅ Ambos en tu PC
- ❌ Muy lento (ambos virtuales)
- ❌ Cámaras virtuales problemáticas
- ✅ Bueno solo para audio test

---

## 🔗 CONFIGURAR EMULADOR PARA VIDEO

Si quieres que emulador tenga cámara:

### Paso 1: Habilitar webcam

```
En Android Studio:
  Device Manager → Pixel 6 Pro → Edit
  
Buscar: Camera → Front camera
- Seleccionar: Webcam0 (o tu cámara USB)

Click: Finish
```

### Paso 2: Darle permisos a app

```powershell
adb shell pm grant com.tmasplus.tmasplus android.permission.CAMERA
adb shell pm grant com.tmasplus.tmasplus android.permission.RECORD_AUDIO
```

### Paso 3: Probar en API

```typescript
// En useAgoraCall.ts, permite video en emulador:

// SOLO para testing en emulador
const enableVideo = !isRunningOnEmulator; // true en real, false en emulador
```

---

## ✅ CHECKLIST - LLAMADA EXITOSA (Emulador + Real)

- [ ] Emulador conectado a WiFi
- [ ] Dispositivo Real conectado a WiFi
- [ ] Ambos logueados con usuarios diferentes
- [ ] Emulador muestra ReservationTripScreen
- [ ] Emulador: Toca "📞 Llamar"
- [ ] Real: Recibe notificación
- [ ] Real: Toca "Aceptar"
- [ ] Emulador: Ve video del dispositivo
- [ ] Real: Ve video del emulador (si está habilitado)
- [ ] Ambos oyen audio
- [ ] Uno toca "Finalizar"
- [ ] Registro en call_notifications creado

**Si todos ✅ → FUNCIONA PERFECTAMENTE** 🎉

---

## 📊 COMPARATIVA

```
                  2 Real   | Real + Emu | 2 Emuladores
────────────────────────────────────────────────────
Video             ✅✅     | ✅⚠️      | ⚠️⚠️
Audio             ✅✅     | ✅✅      | ✅✅
Cámara            ✅✅     | ✅virtual  | virtual
Speed             ✅✅     | ✅⚠️      | ⚠️⚠️
Fácil setup       ✅       | ✅        | ⚠️
Debugging         ⚠️       | ✅        | ✅
────────────────────────────────────────────────────
RECOMENDADO       ⭐⭐⭐   | ⭐⭐     | ⭐
```

---

## 🚀 CÓMO EMPEZAR YA

```powershell
# 1. Abre Android Studio
# 2. Click: Device Manager → Create Virtual Device
# 3. Configura Pixel 6, API 33, 8GB RAM
# 4. Click Play para iniciar
# 5. Espera 2 minutos

# 6. En terminal:
cd Proyecto\ 2026/Completion_2.0/masterchiefpar1
expo run:android

# Escannea QR en emulador + dispositivo real
# ¡A llamar! 📞
```

---

## 📞 REFERENCIAS

- Android Emulator: https://developer.android.com/studio/run/emulator
- Agora Android SDK: https://docs.agora.io/en/video-calling/develop/start-video-call
- Expo Android: https://docs.expo.dev/build/setup/
