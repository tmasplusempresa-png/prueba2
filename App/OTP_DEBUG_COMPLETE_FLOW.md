# 🔐 OTP Sistema - Depuración Flujo Completo

## ✅ Validación Paso a Paso

### **PASO 1: Cargar vehículos de Supabase**

Cuando la app se abre, deberías ver en la consola:

```
📡 [EFFECT] useEffect TAXI EFFECT iniciado
📡 [QUERY] SELECT * FROM car_types WHERE is_active = true
📡 [RESPONSE] HTTP Status: 200
✅ [SUCCESS] Query exitosa!
📦 Vehículos recibidos: 3
✅ [COMPLETE] 3 vehículos listos
```

**Si NO ves esto:**
- ❌ Problema: Supabase query falla
- 🔧 Solución: Revisa `fetchTaxiOptionsFromFirebase()` y conexión SQL
- 📍 Ubicación: BookingScreen.tsx línea ~322

---

### **PASO 2: Ver el BottomSheet con vehículos**

Cuando toquees el mapa o presiones el botón de pagar/vehículos:

1. BottomSheet debe deslizarse hacia arriba
2. Deberías ver:
   - ✅ Chips de selección: "Inmediato", "Programar", "Solo Ida", "Ida y Vuelta"
   - ✅ **3 TARJETAS DE VEHÍCULOS:**
     - 🚗 Confort - $10,801
     - 🚗 Económico - $8,000
     - 🚗 Premium - $20,000

**Console logs esperados:**
```
✅ [RENDER VEHICLES] Mostrando 3 vehículos
   - taxiOptions: [{name: "Confort", value: "confort"}, ...]
```

**Si NO ves los vehículos:**
- ❌ Problema: renderTaxiOptions() no muestra cards
- 🔧 Solución: Revisa que FlatList tiene `numColumns={1}` y no tiene `scrollEnabled={false}`
- 📍 Ubicación: BookingScreen.tsx línea ~1025 (BottomSheetModal content)

---

### **PASO 3: Seleccionar un vehículo**

**TOCA UNA DE LAS 3 TARJETAS DE VEHÍCULOS**

**Console logs esperados cuando tocas:**
```
🎯 [TAP] Tocando vehículo: Confort

🚗 ═══════════════════════════════════════════════════════════
🚗 ✅ VEHÍCULO SELECCIONADO
🚗 Nombre: Confort
🚗 Tarifa base: 10801
🚗 ═══════════════════════════════════════════════════════════
```

**Cuando la tarjeta se selecciona:**
- ✅ La tarjeta debe DESTACARSE (color diferente)
- ✅ El botón "Solicitar Viaje" debe cambiar de ROJO/GRIS a **VERDE**
- ✅ El botón ya no debería estar `disabled`

**Si el botón NO cambia a verde:**
- ❌ Problema: `selectedVehicle` state no se actualiza
- 🔧 Solución: Verifica que `handleSelectVehicle()` se ejecuta (busca log `🚗 ✅ VEHÍCULO SELECCIONADO`)
- 📍 Ubicación: BookingScreen.tsx línea ~445

---

### **PASO 4: Tocar botón "Solicitar Viaje"**

Una vez el botón esté en VERDE y toques "Solicitar Viaje":

**Console logs esperados:**
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
🔐 CÓDIGO GENERADO: [4 dígitos, ej: 5847]
🔐 ══════════════════════════════════════════

✅ State actualizado con OTP
📲 [OTP MODAL] Abriendo modal...
📲 [OTP MODAL] Modal debería estar VISIBLE ahora en pantalla
✅ Booking temporal guardado en memoria
```

**Lo que debe ocurrir on-screen:**
- ✅ BottomSheet se cierra
- ✅ **MODAL OTP APARECE en pantalla**
  - Título: "Código de Verificación"
  - Tu código en GRANDE: `[4 dígitos]`
  - TextInput para ingresar código
  - Botón "Confirmar"

**Si el MODAL NO APARECE:**
- ❌ Problema: `showOtpModal` state no se actualiza o OtpModal no se renderiza
- 🔧 Solución: Verifica que:
  1. `setShowOtpModal(true)` se ejecuta
  2. Componente `<OtpModal modalVisible={showOtpModal} ... />` existe
- 📍 Ubicación: BookingScreen.tsx línia ~1306

---

### **PASO 5: Ingresar código OTP**

En el modal OTP:

1. **COPIA EL CÓDIGO mostrado en GRANDE** (ej: 5847)
2. **Pega en el input** o escríbelo manualmente
3. **Toca "Confirmar"**

**Console logs esperados:**
```
════════════════════════════════════════════════════════════
🔐 [OTP VALIDATION] Usuario ingresó código OTP
════════════════════════════════════════════════════════════
🔐 isMatch: true
🔐 OTP en estado: [código]

✅✅✅ [OTP VALIDATION] OTP CORRECTO ✅✅✅
✅ Proceediendo con guardar reserva...
✅ bookingObject recuperado: ✅ Existe

💾 [SAVING BOOKING] Guardando booking en Supabase...
✅ [BOOKING SAVED] ID: [uid generado]
💾 [OTP SERVICE] OTP guardado en Supabase
✅ [NAVIGATION] Navegando a pantalla Booking...
```

**Si la validación FALLA:**
```
❌ [OTP VALIDATION] OTP INCORRECTO
   El código ingresado NO coincide con el generado
