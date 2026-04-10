# 🚀 GUÍA - Qué Deberías Ver en Consola

## ✅ FLUJO CORRECTO - Espera ver ESTO en orden:

### 1️⃣ INICIO - BookingScreen se carga:
```
════════════════════════════════════════════════════════════
🚀 [BookingScreen MOUNTED] Componente ha cargado
════════════════════════════════════════════════════════════
```

### 2️⃣ DISTANCIA - Google Maps calcula ruta:
```
🗺️ [DIRECTIONS] Solicitando distancia/duración...
   From: 4.70... -74.02...
   To: 4.75... -74.05...
✅ [DIRECTIONS] Distancia: 14.25 km | Duración: 28.5 min
```
O con fallback:
```
⚠️ [DIRECTIONS] No routes found
✅ [DIRECTIONS FALLBACK] Distancia: 14.25 km
```

### 3️⃣ SUPABASE - Carga vehículos:
```
👀 [TAXI OPTIONS EFFECT] Revisando condiciones:
   - distance: 14.25 typeof: number
   - duration: 28.5 typeof: number
✅ [TAXI OPTIONS EFFECT] Condiciones cumplidas

🔍 [SUPABASE DIRECT] Iniciando carga de vehículos desde Supabase...
📊 distance: 14.25 duration: 28.5
📡 [SUPABASE] Query a tabla car_types...
📡 [SUPABASE] Response status: 200
✅ [SUPABASE] Query exitosa
📦 [SUPABASE] Vehículos recibidos: 3

🚗 [PROCESSING] Procesando vehículos...
  [1/3] TREAS-X - Precio: $3500
  [2/3] TREAS-X PLUS - Precio: $5000
  [3/3] TREAS-PRO - Precio: $7000
✅ [PROCESSING] Completado - 3 vehículos listos
✅ [STATE] taxiOptions actualizado
```

### 4️⃣ UI - Vehículos aparecen:
```
✅ [RENDER VEHICLES] Mostrando 3 vehículos
```

**EN LA PANTALLA:** Deberías ver 3 tarjetas de vehículos con precios ✅

### 5️⃣ SELECCIONAR VEHÍCULO - Tocas una tarjeta:
```
🚗 ✅ VEHÍCULO SELECCIONADO
🚗 Nombre: TREAS-X PLUS
🚗 Tarifa base: 5000
```

**EN LA PANTALLA:** Botón flotante cambia de ROJO ➡️ VERDE ✅

### 6️⃣ GENERAR OTP - Tocas botón verde:
```
════════════════════════════════════════════════════════════
📱 [BOOKING START] ¡¡¡ BOTÓN PRESIONADO !!!
════════════════════════════════════════════════════════════
✅ Validando datos:
   User: ✅
   Vehicle: ✅ TREAS-X PLUS
   Origin: ✅ Origen...
   Destination: ✅ Destino...
   Payment: ✅ cash

✅✅✅ TODOS LOS CAMPOS VALIDADOS ✅✅✅

🔐 ══════════════════════════════════════════════════════════
🔐 GENERANDO OTP...
════════════════════════════════════════════════════════════
🔐🔐🔐 OTP SERVICIO - GENERAR OTP 🔐🔐🔐
════════════════════════════════════════════════════════════
🔐 CÓDIGO GENERADO: 7382
🔐 Un código de **4 dígitos**
🔐 Tipo: string - Largo: 4
🔐 Este código DEBE mostrarse en la pantalla
════════════════════════════════════════════════════════════

✅ State actualizado con OTP
📲 [OTP MODAL] Abriendo modal...
📲 [OTP MODAL] Modal debería estar VISIBLE ahora en pantalla
```

**EN LA PANTALLA:** Modal aparece con el código OTP en GRANDE en CYAN ✅

---

## ❌ PROBLEMAS - Si NO ves algo:

### ❌ PROBLEMA 1: No ves `✅ [DIRECTIONS]`
**Causa:** Google Maps API falla
**¿Ves `✅ [DIRECTIONS FALLBACK]`?**
- Sí: Fallback funcionando → continúa
- No: Sin internet probablemente

### ❌ PROBLEMA 2: No ves `📦 [SUPABASE] Vehículos recibidos: X`
**Causa:** Supabase no retorna vehículos
**Soluciones:**

a) Tabla `car_types` está VACÍA
```sql
-- En Supabase SQL, ejecuta:
SELECT * FROM car_types;
-- Si ves 0 rows → la tabla está vacía
```

b) Tabla `car_types` tiene `is_active = false`
```sql
-- Actualiza a true:
UPDATE car_types SET is_active = true;
```

c) Credenciales de Supabase INCORRECTAS
- Abre `config/SupabaseConfig.ts`
- Verifica URL y API KEY con tu dashboard

### ❌ PROBLEMA 3: Ves vehículos pero no puedes seleccionar
**Checklist:**
- [ ] ¿El bottom sheet está scrolleable?
- [ ] ¿Las tarjetas tienen borde/highlight?
- [ ] ¿Tocas directamente EN la tarjeta (no en el texto)?

### ❌ PROBLEMA 4: Seleccionas vehículo pero botón no se pone verde
**Logs a buscar:**
```
🚗 ✅ VEHÍCULO SELECCIONADO
```
- Sí aparece: Vehicle state funciona
- No aparece: Problema en handleSelectVehicle()

### ❌ PROBLEMA 5: Tocas botón verde pero NO ves OTP
**Logs a buscar:**
```
📱 [BOOKING START] ¡¡¡ BOTÓN PRESIONADO !!!
```
- Sí aparece: botón se ejecutó
  - Busca: `🔐 CÓDIGO GENERADO: ____`
  - Si NO lo ves: handleBookNowPress() falla silenciosamente
- No aparece: BOTÓN NO RESPONDE

---

## 🎯 NEXT STEPS

1. **Recarga la app completamente**
   - En Expo: `r r`
   - O cierra y abre

2. **Abre DevTools** (consola)

3. **Navega a BookingScreen**

4. **Captura TODA la consola** de los primeros logs hasta donde necesites

5. **Dime ESPECÍFICAMENTE:**
   - ¿Ves `✅ [DIRECTIONS]` o `✅ [DIRECTIONS FALLBACK]`?
   - ¿Ves `✅ [SUPABASE] Query exitosa`?
   - ¿Ves `📦 [SUPABASE] Vehículos recibidos: X`?
   - ¿Ves vehículos EN LA PANTALLA?
   - ¿Cuál es el ÚLTIMO log que ves antes del error?

---

## 🚨 URGENTE ANTES:

Verifica en Supabase:
```sql
-- En https://app.supabase.com → SQL Editor
SELECT id, name, is_active, base_price FROM car_types WHERE is_active = true;
```

DEBE retornar 3+ filas. Si retorna 0, inserta datos:

```sql
INSERT INTO car_types (name, is_active, capacity, base_price, price_per_km, description) VALUES
('TREAS-X', true, 3, 3500, 2500, 'Económico'),
('TREAS-X PLUS', true, 5, 5000, 3000, 'Plus'),
('TREAS-PRO', true, 7, 7000, 3500, 'Premium');
```

