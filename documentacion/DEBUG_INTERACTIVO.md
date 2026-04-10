# 🔍 GUÍA INTERACTIVA DE DEPURACIÓN - Paso a Paso

## 🎯 OBJETIVO
Encontrar exactamente dónde falla el flujo OTP.

---

## ✅ PASO 1: Verificar Compilación

### En Terminal:
```bash
cd masterchiefpar1
npm start
```

### Qué deberías ver:
```
expo start
Expo CLI is running...
```

### ⚠️ Problemas posibles:

**A) "Cannot find module"**
```
❌ Cannot find module '@/components/CustomerActiveTripScreen'
```
**Solución:** 
- Verifica que el archivo exista: `ls app/(tabs)/CustomerActiveTripScreen.tsx`
- Si no existe, crea nuevamente

**B) "Parsing error"**
```
❌ SyntaxError: Unexpected token in JSON...
```
**Solución:**
- Ejecuta `npm run type-check` para ver errores de TS
- O reconstruye: `rm -rf node_modules .expo && npm install`

**C) Compila OK**
- Si ves `web  ready at ...`, es CORRECTO → **Continúa**

---

## ✅ PASO 2: Abre Emulador

### En otra Terminal:
```bash
# Android
emulator -avd [name-of-avd]

# O si ya está abierto, solo abre el app
# En el metro: presiona 'a' (Android) o 'i' (iOS)
```

### Espera a que cargue:
```
[Espera 30-60 segundos]
Rendering app.json...
```

---

## ✅ PASO 3: Abre DevTools en Browser

### En tu navegador:
```
http://localhost:19000
```

O directamente en el emulador si aparece QR:
- Abre Expo app
- Scan QR

### Verifica:
- [ ] App cargó sin errores rojos
- [ ] Puedes ver la pantalla principal
- [ ] Click "¿A dónde vamos?" abre mapa

---

## ✅ PASO 4: TEST 1 - Navegar a CustomerActiveTrip

### EN LA APP:
1. Click "¿A dónde vamos?"
2. Llena:
   - **Origen:** Cra 7 con Calle 20
   - **Destino:** Cra 15 con Calle 30
3. Scroll y click **"CONFIRMAR RUTA"** (o similar)
4. Elige vehículo
5. Click **"CREAR VIAJE"**

### ¿QUÉ PASA?

**A) ✅ CORRECTO - Navega a "Mi Viaje Activo"**
```
Pantalla muestra:
- "Mi Viaje Activo" (título)
- Status: "Buscando conductor..."
- Referencia: "ABC123" (ejemplo)
```
→ **ANOTA LA REFERENCIA** (la necesitarás después)
→ **Continúa a PASO 5**

**B) ❌ ERROR - No navega / Vuelve a Home**
```
Console show: 
❌ "undefined is not an object (evaluating 'route.params')"
O
❌ "Cannot read property 'bookingId' of undefined"
```
→ **PROBLEMA EN CreateReservationScreen**
→ **Mira SECCIÓN SOLUCIÓN 1 abajo**

**C) ❌ ERROR - Alert pero Sin navegar**
```
App muestra alert "¡Reserva Creada!" 
pero al click "Ver estado del viaje"
vuelve a home o crashea
```
→ **PROBLEMA EN NAVEGACIÓN**
→ **Mira SECCIÓN SOLUCIÓN 2 abajo**

---

## ✅ PASO 5: TEST 2 - Realtime Update

### En Supabase SQL:
1. Abre tu proyecto Supabase
2. SQL Editor → New Query
3. **REEMPLAZA** "ABC123" con tu referencia de PASO 4:

```sql
SELECT id, reference, status, driver, driver_name 
FROM bookings 
WHERE reference = 'ABC123'
LIMIT 1;
```

4. Ejecuta (Cmd+Ctrl+Enter o botón Play)

### ¿QUÉ VES?

**A) ✅ CORRECTO - Viaje existe con status='PENDING'**
```
id                 | reference | status  | driver | driver_name
550e8400-e29b...  | ABC123    | PENDING | null  | null
```
→ **ANOTA EL ID** (lo usarás en las updates)
→ **Continúa**

**B) ❌ ERROR - Viaje NO aparece**
```
[No rows returned]
```
→ **PROBLEMA:** Booking no se guardó en BD
→ **Revisa:** ¿CreateReservationScreen hace `POST` a bookings?
→ **Mira SECCIÓN SOLUCIÓN 3 abajo**

---

## ✅ PASO 6: TEST 3 - Simular Aceptación

