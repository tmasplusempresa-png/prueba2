# Soluciones para Problemas de Conexión del Emulador Android

## 🔍 Paso 1: Diagnóstico

Ejecuta el script de diagnóstico:

**Windows (PowerShell):**
```powershell
cd "C:\Users\andre\Desktop\Proyecto 2026\App_TmasPlus_desarrollo"
.\diagnose-emulator.ps1
```

**Mac/Linux (Bash):**
```bash
cd "/path/to/App_TmasPlus_desarrollo"
bash diagnose-emulator.sh
```

---

## 🔧 Paso 2: Soluciones según el resultado

### **Caso 1: ❌ "No hay emuladores conectados"**

El emulador no está levantado. Soluciona así:

1. Abre **Android Studio**
2. Haz clic en **Device Manager** (lado derecho)
3. Busca tu emulador (ej: "Pixel 5 API 33")
4. Haz clic en el botón de **Play** (▶️)
5. Espera a que levante completamente

---

### **Caso 2: ❌ "Emulador NO tiene acceso a Internet"**

El emulador está desconectado de Internet. Soluciona así:

**Opción A: Reiniciar emulador (Rápido)**
```powershell
adb emu kill
```
Luego abre Android Studio y presiona Play nuevamente.

**Opción B: Verificar configuración de red (Completo)**
1. En el emulador corriendo, abre **Settings** (⚙️)
2. Ve a **System > About emulated device > Advanced**
3. Busca **Network proxy** y asegúrate de que esté en "None"
4. Busca **Sim card status** y verifica que esté habilitada
5. Vuelve atrás y ve a **Settings > Network & internet**
6. Asegúrate de que el WiFi o datos móviles estén ON
7. Reinicia el emulador

**Opción C: Limpiar caché del emulador**
```powershell
# Encuentra tu AVD
adb avdmanager list avd

# Borra la caché (donde "Pixel_5_API_33" es tu AVD)
adb -e emu kill
# Luego ve a: C:\Users\<tu_usuario>\.android\avd\Pixel_5_API_33.avd
# Borra la carpeta "cache"
# Reinicia Android Studio
```

---

### **Caso 3: ⚠️ "Problema con DNS"**

El emulador no puede resolver dominios. Soluciona así:

```powershell
# Cambia el DNS del emulador a Google
adb shell settings put global dns1 8.8.8.8
adb shell settings put global dns2 8.8.4.4

# Verifica
adb shell getprop net.dns1
adb shell getprop net.dns2
```

---

### **Caso 4: ❌ "No puedes alcanzar Supabase"**

Internet funciona pero Supabase no. Posibles causas:

**Causa A: Firewall bloqueando HTTPS**
- Desactiva tu firewall temporalmente y reinicia el emulador
- O agrega una excepción para `*.supabase.co`

**Causa B: VPN interfiriendo**
- Desactiva cualquier VPN
- Desactiva cualquier proxy

**Causa C: Certificados SSL vencidos**
```powershell
# Sincroniza la fecha del emulador
adb shell date -s "$(date -u +%m%d%H%M%Y.%S)"

# O en el emulador:
# Settings > System > Date & time
# Quita "Automatic date & time"
# Establece manualmente la fecha correcta
```

---

## 📊 Paso 3: Verificar que funciona

Una vez que los tests de `diagnose-emulator.ps1` muestren:
- ✅ Emulador TIENE acceso a Internet
- ✅ DNS funcionando correctamente
- ✅ Puedes alcanzar Supabase

Entonces reinicia Expo:

```powershell
cd "C:\Users\andre\Desktop\Proyecto 2026\App_TmasPlus_desarrollo"
npx expo start --clear
```

---

## 🧪 Paso 4: Probar la validación

En tu app, ve a SignUp y:

1. **Ingresa un email**: `andresfelipecristancho2014@gmail.com`
2. **Abre la consola de debugger** (menú de Debug en Expo)
3. **Comparte los logs que veas**

Deberías ver:
```
🔍 Verificando email: andresfelipecristancho2014@gmail.com
⏳ Buscando en tabla users...
📊 Resultado búsqueda en users (234ms): { exists: true, count: 1 }
⚠️ Email YA existe en tabla users
❌ Email existe (tiempo total: 456ms)
🏁 Finalizando verificación de email
```

---

## 📝 Información útil

**Puertos importantes:**
- Supabase: HTTPS (443) - debe estar abierto
- Expo: 19000-19001 - debe estar abierto en tu firewall

**Verificar puertos abiertos:**
```powershell
adb shell netstat | grep ESTABLISHED
```

**Logs del emulador:**
```powershell
adb logcat | grep -i "supabase\|network\|https"
```

---

## 🆘 Si nada de esto funciona

Crea un issue con:
1. Output de `diagnose-emulator.ps1`
2. Los logs de la consola cuando intentas registrarte
3. Tu versión de Android Studio
4. Tu versión de Expo

