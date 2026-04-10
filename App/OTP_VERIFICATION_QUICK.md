# 🧪 OTP Sistema - Verificación Rápida

## 1️⃣ Vehículos Cargan Correctamente

### ¿Qué esperar?
- Cuando abres BookingScreen, después de calcular distancia
- Console debe mostrar:

```
════════════════════════════════════════════════════════════
🔍 [SUPABASE] Buscando vehículos en car_types...
════════════════════════════════════════════════════════════
📊 Parámetros: distance=6.18, duration=12.4
📡 [QUERY] SELECT * FROM car_types WHERE is_active = true
📡 [RESPONSE] HTTP Status: 200
✅ [SUCCESS] Query exitosa!
📦 Vehículos recibidos: 3
✅ [COMPLETE] 3 vehículos listos
════════════════════════════════════════════════════════════
```

### Si ves esto ✅
- ✅ **SUPABASE OK** - Conexión funciona
- ✅ **QUERY OK** - car_types table accesible
- ✅ **DATOS OK** - 3 vehículos activos existen

### Si NO ves esto ❌
- 🔴 **Supabase inaccesible** - Revisa URL y api_key
- 🔴 **Tabla vacía** - Crea car_types con datos
- 🔴 **Network error** - Revisa timeout, 6 segundos

---

## 2️⃣ Vehículos Se Renderizan en Pantalla

### ¿Qué esperar?
- BottomSheet se desliza mostrando los 3 vehículos
- Console debe mostrar:

```
✅ [RENDER VEHICLES] Mostrando 3 vehículos
   - taxiOptions: [
       {name: "Confort", value: "1"},
       {name: "Económico", value: "2"},
       {name: "Premium", value: "3"}
     ]
```

### Si ves esto ✅
- ✅ **RENDER OK** - Cards renderizadas
- ✅ **STATE OK** - taxiOptions tiene datos
- ✅ **UI OK** - FlatList/Fragment funciona

### Si NO ves cards ❌
- 🔴 **FlatList bloqueado** - Revisa BottomSheetModal
- 🔴 **State vacío** - Verifica setTaxiOptions() se ejecuta
- 🔴 **CSS issue** - Cards ocultas o transparentes

---

## 3️⃣ Vehículos Son Clickeables

### ¿Qué esperar?
- Cuando tuerces una tarjeta:
  - Deberías ver en console: `🎯 [TAP] Tocando vehículo: Confort`
  - Inmediatamente depois: `🚗 ✅ VEHÍCULO SELECCIONADO`

```
🎯 [TAP] Tocando vehículo: Confort

🚗 ═══════════════════════════════════════════════════════════
🚗 ✅ VEHÍCULO SELECCIONADO
🚗 Nombre: Confort
🚗 Tarifa base: 10801
🚗 ═══════════════════════════════════════════════════════════
```

### Si ves esto ✅
- ✅ **TOUCH OK** - Eventos táctiles funcionan
- ✅ **HANDLER OK** - handleSelectVehicle ejecuta
- ✅ **STATE OK** - selectedVehicle se actualiza

### Si NO ves logs ❌
- 🔴 **Touch no registra** - onPress no conectado
- 🔴 **Handler no ejecuta** - breakpoint en línea 545
- 🔴 **Fragment issue** - Revisa envoltorio Fragment

---

## 4️⃣ Botón Cambia a Verde

### ¿Qué esperar?
- Después de seleccionar vehículo
- Botón "Solicitar Viaje" pasa de ROJO/GRIS a **VERDE**
- Botón deja de tener `disabled={true}`

### Si ves esto ✅
- ✅ **STATE BINDING OK** - selectedVehicle → UI
- ✅ **CONDITIONAL STYLING OK** - isDisbaled={!selectedVehicle}
- ✅ **UX OK** - Usuario sabe qué hacer

### Si botón NO cambia ❌
- 🔴 **State no actualiza** - Revisa setSelectedVehicle()
- 🔴 **Styling no reactivo** - Revisa `disabled={isButtonDisabled || !selectedVehicle}`
- 🔴 **Key prop issue** - Verifica key en TouchableOpacity

---

## 5️⃣ OTP Se Genera

### ¿Qué esperar?
- Cuando tocas botón VERDE "Solicitar Viaje"
- Console debe mostrar:

```
════════════════════════════════════════════════════════════
📱 [BOOKING START] ¡¡¡ BOTÓN PRESIONADO !!!
════════════════════════════════════════════════════════════

✅ Validando datos:
   User: ✅
   Vehicle: ✅ Confort
   Origin: ✅ [Tu origen]
   Destination: ✅ [Tu destino]
   Payment: ✅ cash

✅✅✅ TODOS LOS CAMPOS VALIDADOS ✅✅✅

🔐 ══════════════════════════════════════════
🔐 GENERANDO OTP...
🔐 CÓDIGO GENERADO: 5847
🔐 ══════════════════════════════════════════

✅ State actualizado con OTP
📲 [OTP MODAL] Abriendo modal...
📲 [OTP MODAL] Modal debería estar VISIBLE ahora en pantalla
✅ Booking temporal guardado en memoria
```

