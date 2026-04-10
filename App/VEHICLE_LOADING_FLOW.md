# 🚗 Flujo de Carga de Vehículos - DIAGNÓSTICO

## ✅ Flujo CORRECTO que debe pasar (revisa consola):

### 1️⃣ INICIO - Se cargan el mapa y destinos:
```
════════════════════════════════════════════════════════
🚀 [BookingScreen MOUNTED] Componente ha cargado
════════════════════════════════════════════════════════
```

### 2️⃣ CALCULAR DISTANCIA/DURACIÓN (cuando tienes origin + destination):
```
🗺️ [DIRECTIONS] Solicitando distancia/duración...
   From: 4.7210 -74.0721
   To: 4.6413 -74.0847
```

**OPCIÓN A - Google Maps funciona:**
```
✅ [DIRECTIONS] Distancia: 14.25 km | Duración: 28.5 min
```

**OPCIÓN B - Google Maps falla (usa Haversine):**
```
❌ [DIRECTIONS ERROR] Error fetching directions: [TypeError: Network request failed]
✅ [DIRECTIONS FALLBACK] Distancia: 14.25 km | Duración: 28.5 min
```

### 3️⃣ REVISAR SI SE TRIGGEA FETCH DE VEHÍCULOS:
```
👀 [TAXI OPTIONS EFFECT] Revisando condiciones:
   - distance: 14.25 typeof: number
   - duration: 28.5 typeof: number
✅ [TAXI OPTIONS EFFECT] Condiciones cumplidas - llamando fetchTaxiOptionsFromFirebase
```

### 4️⃣ OBTENER VEHÍCULOS DE SUPABASE:
```
🔍 [FETCH VEHICLES] Iniciando búsqueda de vehículos...
📊 [FETCH VEHICLES] distance: 14.25 duration: 28.5

✅ [FETCH VEHICLES] Tipos de vehículos encontrados: 3
🚗 [FETCH VEHICLES] Procesando: TREAS-X
💰 [FETCH VEHICLES] TREAS-X: $25500
🚗 [FETCH VEHICLES] Procesando: TREAS-X PLUS
💰 [FETCH VEHICLES] TREAS-X PLUS: $32400
...

✅ [FETCH VEHICLES] Total vehículos listos: 3
```

### 5️⃣ MOSTRAR VEHÍCULOS EN UI:
```
✅ [RENDER VEHICLES] Mostrando 3 vehículos
```

**Deberías ver 3 tarjetas de vehículos con sus nombres y precios**

### 6️⃣ SELECCIONAR VEHÍCULO:
```
🎯 ═══════════════════════════════════════════════════════
🚗 ✅ VEHÍCULO SELECCIONADO
🚗 Nombre: TREAS-X PLUS
🚗 Tarifa base: 3500
```

**El botón flotante cambia de ROJO ➡️ VERDE y dice "✅ SOLICITAR VIAJE"**

### 7️⃣ PRESIONAR BOTÓN VERDE - GENERAR OTP:
```
🎯 ═══════════════════════════════════════════════════════
🎯 🚨 BOTÓN FLOTANTE PRESIONADO 🚨
🎯 Estado actual:
   • selectedVehicle: TREAS-X PLUS
   • origin: 127B-71, Carrera 2b, Usaquén, Bogotá
   • destination: Avenida Calle 100, Bogotá, Colombia
   • selectedPaymentType: cash
   • isButtonDisabled: false

📱 [BookingScreen] Click en 'Solicitar Viaje'
✅ [BookingScreen] Todos los campos validados
🔐 [BookingScreen] Generando OTP...
✅ [OTP Service] Código generado: 7382
🔐 [OTP MODAL] 📱 Código de verificación: 7382
✅ [BookingScreen] Modal OTP debería estar visible ahora
```

**Modal aparece con el código visible en grande en CYAN (#00E5FF)**

---

## ❌ PROBLEMAS Y SOLUCIONES

### PROBLEMA: "No veo vehículos"

**Revisa en consola por orden:**

1. ¿Ves `🚀 [BookingScreen MOUNTED]`?
   - ✅ Sí → continúa al paso 2
   - ❌ No → reinicia la app

2. ¿Ves `✅ [DIRECTIONS]` o `✅ [DIRECTIONS FALLBACK]`?
   - ✅ Sí → continúa al paso 3
   - ❌ No → origin/destination no están seteados

3. ¿Ves `✅ [TAXI OPTIONS EFFECT] Condiciones cumplidas`?
   - ✅ Sí → continúa al paso 4
   - ❌ No → distance y duration no llegan aquí

4. ¿Ves `🔍 [FETCH VEHICLES] Iniciando búsqueda`?
   - ✅ Sí → continúa al paso 5
   - ❌ No → el useEffect no se triggered

5. ¿Ves `✅ [FETCH VEHICLES] Tipos de vehículos encontrados: X`?
   - ✅ Sí → Supabase funciona ✅
   - ❌ No → Error de Supabase (revisar keys)

6. ¿Ves `✅ [RENDER VEHICLES] Mostrando X vehículos`?
   - ✅ Sí → Vehículos listos en UI
   - ❌ No → `taxiOptions` sigue vacío

---

## 🔧 ACCIONES PARA FIJAR

### Si stuck en step 2 (sin distancia/duración):
```bash
# Verifica que origin y destination estén en los params
console.log("✅ origin:", origin);
console.log("✅ destination:", destination);
```

### Si stuck en step 4 (distance/duration existen pero no se triggerean vehículos):
- Scroll down + up en la screen varias veces
- Esto re-triggerea el useEffect

### Si stuck en step 5 (Supabase error):
- Verifica credentials en `config/SupabaseConfig.ts`
- Verifica que tabla `car_types` tenga registros con `is_active = true`

```sql
SELECT * FROM car_types WHERE is_active = true;
```

### Si vehículos aparecen pero botón no se vuelve verde:
- Significa que `handleSelectVehicle()` NO se ejecutó
- Toca directamente la tarjeta del vehículo, no el botón
- Deberías ver: `🚗 ✅ VEHÍCULO SELECCIONADO`

---

## 📋 CHECKLIST DE PRUEBA

- [ ] Veo `🚀 [BookingScreen MOUNTED]`
- [ ] Veo `✅ [DIRECTIONS]` o `✅ [DIRECTIONS FALLBACK]` con distancia
- [ ] Veo `✅ [TAXI OPTIONS EFFECT] Condiciones cumplidas`
- [ ] Veo `✅ [FETCH VEHICLES] Iniciando búsqueda`
- [ ] Veo `✅ [FETCH VEHICLES] Tipos de vehículos encontrados`
- [ ] Veo `✅ [RENDER VEHICLES] Mostrando X vehículos`
- [ ] En UI veo 3 tarjetas de vehículos con precios
- [ ] Toco una tarjeta
- [ ] Veo `🚗 ✅ VEHÍCULO SELECCIONADO`
- [ ] Botón flotante cambia a VERDE con "✅ SOLICITAR VIAJE"
- [ ] Toco botón VERDE
- [ ] Veo logs de OTP generado
- [ ] Modal OTP aparece con código

---

## 💡 TIPS

- **Abre DevTools Expo** para ver toda la consola
- **Copia/pega la consola entre los logs `═════`** para análisis
- **Si nada funciona**, reinicia la app completamente
- **Comprueba internet** - necesita conexión para Google Maps, Supabase y Cloud Functions