### En Supabase SQL:
```sql
UPDATE bookings 
SET status='ACCEPTED', 
    driver='test-driver-1', 
    driver_name='Juan García',
    plate_number='XYZ-789'
WHERE reference = 'ABC123';
```

Ejecuta

### EN LA APP (Cliente):
- **NO HAGAS NADA** - solo observa la pantalla

### ¿QUÉ PASA EN 3-5 SEGUNDOS?

**A) ✅ CORRECTO - Pantalla se actualiza automáticamente**
```
ANTES:
- Status: "Buscando conductor..."
- Sin sección "Tu Conductor"

DESPUÉS:
- Status: "Conductor en camino"
- Aparece: "Tu Conductor" con "Juan García" y "XYZ-789"
```
→ **REALTIME SUBSCRIPTION FUNCIONA** ✅
→ **Continúa a PASO 7**

**B) ❌ ERROR - Pantalla NO se actualiza**
```
Status sigue siendo "Buscando conductor..."
Y no aparece "Tu Conductor"
```
→ **PROBLEMA:** Realtime subscription no está escuchando cambios
→ **Mira SECCIÓN SOLUCIÓN 4 abajo**

---

## ✅ PASO 7: TEST 4 - Simular Llegada del Conductor

### En Supabase SQL:
```sql
UPDATE bookings 
SET otp_timer_started_at=NOW(), 
    otp='1234'
WHERE reference = 'ABC123';
```

Ejecuta

### EN LA APP (Cliente):
- Observa la pantalla nuevamente

### ¿QUÉ PASA?

**A) ✅ CORRECTO - Aparece OtpCountdownNotification**
```
Nueva sección muestra:
- Contador: "03:00" (o cercano a 180)
- Color: CYAN
- Mensaje: "Tu conductor ha llegado..."
- Decrece cada segundo: 03:00 → 02:59 → 02:58 ...
```
→ **COUNTDOWN FUNCIONA** ✅
→ **Continúa a PASO 8**

**B) ❌ ERROR - NO aparece OtpCountdownNotification**
```
Status actualiza a "Conductor ha llegado"
PERO no aparece el countdown
```
→ **PROBLEMA:** OtpCountdownNotification no se renderiza
→ **Mira SECCIÓN SOLUCIÓN 5 abajo**

**C) ❌ ERROR - Aparece pero NO decrece**
```
Muestra "03:00" 
pero después de 10 seg sigue siendo "03:00"
O desaparece
```
→ **PROBLEMA:** useEffect de countdown no está funcionando
→ **Mira SECCIÓN SOLUCIÓN 6 abajo**

---

## 🛠️ SOLUCIONES POR ERROR

### SOLUCIÓN 1: "undefined is not an object (route.params)"

**Ubicación:** CreateReservationScreen.tsx (línea ~515)

**Problema:** El button NO está pasando los params correctamente

**Fix:**
```typescript
// ANTES (INCORRECTO)
[{ text: 'Ver mis reservas', onPress: () => { 
  setAlertVisible(false); 
  nav.navigate('ReservationsScreen'); 
} }]

// DESPUÉS (CORRECTO)
[{ text: 'Ver estado del viaje', onPress: () => { 
  setAlertVisible(false);
  if (created?.id) {
    nav.navigate('CustomerActiveTrip', { 
      bookingId: created.id, 
      booking: created 
    });
  } else {
    console.error('❌ No booking ID:', created);
  }
} }]
```

---

### SOLUCIÓN 2: "Cannot find module 'CustomerActiveTripScreen'"

**Ubicación:** Navigation.tsx

**Problema:** Declaración de ruta falta o importación falta

**Verificar:**
1. ¿El import existe?
```typescript
import CustomerActiveTripScreen from '../(tabs)/CustomerActiveTripScreen';
```

2. ¿Stack.Screen existe?
```typescript
<Stack.Screen name="CustomerActiveTrip" component={CustomerActiveTripScreen} />
```

3. ¿El archivo existe en disco?
```bash
ls app/(tabs)/CustomerActiveTripScreen.tsx
```

Si falta crear el archivo → **Reporta y reenviamos**

---

### SOLUCIÓN 3: "Viaje NO aparece en BD"

**Ubicación:** CreateReservationScreen.tsx (handleSubmit)

**Problema:** El POST a bookings NO está funcionando

**Debug:**
Agregar logs antes de POST:

```typescript
const body = { booking_type, status, ... };
console.log('📤 [POST] Enviando a BD:', body);

const resp = await fetch(`${SUPABASE_URL}/rest/v1/bookings`, {
  method: 'POST',
  headers: { ...headers, Prefer: 'return=representation' },
  body: JSON.stringify(body),
});

console.log('📬 [RESPONSE] Status:', resp.status);

if (!resp.ok) {
  const errText = await resp.text();
  console.error('❌ POST ERROR:', errText);
  throw new Error(errText);
}
```

