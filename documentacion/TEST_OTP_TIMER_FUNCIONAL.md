# 🧪 Test Funcional: Sistema OTP con Timer Persistente (3 minutos)

## 📋 Requisitos Previos
- ✅ 2 dispositivos (físicos o emuladores): 1 Conductor + 1 Cliente
- ✅ O 2 emuladores en paralelo con cuentas diferentes
- ✅ Ambos en la misma red/Supabase de desarrollo
- ✅ Viaje aceptado y conductor llegó al punto de pickup

---

## 🎯 CASO DE PRUEBA 1: Timer Visible en Pantalla (Conductor)

### Conductor - Pantalla ReservationTripScreen

**Paso 1: Confirmar Llegada**
```
1. Navegar a viaje aceptado
2. Ver botón "Confirmar Llegada" 
3. Click en "Confirmar Llegada"
4. ✅ VERIFICAR: Aparece UI con contador "⏱️ 03:00"
   - Texto: "Código será compartido en"
   - Timer visible con reloj
   - Status: "Esperando al pasajero"
```

**Paso 2: Esperar 3 Minutos (Primera Mitad)**
```
5. Observar contador disminuyendo cada segundo:
   ✅ 02:55 → 02:50 → ... (verificar actualizaciones en tiempo real)
6. NO debe aparecer el código todavía
7. Input de OTP debe estar DESHABILITADO (gris)
8. Botón "Confirmar" debe mostrar "Esperando..." o deshabilitado
```

**Paso 3: Logs en Consola**
```
9. Abrir console (adb logcat en Android o Xcode en iOS)
10. ✅ BUSCAR LOG:
    - "⏱️ Iniciando timer para booking: [booking-id]"
    - Cada segundo: sin spam de logs (máximo 1 log cada 5 segundos)
    - "📡 [REALTIME] Actualización de timer"
11. ✅ NO DEBE HABER ERROR:
    - "Cannot find name 'supabase'" ← Ya corregido
    - Stack traces rojos
```

---

## 🎯 CASO DE PRUEBA 2: Timer Expira - Modal Auto-Muestra (Conductor)

### Conductor - Después de 3 Minutos

**Paso 1: Timer Llega a Cero**
```
1. Esperar contador: 00:03 → 00:02 → 00:01 → 00:00
2. ✅ VERIFICAR: Modal OTP aparece AUTOMÁTICAMENTE
   - No hacer click manualmente
   - Debe aparecer solo después de tiempo
3. Modal muestra:
   - "Código OTP: ****" (4 dígitos)
   - Input vacío para verificación
   - Botón "Confirmar"
   - "Esperando verificación del cliente..."
```

**Paso 2: Input Habilitado**
```
4. ✅ VERIFICAR: Input está HABILITADO (blanco/editable)
5. Teclado debe mostrar
6. Puede escribir/borrar caracteres
```

**Paso 3: Logs en Consola**
```
7. ✅ BUSCAR LOG:
    - "⏰ [TIMER EXPIRED] Llamando callback onTimerExpired"
    - "✅ OTP code enviado al conductor: [code]"
8. ✅ NO DEBE HABER ERROR de modal no encontrado
```

---

## 🎯 CASO DE PRUEBA 3: Persistencia - Cerrar App y Reabre (Conductor)

### Conductor - Cierre y Reapertura

**Paso 1: Cierre Mitad de Timer**
```
1. Timer mostrando: 01:30 (mitad restante)
2. Forzar cierre de app:
   - Android: Apretar stop en recent apps
   - iOS: Swipe up desde recent apps
3. Esperar 3 segundos
4. Reabre la app
```

**Paso 2: Timer Debe Persistir**
```
5. ✅ VERIFICAR: Timer aparece:
   - Aproximadamente 60-90 segundos restantes (no volvió a 3 min)
   - Contador sigue disminuyendo
6. NO debe reiniciar a 03:00
7. No debe fallar al cargar
```

**Paso 3: Cierre Cerca del Final**
```
8. Esperar hasta: 00:15 (15 segundos)
9. Forzar cierre nuevamente
10. Esperar 20 segundos (más que lo restante)
11. Reabre app
```

**Paso 4: Modal Debe Estar Visible**
```
12. ✅ VERIFICAR: Modal OTP aparece automáticamente
    - No hay timer, va directo al modal
    - Código ya está visible
    - Input habilitado
    - Puede escribir OTP
```

**Paso 5: Logs en Consola**
```
13. ✅ BUSCAR LOG al reabre:
    - "📱 [useOtpTimer] Fetch timer state on mount"
    - Se recalcula tiempo desde servidor (NO del dispositivo)
    - "✅ Timer state loaded: 00:15" (o similar)
```

---

## 👥 CASO DE PRUEBA 4: Cliente Ve Countdown en Tiempo Real

### Cliente - Pantalla Principal / Notificación

