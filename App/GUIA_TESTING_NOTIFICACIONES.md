# 🔔 GUÍA COMPLETA DE TESTING DE NOTIFICACIONES

## 📋 Índice
1. [Configuración Inicial](#configuración-inicial)
2. [Notificaciones del Cliente](#notificaciones-del-cliente)
3. [Notificaciones del Conductor](#notificaciones-del-conductor)
4. [Notificaciones en Segundo Plano](#notificaciones-en-segundo-plano)
5. [Restauración de Estado](#restauración-de-estado)
6. [Debugging y Logs](#debugging-y-logs)

---

## 🚀 Configuración Inicial

### Pre-requisitos
- App instalada en emulador (ya hecha ✅)
- Dos cuentas de prueba: una de cliente, otra de conductor
- Acceso a Supabase dashboard
- Emulador con conexión a internet

### Activar Debug de Notificaciones
En `LoginScreen.tsx` hay un sistema de testing, presiona el logo T+Plus 6 veces para acceder a la consola de debug.

```bash
# Ver logs en tiempo real
adb logcat | grep -i notification
```

---

## 📱 NOTIFICACIONES DEL CLIENTE

### 1️⃣ Test: Notificación al Aceptar Viaje

**Rol:** Cliente solicitante

**Pasos:**
1. Inicia sesión como CLIENTE
2. Ve a "Buscar Viaje" o "Reservas"
3. Solicita un servicio (inmediato o reserva)
4. En MODO DE TEST: abre el emulador del conductor
5. Acepta manualmente el viaje

**Resultado Esperado:**
- ✅ Notificación visual: **"Tu viaje fue aceptado"**
- ✅ Título: "Tu viaje fue aceptado"
- ✅ Cuerpo: "Tu conductor está en camino. Precio estimado $35,000..."
- ✅ La notificación es PERSISTENTE (sticky) - no desaparece
- ✅ Al tocarla, navega a `CustomerActiveTripScreen`
- ✅ Canal: `tmasplus-active-trip` (MAX importance)
- ✅ Sonido y vibración activos

**Validations:**
```javascript
// Verificar en Firebase/Supabase que se envió la notificación
SELECT * FROM notifications 
WHERE user_id = 'cliente_id' 
  AND type = 'trip_accepted' 
  ORDER BY created_at DESC LIMIT 1;
```

---

### 2️⃣ Test: Notificación "Conductor Llegó"

**Rol:** Cliente en viaje activo

**Pasos:**
1. Desde el viaje aceptado anterior, espera o simula que el conductor hace "Llegar a origen"
2. Conductor hace click en "He llegado" en su pantalla

**Resultado Esperado:**
- ✅ Notificación visual: **"Tu conductor ha llegado"**
- ✅ Título: "Tu conductor ha llegado"
- ✅ Cuerpo: "Tu conductor ha llegado. Presenta tu código y comienza el viaje."
- ✅ La notificación REEMPLAZA la anterior (mismo ID)
- ✅ Al tocarla, sigue en `CustomerActiveTripScreen`

---

### 3️⃣ Test: Notificación "Viaje en Curso"

**Pasos:**
1. Desde "Conductor Llegó", cliente confirma que el viaje comienza
2. Conductor hace click en "Iniciar Viaje"

**Resultado Esperado:**
- ✅ Notificación visual: **"Tu viaje está en curso"**
- ✅ Título: "Tu viaje está en curso"
- ✅ Cuerpo: "Tu viaje está activo. Abre la app para ver el estado..."
- ✅ Chat y tracking en tiempo real funciona
- ✅ Ubicación del conductor se actualiza en vivo

---

### 4️⃣ Test: Notificación Desaparece al Finalizar

**Pasos:**
1. Viaje en curso. Conductor llega a destino.
2. Conductor hace click en "Completar Viaje" → Pago
3. Cliente confirma pago

**Resultado Esperado:**
- ✅ La notificación desaparece (se llama `cancelActiveTripNotification()`)
- ✅ Se puede ver el historial del viaje completado
- ✅ Opción de dejar rating diferente aparece

---

## 🚗 NOTIFICACIONES DEL CONDUCTOR

### 5️⃣ Test: Notificación "Conductor Activo" al Iniciar Modo

**Rol:** Conductor

**Pasos:**
1. Inicia sesión como CONDUCTOR
2. En home, activa "Modo Conductor" (toggle ON)

**Resultado Esperado:**
- ✅ Notificación visual: **"🚗 T+Plus — Conductor Activo"**
- ✅ Cuerpo: "[Nombre], estás en línea recibiendo solicitudes"
- ✅ Notificación es PERSISTENTE (no dismissable)
- ✅ Canal: `driver-active` (LOW importance, sin sonido molesto)
- ✅ Tapping la notificación trae la app al foreground
- ✅ Se puede ver la notificación en la barra de estado incluso cerrada la app

**Validación en DB:**
```javascript
// Verificar que driver_mode_active = true
SELECT id, driver_mode_active, updated_at FROM profiles 
WHERE id = 'conductor_id';
```

---

### 6️⃣ Test: Notificación Actualiza During Viaje

**Pasos:**
1. Conductor en modo activo. Cliente solicita viaje.
2. Conductor acepta el viaje.

**Resultado Esperado:**
- ✅ La notificación sticky se ACTUALIZA (no se crea una nueva)
- ✅ Ahora dice: **"Servicio [REF123]. Precio $35,000. Abre para iniciar"**
- ✅ Sigue siendo sticky y no dismissable

**Durante fases del viaje:**
- ACCEPTED → "Servicio aceptado"
- ARRIVED → "Cliente en punto de encuentro"
- STARTED → "Viaje en curso"

---

### 7️⃣ Test: Notificación Desaparece al Desactivar Modo Conductor

**Pasos:**
1. Conductor completa un viaje
2. Desactiva "Modo Conductor" (toggle OFF)

**Resultado Esperado:**
- ✅ La notificación desaparece inmediatamente
- ✅ No hay más notificaciones de nuevos viajes
- ✅ `driver_mode_active` en DB pasa a false
- ✅ `DRIVER_MODE_STORAGE_KEY` se limpia de AsyncStorage

---

## 🌙 NOTIFICACIONES EN SEGUNDO PLANO

### 8️⃣ Test: App Cerrada, Llega Nueva Solicitud

**Rol:** Conductor

**Pasos:**
1. Conductor en modo activo
2. Cierra completamente la app (swipe away)
3. Desde otra ventana, cliente solicita viaje
4. La notificación llega al conductor

**Resultado Esperado:**
- ✅ Notificación llega incluso con app cerrada
- ✅ Sonido y vibración funcionan
- ✅ Al tocar la notificación, abre la app DIRECTAMENTE en el viaje
- ✅ No hay login nuevamente (sesión persiste)

**Debugging:**
```bash
# Ver si la notificación llegó al FCM
adb shell
dumpsys notification | grep -i tmasplus
```

---

### 9️⃣ Test: Viaje Activo Persiste Tras Cerrar App

**Rol:** Cliente EN VIAJE ACTIVO

**Pasos:**
1. Cliente tiene un viaje activo ("Viaje en curso")
2. Cierra la app completamente (swipe away)
3. Espera 10 segundos
4. Abre la app de nuevo

**Resultado Esperado:**
- ✅ La notificación de viaje SIGUE VISIBLE en la barra de estado
- ✅ Al tocar la notificación, navega directamente a `CustomerActiveTripScreen`
- ✅ El viaje se restaura automáticamente
- ✅ Puede ver la ubicación del conductor actualizada
- ✅ El conductor SIGUE actualizando la ubicación en tiempo real

**Validación Técnica:**
```typescript
// Se valida en AppStateRestoration.ts
- Lee: ACTIVE_TRIP_STORAGE_KEY
- Verifica en DB que booking.status sea ACTIVO
- Llama: scheduleActiveTripNotification(booking, 'customer')
```

---

### 🔟 Test: Conductor Desaparece, Notificación Persiste

**Rol:** Conductor

**Pasos:**
1. Conductor tiene viaje activo
2. Se "mata" el proceso de la app (kill -9)
3. Se reinicia la app (abre desde icono)

**Resultado Esperado:**
- ✅ La notificación SIGUE VISIBLE
- ✅ Al abrirse, se llama `restoreAppState(userId)`
- ✅ Se verifica en DB que hay viaje activo
- ✅ Se restaura la notificación automáticamente
- ✅ Se puede continuar el viaje sin perder datos

---

## 🔄 RESTAURACIÓN DE ESTADO

### 1️⃣1️⃣ Test: Notificaciones No Aparecen tras Completar Viaje

**Pasos:**
1. Completa un viaje exitosamente
2. Cierra la app (swipe away)
3. Abre la app de nuevo después de 30 segundos

**Resultado Esperado:**
- ✅ NO hay notificación de viaje activo
- ✅ El viaje aparece en historial con estado "COMPLETED"
- ✅ No hay "remnants" de viajes anteriores

---

### 1️⃣2️⃣ Test: Multiple Users - Notificaciones Correctas

**Pasos:**
1. Abre la app como CLIENTE
2. Solicita viaje, recibes notificación
3. Cierra sesión
4. Abre sesión como CONDUCTOR
5. Activa modo conductor

**Resultado Esperado:**
- ✅ Las notificaciones anteriores del cliente se LIMPIAN
- ✅ Solo ves la notificación del conductor activo
- ✅ `AsyncStorage` se limpia correctamente por usuario
- ✅ No hay "cross-contamination" de datos

---

### 1️⃣3️⃣ Test: Logs de Restauración

**Pasos:**
1. En debug console, ejecuta:
```typescript
import { getRestorationLogs, clearRestorationLogs } from '@/common/services/AppStateRestoration';

// Ver logs
const logs = await getRestorationLogs();
console.log(logs);

// Limpiar
await clearRestorationLogs();
```

**Resultado Esperado:**
- ✅ Ves un listado de todas las acciones de restauración
- ✅ Timestamps están correctos
- ✅ Se pueden rastrear problemas de restauración

---

## 🐛 DEBUGGING Y LOGS

### Habilitar Logs Detallados

**En `ActiveTripNotificationService.ts`:**
```bash
# Ya incluye console.warn para todos los errores
# Busca líneas que contengan 'ActiveTripNotificationService:'
adb logcat | grep "ActiveTripNotificationService"
```

**En `DriverNotificationService.ts`:**
```bash
adb logcat | grep "DriverNotificationService"
```

**En `NotificationHandlers.ts`:**
```bash
adb logcat | grep "NotificationHandlers"
```

---

### Obtener Token Push para Testing

```typescript
// En cualquier componente
import * as Notifications from 'expo-notifications';

const token = await Notifications.getExpoPushTokenAsync({
  projectId: Constants.expoConfig?.extra?.eas?.projectId,
});
console.log('Push Token:', token.data);
```

Envía este token a tu backend para testing manual de push notifications.

---

### Enviar Notificación Manual de Prueba

**Desde Expo Dashboard:**
1. Ve a [Expo Notification Testing Tool](https://expo.dev/notifications)
2. Pega tu token
3. Envía:
```json
{
  "to": "ExponentPushToken[...]",
  "sound": "default",
  "title": "Test Notification",
  "body": "This is a test",
  "data": {
    "type": "active-trip",
    "bookingId": "test-123",
    "role": "customer"
  }
}
```

---

### Checklist de Testing

**Antes de Deploy:**

- [ ] ✅ Notificación aparece al aceptar viaje
- [ ] ✅ Notificación es persistente (sticky)
- [ ] ✅ Tapping navega al viaje correcto
- [ ] ✅ Notificación desaparece al completar
- [ ] ✅ Conductor ve notificación de "activo"
- [ ] ✅ App cerrada, notificación sigue visible
- [ ] ✅ Viaje se restaura tras cerrar/abrir app
- [ ] ✅ Notificaciones no persisten tras completar
- [ ] ✅ Multiple users sin cross-contamination
- [ ] ✅ Logs de restauración se registran correctamente
- [ ] ✅ No hay crashes por notificaciones
- [ ] ✅ Sonido y vibración funcionan
- [ ] ✅ Canales Android correctos
- [ ] ✅ iOS tiene permisos correctos

---

## 📚 Archivos Relevantes

- `ActiveTripNotificationService.ts` - Notificaciones de viajes activos
- `DriverNotificationService.ts` - Notificaciones del conductor
- `AppStateRestoration.ts` - Restauración de estado
- `NotificationHandlers.ts` - Manejo de respuestas
- `app/(tabs)/_layout.tsx` - Listeners de notificaciones
- `RootLayout.tsx` - Inicialización de restauración

---

## 🆘 Troubleshooting

### "Notificación no aparece"
1. Verifica permisos: ADB → Settings → Apps → Notifications
2. Valida que el canal existe: `setNotificationChannelAsync()`
3. Revisa logs: `adb logcat | grep Notification`

### "Notificación aparece pero no persiste"
1. Verifica `sticky: true` está establecido
2. Valida que la importancia es MAX en Android
3. Recrea el canal: `setNotificationChannelAsync(...)`

### "App no navega al tocar notificación"
1. Revisa que `data.type` es correcto
2. Valida que la ruta existe en Navigation.tsx
3. Agrega logs en `handleNotificationResponse()`

### "Datos se corrompen tras cerrar app"
1. Valida AsyncStorage keys no colisionan
2. Limpia AsyncStorage en logout
3. Revisa que `clearActiveTripId()` se llama al completar