**¿Qué ves en console?**
- Si status ≠ 201 → Auth error o schema error
- Si error contiene "foreign key" → customer_id inválido
- Reporta exacto el error

---

### SOLUCIÓN 4: "Pantalla NO actualiza (sin realtime)"

**Ubicación:** CustomerActiveTripScreen.tsx (línea ~70)

**Problema:** Realtime subscription no está activo

**Debug:**
Agregar logs en useEffect:

```typescript
useEffect(() => {
  if (!bookingId) {
    console.warn('⚠️ bookingId es null/undefined');
    return;
  }

  const subscription = (supabase as any)
    .from('bookings')
    .on('UPDATE', (payload: any) => {
      console.log('📡 [REALTIME] Cambio detectado:', payload);
      if (payload.new.id === bookingId) {
        setBooking(payload.new);
      }
    })
    .subscribe((status: string) => {
      console.log('📡 [REALTIME] Status:', status);
    });

  return () => { subscription.unsubscribe(); };
}, [bookingId]);
```

**¿Qué ves?**
- Si ves "bookingId es null" → Problem en `route.params`
- Si ves "REALTIME Status: SUSBRIBED" pero NO ve UPDATE → Table permissions
- Si NO ves logs realtime → Supabase config problem

---

### SOLUCIÓN 5: "OtpCountdownNotification no aparece"

**Ubicación:** CustomerActiveTripScreen.tsx (línea ~237)

**Problema:** Condición para renderizar está incorrecta

**Debug:**
Cambiar rendering a:

```typescript
{/* DEBUG */}
<View style={{padding: 10, backgroundColor: 'red'}}>
  <Text style={{color: 'white'}}>
    DEBUG: status={booking.status}, timer={booking.otp_timer_started_at ? 'YES' : 'NO'}
  </Text>
</View>

{/* OTP Countdown */}
{booking.status === 'ACCEPTED' && booking.otp_timer_started_at && (
  <OtpCountdownNotification 
    bookingId={bookingId}
    customerId={booking.customer_id || user?.id}
    visible={true}
  />
)}
```

**¿Qué ves?**
- DEBUG muestra: status=PENDING, timer=NO → DB no actualizó
- DEBUG muestra: status=ACCEPTED, timer=NO → otp_timer_started_at es NULL
- DEBUG muestra: status=ACCEPTED, timer=YES → Debería ver countdown

Si no ves countdown en caso YES → Problema en OtpCountdownNotification

---

### SOLUCIÓN 6: "Countdown NO decrece"

**Ubicación:** OtpCountdownNotification.tsx (línea ~30)

**Problema:** fetchTimerState no se llama cada segundo

**Debug:**
```typescript
useEffect(() => {
  if (!visible || !bookingId) {
    console.warn('⚠️ Countdown hidden or no bookingId');
    return;
  }

  const fetchTimerState = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('bookings')
        .select('otp_timer_started_at')
        .eq('id', bookingId)
        .single();

      if (!data?.otp_timer_started_at) {
        console.warn('⚠️ Timer not started in DB');
        return;
      }

      const startTime = new Date(data.otp_timer_started_at).getTime();
      const now = new Date().getTime();
      const elapsed = (now - startTime) / 1000;
      const remaining = Math.max(0, 180 - elapsed);

      console.log(`⏱️ Timer: ${remaining.toFixed(1)}s`);
      setTimeRemaining(Math.ceil(remaining));
    } catch (error) {
      console.error('❌ Fetch error:', error);
    }
  };

  fetchTimerState();  // Fetch initial
  const interval = setInterval(fetchTimerState, 1000);

  return () => clearInterval(interval);
}, [visible, bookingId]);
```

**¿Qué ves?**
- Si ves "⏱️ Timer: 179.5s" cada 1 segundo → FUNCIONA
- Si ves "⏱️ Timer: 179.5s" solo una vez → Interval no se crea
- Si ves "Timer: 179.5s" luego "Timer: 179.4s" luego "Timer: 179.5s" (salta) → Timing issue

---

## 📋 REPORTE FINAL

Cuando reportes bug, copia esto:

```
❌ PASO EN QUE FALLA: [1-6]

CONSOLA LOG (copy-paste error):
[Aquí]

SUPABASE DB STATE:
[Resultado de SELECT anterior]

EXPECTED VS ACTUAL:
Esperaba: [qué debería pasar]
Vi:       [qué pasó realmente]

SCREENSHOTS:
[Si es posible, 1-2 fotos de la pantalla]
```