**Paso 1: Notificaciones en t=0**
```
1. Momento: Conductor confirma llegada
2. ✅ VERIFICAR cliente recibe 2 notificaciones:
   a) "📍 Tu conductor ha llegado - Código en 3 minutos"
      (Push notification)
   b) [Segunda notificación de pago/info]
3. Debe ser casi instantáneo (<5 segundos)
```

**Paso 2: Cliente Ve Countdown Sincronizado**
```
4. Cliente abre app (o ve elemento flotante)
5. ✅ VERIFICAR: Componente OtpCountdownNotification:
   - Muestra "⏳ Tu conductor ha llegado..."
   - Contador: "03:00" → "02:59" → ... (sincronizado con servidor)
   - NO depende del reloj local del cliente
6. Color debe ser CYAN (#00E5FF) en countdown normal
7. Animación suave (sin saltos)
```

**Paso 3: Cambio de Color en 30 Segundos**
```
8. Esperar hasta: 00:30
9. ✅ VERIFICAR: Color cambia a MAGENTA (#E91E63)
   - Indica urgencia/último tramo
   - Mismo tiempo en todos los dispositivos
```

**Paso 4: Notificación a los 3 Minutos**
```
10. Timer llega a 00:00
11. ✅ VERIFICAR cliente recibe:
    - "🔐 Código disponible - ¡Pide el código!"
    - mensaje en app: "✅ Tu conductor puede iniciar el viaje"
12. UI actual: "Esperando al conductor" → "Código disponible"
```

**Paso 5: Verificación de Código por Cliente**
```
13. Conductor escribe/compartiliza código
14. Cliente entra código en app
15. ✅ VERIFICAR recibe notificación:
    - "✅ Código verificado - ¡El viaje está a punto de comenzar!"
    - "🚗 Servicio iniciando - Tu conductor está listo"
16. En app: Status cambia a "VIAJE EN PROGRESO"
```

---

## 👥 CASO DE PRUEBA 5: Cliente Cierra App - Countdown Persiste

### Cliente - Cierre y Reapertura

**Paso 1: Cliente Cierra a Mitad**
```
1. Cliente viendo countdown: 01:45
2. Cierre fuerza de app
3. Esperar 5 segundos
4. Reabre
```

**Paso 2: Countdown Continúa**
```
5. ✅ VERIFICAR: Countdown mágicamente aparece con ~1:40 restante
   - NO reinició a 03:00
   - La sincronización fue desde servidor (usando otp_timer_started_at)
6. Sigue disminuyendo normalmente
```

**Paso 3: Cliente Cierra Después de Expirar**
```
7. Esperar hasta: 00:00 (timer expirado)
8. Conductor sale del modal (cierre fuerza)
9. Cliente cierra app
10. Esperar 10 segundos
11. Reabre cliente
```

**Paso 4: UI Actualizada**
```
12. ✅ VERIFICAR:
    - NO muestra countdown (ya expiró)
    - Muestra: "Código disponible - Pide el código"
    - Status correcto sincronizado
```

---

## 🔍 CASO DE PRUEBA 6: Verificación en Supabase

### Base de Datos - Validar Estados

**Paso 1: Antes de Confirmar Llegada**
```
Tabla: bookings
ID: [viaje-id]
Buscar campos:
- otp_timer_started_at: NULL (todavía no iniciado)
- otp_timer_duration: 180
- status: ACCEPTED (viaje aceptado)
```

**Paso 2: Después de Confirmar Llegada**
```
Actualizar pantalla / refresh datos

Verificar:
✅ otp_timer_started_at: 2026-04-06T00:15:30.123Z (timestamp ahora)
✅ otp_timer_duration: 180 (fijo)
✅ status: ACCEPTED (sigue igual)
✅ otp: [código-4-dígitos] (generado)
✅ otp_verified: false (aún no verificado)
```

**Paso 3: Después de Verificar Código**
```
Conductor entra código correcto, cliente verifica

Verificar:
✅ otp_verified: true (código verificado)
✅ otp_timer_started_at: NULL (reset después de verificación)
✅ status: IN_PROGRESS o TRIP_STARTED (viaje iniciando)
```

---

## 📊 TABLA DE VERIFICACIÓN

| Requisito | Paso | Resultado Esperado | ✅/❌ |
|-----------|------|-------------------|------|
| Timer visible en conductor | 1.1 | Muestra "03:00" en UI | |
| Timer decrementa segundo a segundo | 1.2 | 03:00 → 02:59 → ... | |
| Código NO visible en primeros 3 min | 1.2 | Input deshabilitado | |
| Modal aparece automáticamente | 2.1 | Tras 3 min, popup | |
| Input habilitado tras expiración | 2.2 | Puede escribir | |
| Timer persiste tras cerrar app | 3.2 | No reinicia a 3:00 | |
| Cliente recibe notificación en t=0 | 4.1 | 2 pushs recibidos | |
| Cliente ve countdown sincronizado | 4.2 | Mismo valor que servidor | |
| Cliente recibe notificación en t=180 | 4.4 | "Código disponible" | |
| Color cambia en 30 seg | 4.3 | CYAN → MAGENTA | |
| Cliente cierra/reabre → persiste | 5.2 | No reinicia | |
| Supabase tiene timestamp correcto | 6.2 | otp_timer_started_at ≠ NULL | |
| Supabase verifica código | 6.3 | otp_verified = true | |

