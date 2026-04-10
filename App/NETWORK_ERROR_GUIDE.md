# 🌐 Network Request Failed - Guía de Diagnóstico

## Error Recibido
```
ERROR  [TypeError: Network request failed]
```

Este error significa que **un fetch HTTP está fallando**. Podría ser:

1. **Google Maps API** (`🗺️ [DIRECTIONS]`)
2. **Supabase** (`🔍 [FETCH VEHICLES]`)
3. **Cloud Functions** (`💰 [PRICE API]`)
4. **Sin conexión a internet**

---

## 🔍 Cómo Diagnosticar

### PASO 1: Captura la consola completa

En Expo DevTools, busca estos logs EN ESTE ORDEN:

```
🗺️ [DIRECTIONS] Solicitando distancia/duración...
   ↓
✅ [DIRECTIONS] Distancia: X km
   O
🌐 [DIRECTIONS] Network error - usando fallback
   ↓
✅ [TAXI OPTIONS EFFECT] Condiciones cumplidas
   ↓
🔍 [FETCH VEHICLES] Iniciando búsqueda
   ↓
🚗 [FETCH VEHICLES] Procesando: TREAS-X
   ↓
💰 [FETCH VEHICLES] $25000
   O
💰 [PRICE API] Network error para TREAS-X
```

### PASO 2: Identifica CUÁL API falla

**Busca uno de estos patrones:**

#### 🗺️ Si falla DIRECTIONS (Google Maps)
```
🌐 [DIRECTIONS] Network error - usando fallback
```
✅ **Es normal** - tienes fallback Haversine
- Continuará con el siguiente paso

#### 🔍 Si falla SUPABASE
```
❌ [FETCH VEHICLES] Supabase error: ...
❌ [FETCH VEHICLES] Supabase network error: ...
```
❌ **PROBLEMA** - Sin vehículos en UI
- Revisa credenciales en `config/SupabaseConfig.ts`
- Verifica que `car_types` tenga datos

#### 💰 Si falla PRICE API (Cloud Functions)
```
🌐 [PRICE API] Network error para TREAS-X
💰 [FETCH VEHICLES] Usando precio base para TREAS-X: $15000
```
✅ **Es normal** - usa precio base
- Continuará mostrando vehículos con precio base

---

## ✅ Estados ESPERADOS vs ❌ Problemas

### ESPERADO - Todo funciona:
```
✅ [DIRECTIONS] Distancia: 14.25 km
✅ [FETCH VEHICLES] Tipos de vehículos encontrados: 3
✅ [RENDER VEHICLES] Mostrando 3 vehículos
```
**Resultado:** Vehículos aparecen en UI ✅

### ESPERADO - Fallback a Haversine pero sigue funcionando:
```
🌐 [DIRECTIONS] Network error - usando fallback
✅ [DIRECTIONS FALLBACK] Distancia: 14.25 km
✅ [FETCH VEHICLES] Tipos de vehículos encontrados: 3
💰 [PRICE API] Network error para TREAS-X
✅ [RENDER VEHICLES] Mostrando 3 vehículos
```
**Resultado:** Vehículos aparecen con precios base ✅

### ❌ PROBLEMA - Supabase falla:
```
❌ [FETCH VEHICLES] Supabase error: ...
✅ [RENDER VEHICLES] Mostrando 0 vehículos
```
**Resultado:** SIN VEHÍCULOS EN UI ❌

### ❌ PROBLEMA - Sin internet:
```
🌐 [DIRECTIONS] Network error
❌ [FETCH VEHICLES] Supabase network error
💰 [PRICE API] Network error
```
**Resultado:** Nada funciona ❌

---

## 🔧 Soluciones Rápidas

### Solución 1: Verifica Internet
```bash
# Desde terminal, ping a Google
ping 8.8.8.8

# Desde tu dispositivo, abre navegador
# Intenta ir a google.com
```

### Solución 2: Recarga la App
```bash
# En Expo:
- Press: r r  (recargar)
- O: Press d → Reload

# O reinicia completamente:
- Cierra app
- Abre app nuevamente
```

### Solución 3: Verifica Supabase Credenciales
Abre `config/SupabaseConfig.ts`:
```typescript
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_KEY = 'eyJhbG...'; // Debe estar válido
```

Verifica que sea correcto en:
https://app.supabase.com → Settings → API

### Solución 4: Verifica que car_types tenga datos
```sql
-- En Supabase SQL Editor, ejecuta:
SELECT id, name, is_active FROM car_types LIMIT 10;
```

Debes ver algo como:
```
| id  | name         | is_active |
|-----|--------------|-----------|
| 1   | TREAS-X      | true      |
| 2   | TREAS-X PLUS | true      |
| 3   | TREAS-PRO    | true      |
```

---

## 💡 Información para Próximas Acciones

Cuando respondas con el error, incluye EXACTAMENTE:

1. **Pantalla completa de cuál de estos viste:**
```
✅ [DIRECTIONS]
```
✅ Sí / ❌ No

2. **¿Viste este?**
```
✅ [FETCH VEHICLES] Tipos encontrados: X
```
Número: ___

3. **¿Viste este?**
```
✅ [RENDER VEHICLES] Mostrando X
```
Número: ___

4. **¿Aparecieron vehículos en la UI?**
Sí / No

5. **¿Cuál fue el ÚLTIMO log que viste antes del error?**
Copia exactamente...

6. **¿Tienes conexión a internet?**
Sí / No

---

## 🎯 Goal

Una vez que veas:
```
✅ [DIRECTIONS] Distancia: X km
✅ [FETCH VEHICLES] Tipos encontrados: 3
✅ [RENDER VEHICLES] Mostrando 3
```

Y **3 tarjetas de vehículos en la UI** → _Todo funciona y OTP debería trabajar_