### Si ves esto ✅
- ✅ **VALIDATION OK** - Todos campos presentes
- ✅ **OTP OK** - Generado 4 dígitos
- ✅ **STATE OK** - setOtp() ejecutó

### Si faltan validaciones ❌
- 🔴 **Usuario no logeado** - Revisa user state
- 🔴 **Vehículo no seleccionado** - Toca una tarjeta primero
- 🔴 **Origen/destino falta** - Coloca pines en mapa
- 🔴 **Pago no elegido** - Elige Efectivo/Nequi/Daviplata

---

## 6️⃣ OTP Modal Aparece en Pantalla

### ¿Qué esperar?
- Después de generar OTP
- **MODAL debe aparecer** con:
  - Título: "Código de Verificación" (arriba)
  - Tu código EN GRANDE: `5847` (en el medio)
  - TextInput para ingresar: `[____]`
  - Botón: "Confirmar"
  - Botón X para cerrar

### Si ves modal ✅
- ✅ **COMPONENT OK** - OtpModal renderiza
- ✅ **PROP OK** - modalVisible={true}
- ✅ **OTP OK** - Código mostrado correctamente

### Si NO ves modal ❌
- 🔴 **showOtpModal state es false** - Revisa setShowOtpModal() en handleBookNowPress
- 🔴 **OtpModal no importado** - Busca `import OtpModal` en imports
- 🔴 **Componente no en JSX** - Verifica línea ~1306 existe
- 🔴 **Props incorrectos** - `modalVisible` debe ser boolean true

---

## 7️⃣ OTP Validación Funciona

### ¿Qué esperar?
- Intenta ingresar **código incorrecto** primero:
  - Console: `❌ [OTP VALIDATION] OTP INCORRECTO`
  - Pantalla: Alerta roja "Error - OTP incorrecto"

- Luego intenta **código correcto**:
  - Console: `✅✅✅ [OTP VALIDATION] OTP CORRECTO`
  - Console: `💾 [SAVING BOOKING] Guardando booking en Supabase...`
  - Console: `✅ [BOOKING SAVED] ID: [uid]`
  - Navegas a pantalla Booking con reserva

### Si ves esto ✅
- ✅ **VALIDATION LOGIC OK** - Comparación parseInt correcta
- ✅ **BOOKING SAVE OK** - Supabase INSERT funciona
- ✅ **NAVIGATION OK** - Routing a Booking screen funciona

### Si falla validación ❌
- 🔴 **OTP state vacío** - Revisa que otp state se actualiza
- 🔴 **parseInt falla** - Ambos deben ser números
- 🔴 **Guardado falla** - Revisa bookings table schema

---

## 🚨 Checklist Rápido

```
VERIFICAR ANTES DE PRODUCCIÓN:

[ ] Logs de SUPABASE muestran 3 vehículos
[ ] Cards renderizadas en pantalla
[ ] Puedo tocar y seleccionar vehículos
[ ] Botón se vuelve verde
[ ] Modal OTP aparece con código
[ ] Ingresar código correcto → success
[ ] Ingresar código incorrecto → error
[ ] Booking se guarda en Supabase
[ ] Navego a pantalla Booking exitosamente
```

---

## 🔧 Debug Rápido en Console

``javascript
// Ver estado actual
console.log("taxiOptions:", window.__reactFiber$ );

// Generar OTP para test
const testOtp = String(Math.floor(1000 + Math.random() * 9000));
console.log("Test OTP:", testOtp);

// Ver si modal debería estar visible
console.log("showOtpModal:", window.__showOtpModalState);
```

---

## 📞 Si Algo No Funciona

1. **Abre DevTools** (F12)
2. **Go to Console tab**
3. **Copia TODOS los logs** que ves
4. **Pega en Discord/Slack**
5. **Indica en cuál paso falla** (1-7 arriba)

---

## 📊 Flujo Completo Resumido

```
1️⃣ App Abre
   ↓
2️⃣ Supabase carga 3 vehículos ✅
   ↓
3️⃣ BottomSheet muestra cards ✅
   ↓
4️⃣ Toco un vehículo ✅
   ↓
5️⃣ Botón se vuelve VERDE ✅
   ↓
6️⃣ Toco "Solicitar Viaje" ✅
   ↓
7️⃣ OTP genera (4 dígitos) ✅
   ↓
8️⃣ Modal aparece with código ✅
   ↓
9️⃣ Ingreso código correcto ✅
   ↓
🔟 Booking guarda en Supabase ✅
   ↓
✅ ÉXITO - Navego a Booking ✅
```