---

## 🐛 Debugging

### Si Timer NO Decrece
```
Revisar:
1. Console log "📡 [REALTIME] Actualización de timer" (cada segundo)
2. fetchTimerState() está siendo llamado
3. Supabase connection OK
4. Sincronización de hora servidor vs cliente

Solución:
- Refresh manualmente
- Reiniciar app
- Verificar internet connection
```

### Si Modal NO Aparece Después de 3 Min
```
Revisar:
1. Console: "⏰ [TIMER EXPIRED] Llamando callback" ← debe haber
2. hasCalledExpiredRef.current ← no debe ser múltiple
3. mostrando error "Cannot find name supabase" en ReservationTripScreen
4. useOtpTimer hook props correctos

Solución:
- Verificar imports están OK (ya corregido)
- Revisar useEffect dependency array
- Verificar booking_id está siendo pasado
```

### Si Cliente NO Recibe Notificaciones
```
Revisar:
1. Push token guardado en BD (user.pushToken)
2. Notifications habilitadas en dispositivo
3. Servicio de notificaciones iniciado
4. Console: "📱 Enviando notificación a cliente: ..."

Solución:
- Verificar NotificationService imports
- Confirmar token push en Supabase
- Revisar permisos de notificaciones del SO
```

### Si Countdown NO Persiste tras cerrar app
```
Revisar:
1. otp_timer_started_at guardado en Supabase (DB)
2. useOtpTimer está fetcheando desde servidor
3. NO está usando state local (que se pierde al cerrar)
4. fetchTimerState() recalcula desde timestamp

Solución:
- Verificar timestamp es Date ISO string
- Confirmar cálculo: (now - startTime) / 1000
- Revisar logs: "Fetch timer state on mount"
```

---

## ✅ Test Pasó Si

```
✅ Timer visible en conductor desde el minuto 1
✅ Timer decrementa en tiempo real (sincronizado)
✅ Timer no reinicia após app close (persiste)
✅ Código aparece SOLO después de 3 minutos
✅ Modal auto-muestra cuando timer = 0
✅ Input habilitado para escribir OTP tras timer
✅ Cliente ve el mismo timer (sincronizado)
✅ Cliente recibe notificaciones en t=0 y t=180
✅ Color cambia a magenta en 30 seg finales
✅ Cliente puede ingresar código y verifica
✅ Supabase timestamps son correctos
✅ Sin errores en console (rojo)
```

---

## 🚀 Comandos Útiles

### Limpiar Estado (Si Falla)
```bash
# Android emulator - reset data
adb shell pm clear com.agora.masterchiefpar1

# Kill todos los emuladores y reiniciar
adb devices
adb emu kill
```

### Ver Logs en Tiempo Real
```bash
# Android
adb logcat | grep -i "otp\|timer\|realtime"

# Supabase CLI
supabase functions list
```

### Verificar Timestamp en Supabase
```sql
SELECT 
  id, 
  reference,
  otp,
  otp_verified,
  otp_timer_started_at,
  EXTRACT(EPOCH FROM otp_timer_started_at) as unix_timestamp,
  NOW() - otp_timer_started_at as tiempo_transcurrido
FROM bookings
WHERE id = 'YOUR_BOOKING_ID';
```

---

## 📝 Notas

- **Realtime de Supabase:** Usa subscripción `.on('*')` para cambios
- **Persistencia:** Depende de timestamp en DB, no del reloj local
- **Token:** Para tests sin notificaciones reales, verificar console logs
- **Colores:** Implementados en OtpCountdownNotification.tsx (línea ~85)
- **Callback Fired Once:** Usa `hasCalledExpiredRef` para evitar múltiples triggers

---

## 📞 Puntos de Contacto en Código

| Componente | Archivo | Línea |
|-----------|---------|-------|
| Timer Hook | `hooks/useOtpTimer.ts` | ~60 (fetchTimerState) |
| Modal OTP | `components/OtpModal.tsx` | ~40 (props) |
| Countdown Cliente | `components/OtpCountdownNotification.tsx` | ~1 |
| Pantalla Conductor | `app/(tabs)/ReservationTripScreen.tsx` | ~440 (loadExistingOtp) |
| Pantalla Cliente | `app/(tabs)/Home*.tsx` o notification view | - |