```

**Lo que debe ocurrir on-screen:**
- ✅ Modal OTP se cierra
- ✅ Navegas a pantalla "Booking" con tu reserva
- ✅ Ves detalles: vehículo, origen, destino, precio, OTP

**Si FALLA en validación:**
- ❌ Problema: Código ingresado ≠ código mostrado
- 🔧 Solución: Verifica que estés copiando el código correcto
- 📍 Verificación: El código en `otp` state debe coincidir con el mostrado

**Si FALLA en guardar booking:**
- ❌ Problema: `saveBooking()` retorna `{success: false}`
- 🔧 Solución: Revisa Supabase `bookings` table - ve si está llena de datos
- 📍 Ubicación: common/utils/db-utils.ts o similar

---

## 🧪 Checklist de Validación Completa

| Paso | Acción | Log Esperado | Estado |
|------|--------|-------------|--------|
| 1 | App abre | `✅ [COMPLETE] 3 vehículos listos` | ✅ |
| 2 | Desliza BottomSheet | `✅ [RENDER VEHICLES] Mostrando 3 vehículos` | ✅ |
| 3 | Toca un vehículo | `🚗 ✅ VEHÍCULO SELECCIONADO` | ✅ |
| 4 | Botón se vuelve VERDE | Estado visual | ✅ |
| 5 | Toca "Solicitar Viaje" | `🔐 CÓDIGO GENERADO: XXXX` | ✅ |
| 6 | Modal OTP aparece | On-screen modal con código | ✅ |
| 7 | Ingresa código correcto | `✅✅✅ OTP CORRECTO` | ✅ |
| 8 | Navega a Booking | `✅ [NAVIGATION] Navegando...` | ✅ |

---

## 🔍 Logs por Sección

### **SECCIÓN 1: Vehículos (BookingScreen.tsx línea ~322-390)**
```typescript
const fetchTaxiOptionsFromFirebase = async () => { ... }
```
**Busca en consola:**
- `📡 [QUERY]` - Query iniciada
- `📡 [RESPONSE]` - Respuesta recibida
- `✅ [SUCCESS]` - Query exitosa
- `❌ [ERROR]` - Error en query

### **SECCIÓN 2: Render (BookingScreen.tsx línea ~511-574)**
```typescript
const renderTaxiOptions = () => { ... }
```
**Busca en consola:**
- `✅ [RENDER VEHICLES]` - Cards renderizadas
- `🎯 [TAP]` - Vehículo tocado

### **SECCIÓN 3: Selección (BookingScreen.tsx línea ~445-480)**
```typescript
const handleSelectVehicle = async (vehicle) => { ... }
```
**Busca en consola:**
- `🚗 ✅ VEHÍCULO SELECCIONADO` - Selección exitosa

### **SECCIÓN 4: Booking (BookingScreen.tsx línea ~738-835)**
```typescript
const handleBookNowPress = async () => { ... }
```
**Busca en consola:**
- `📱 [BOOKING START]` - Botón presionado
- `🔐 CÓDIGO GENERADO:` - OTP generado
- `📲 [OTP MODAL]` - Modal abierto

### **SECCIÓN 5: OTP Validación (BookingScreen.tsx línea ~840-905)**
```typescript
const handleOtpMatch = async (isMatch) => { ... }
```
**Busca en consola:**
- `🔐 [OTP VALIDATION]` - Validando código
- `✅✅✅ OTP CORRECTO` - Validación exitosa
- `💾 [SAVING BOOKING]` - Guardando
- `✅ [BOOKING SAVED]` - Guardado exitoso

---

## 🆘 Troubleshooting Rápido

| Síntoma | Causa Probable | Solución |
|---------|----------------|----------|
| No ves 3 vehículos | Supabase query falla | Revisa conexión DB, car_types table |
| Vehículos NO se pueden tocar | Evento touch bloqueado | Verifica que TouchableOpacity tiene `onPress` |
| Botón NO se vuelve verde | selectedVehicle state no actualiza | Revisa que handleSelectVehicle ejecuta |
| Modal OTP no aparece | showOtpModal state es false | Revisa setShowOtpModal(true) en handleBookNowPress |
| OTP muestra código incorrecto | OTP state tiene valor diferente | Revisa generateOtp() returns correcto |
| Guardado falla | saveBooking() error | Revisa bookings table schema en Supabase |

---

## 📝 Notas Importantes

1. **El código OTP es de 4 dígitos** - Si ves algo diferente, hay problema
2. **El código se muestra EN GRANDE en el modal** para copiar fácilmente
3. **La validación es numérica** - `parseInt(inputValue) === parseInt(otp)`
4. **El booking se guarda DESPUÉS de validar OTP** - No antes
5. **El OTP se guarda en Supabase** - No solo en memoria local

---

## 🚀 Script de Test Automatizado

Si quieres hacer test rápido del flujo completo, en consola JavaScript execute:

```javascript
// 1. Simular apertura BottomSheet
console.log("Abriendo BottomSheet...");

// 2. Simular selección de vehículo
console.log("Seleccionando Confort...");

// 3. Simular generación OTP
const otp = String(Math.floor(1000 + Math.random() * 9000));
console.log("OTP Generado:", otp);

// 4. Simular confirmación
console.log("Confirmando OTP:", otp === otp ? "✅ MATCH" : "❌ NO MATCH");
```

---

## 💡 Pro Tips para Debugging

1. **Abre DevTools** (F12) → Console tab
2. **Filtra logs** por keyword: 🔐, 📱, 💾, etc
3. **Copia logs** y pega en un archivo para análisis
4. **Usa Debugger** (VS Code Debugger) para pausar en breakpoints
5. **Habilita Slow Motion** en emulator para ver transiciones

