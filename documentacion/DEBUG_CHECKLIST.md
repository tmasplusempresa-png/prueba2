# 🔧 DEBUGGING CHECKLIST - OTP Timer Flow

## 1️⃣ VERIFICAR COMPILACIÓN

```bash
cd masterchiefpar1
npm start
```

**¿Qué ves?**
- [ ] App compila SIN ERRORES
- [ ] App compila CON ERRORES → **Anota cuáles en la línea "Errores encontrados"**
- [ ] Metro bundler entra en bucle infinito

**Errores encontrados:**
```
[Describe aquí qué errores ves]
```

---

## 2️⃣ VERIFICAR IMPORTES

**En Terminal, ejecuta:**
```bash
npm ls react-native-animatable
npm ls @react-navigation/native
npm ls expo-notifications
```

**¿Todos están instalados?**
- [ ] Sí
- [ ] No → Instalar: `npm install react-native-animatable @react-navigation/native expo-notifications`

---

## 3️⃣ NAVEGAR EN LA APP (CLIENTE)

**1. Abre la app**
- [ ] Carga sin errores
- [ ] Puedes ver la pantalla principal
- [ ] Click en "¿A dónde vamos?" funciona

**2. Crea un viaje**
- Origen: "Cra 7 con Calle 20"
- Destino: "Cra 15 con Calle 30"  
- Click "Crear Viaje"

**¿Qué pasa?**
- [ ] A) Nova pantalla "Mi Viaje Activo" ✅ CORRECTO
- [ ] B) Vuelve a CustomerHomeScreen ❌ ERROR - No navegó
- [ ] C) Crash/error en console ❌ ERROR - Problema en navegación
- [ ] D) Otro: ___________________

**Si es B o C, anota el error:**
```
[Error específico aquí]
```

---

## 4️⃣ VERIFICAR REALTIME (SUPABASE)

**Si llegaste a "Mi Viaje Activo":**

1. **Anota la REFERENCIA** del viaje (ej: ABC123)

2. **Abre Supabase SQL Editor**

3. **Ejecuta esta query:**
```sql
SELECT id, reference, status, driver, driver_name, otp_timer_started_at
FROM bookings 
WHERE reference = 'ABC123'
LIMIT 1;
```

**¿Qué ves?**
- [ ] El viaje aparece con status='PENDING'
- [ ] El viaje NO aparece ❌ ERROR - Revisar bookingId
- [ ] Error en SQL ❌ ERROR - Tabla no existe

**Resultado:**
```
[Paste aquí el resultado SQL]
```

---

## 5️⃣ SIMULAR ACEPTACIÓN (SUPABASE)

**Ejecuta en SQL:**
```sql
UPDATE bookings 
SET status='ACCEPTED', 
    driver='test-driver', 
    driver_name='Test Driver',
    plate_number='TEST-001'
WHERE reference = 'ABC123'
LIMIT 1;
```

**¿Qué pasa en el CLIENTE (Mi Viaje Activo)?**
- [ ] A) Pantalla se actualiza automáticamente (sin refrescar) ✅ REALTIME FUNCIONA
- [ ] B) Pantalla NO se actualiza (sigue "Buscando...") ❌ REALTIME NO FUNCIONA
- [ ] C) App crashea ❌ ERROR - Problema en subscription
- [ ] D) Otro: ___________________

**Si es B, anota si en console dice:**
```
📡 [REALTIME] Booking actualizado: ...
```
- [ ] Sí (log aparece)
- [ ] No (log NO aparece)

---

## 6️⃣ SIMULAR CONFIRMACIÓN DE LLEGADA (CONDUCTOR)

**Abre 2do EMULADOR/DISPOSITIVO (Conductor)**

1. Abre app
2. Navega a "Reservas de Conductor" (tab conductor)
3. ¿Ves el viaje "ABC123 - Origen → Destino"?
   - [ ] Sí
   - [ ] No ❌ ERROR - No carga reservas

4. Si sí, click "Aceptar"
5. ¿Navega al mapa?
   - [ ] Sí
   - [ ] No - Click en "Ir al viaje" en el alert
   - [ ] Error ❌ ERROR - Anota cuál

6. En el mapa, click "Confirmar Llegada"
7. ¿Qué pasa?
   - [ ] A) Aparece UI con timer "03:00" ✅ CORRECTO
   - [ ] B) Se congela en "Confirmando..." ❌ ERROR - Anota tiempo
   - [ ] C) Error en console ❌ ERROR - Anota cuál
   - [ ] D) Otro: ___________________

**En console del CONDUCTOR, busca:**
```
✅ Timer OTP iniciado - 3 minutos de espera
```
- [ ] Log aparece
- [ ] Log NO aparece ❌ ERROR

---

## 7️⃣ VERIFICAR TIMER DECREMENTA (CONDUCTOR)

**Observa el timer en el CONDUCTOR:**

- [ ] A) Timer baja cada segundo: 03:00 → 02:59 → 02:58 ✅ FUNCIONA
- [ ] B) Timer está congelado: siempre 03:00 ❌ ERROR - Timer no inició
- [ ] C) Timer salta: 03:00 → 02:00 → 01:00 (salta 30 sec) ❌ ERROR - Fetcheando mal
- [ ] D) Timer desaparece después de X segundos ❌ ERROR - Fase cambió

---

## 8️⃣ VERIFICAR COUNTDOWN EN CLIENTE

**De vuelta en CLIENTE (Mi Viaje Activo):**

**¿Qué pasa después que conductor confirma llegada?**
- [ ] A) Aparece OtpCountdownNotification con "03:00" ✅ CORRECTO
- [ ] B) Pantalla se actualiza pero NO muestra countdown ❌ ERROR
- [ ] C) Sigue mostrando "Conductor en camino" ❌ ERROR - Sin realtime
- [ ] D) Error en console ❌ ERROR - Anota cuál

**El countdown:**
- [ ] Decrece cada segundo ✅
- [ ] Está estático ❌
- [ ] No se ve (está fuera de pantalla) ❌

---

## 9️⃣ ESPESAR 3 MINUTOS (O SIMULAR)

**En el CONDUCTOR, después de 3 min:**

- [ ] A) Modal OTP aparece automáticamente ✅ CORRECTO
- [ ] B) Timer llega a 00:00 pero NO aparece modal ❌ ERROR
- [ ] C) Modal desaparece después de aparecer ❌ ERROR
- [ ] D) Otro: ___________________

**Console log en CONDUCTOR:**
```
⏰ [TIMER EXPIRED] Llamando callback onTimerExpired
```
- [ ] Aparece
- [ ] NO aparece ❌ ERROR

---

## 🔟 VERIFICAR SUPABASE DESPUÉS (VERIFICAR DATOS)

**Ejecuta en SQL:**
```sql
SELECT id, reference, status, otp, otp_verified, otp_timer_started_at
FROM bookings 
WHERE reference = 'ABC123'
LIMIT 1;
```

**Resultado esperado:**
```
reference    | status   | otp   | otp_verified | otp_timer_started_at
ABC123       | ACCEPTED | 1234  | false        | 2026-04-07 15:30:00 (timestamp actual)
```

**¿Es así?**
- [ ] Sí ✅
- [ ] No - anota qué diferencia tiene:
  ```
  [Resultado actual aquí]
  ```

---

## 📋 RESUMEN RÁPIDO

Marca ONE opción:

```
[ ] TODO FUNCIONA - No hay problemas
[ ] ERROR EN COMPILACIÓN - Ver sección 1️⃣
[ ] NO NAVEGA A CustomerActiveTrip - Ver sección 3️⃣
[ ] REALTIME NO ACTUALIZA - Ver sección 5️⃣
[ ] TIMER NO INICIA EN CONDUCTOR - Ver sección 6️⃣
[ ] TIMER NO DECRECE - Ver sección 7️⃣
[ ] COUNTDOWN NO VE EN CLIENTE - Ver sección 8️⃣
[ ] MODAL NO APARECE DESPUÉS DE 3 MIN - Ver sección 9️⃣
[ ] SUPABASE DATOS INCORRECTOS - Ver sección 🔟
[ ] OTRO PROBLEMA - Describa abajo:
```

**Descripción del otro problema:**
```
[Aquí tu descripción]
```

---

## 🚨 CONTACTO CON LOGS

**Cuando reportes errores, incluye:**

1. **Exact error message** (copy-paste de console)
2. **Línea del error** (ej: "OnUpdate.ts:45")
3. **Qué estabas haciendo** (ej: "Acababa de click Aceptar")
4. **Screenshot** (si es posible)

