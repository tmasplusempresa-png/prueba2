# 🌐 Network Error - Solución Rápida

## Problema: `[TypeError: Network request failed]` repetido

Significa que **múltiples fetch calls están fallando al mismo tiempo**.

---

## ✅ CAMBIOS YA APLICADOS:

1. ✅ **Timeout para Google Maps** - máximo 5 segundos
2. ✅ **Timeout para Supabase** - máximo 6 segundos
3. ✅ **Fallback a Haversine** - si Google Maps falla
4. ✅ **Fallback a query sin filtro** - si Supabase falla con `.eq()`
5. ✅ **Better error messages** - ahora dice EXACTAMENTE qué falla

---

## 🎯 QUÉ HACER AHORA:

### OPCIÓN 1: Si tienes Internet

1. **Recarga la app completa:**
   ```
   En Expo: Presiona r r  (reload)
   O en PowerShell:
   npx expo start -c
   ```

2. **Abre DevTools y busca:**
   ```
   ✅ [HAVERSINE] Distancia calculada
   ✅ [SUCCESS] Query exitosa
   ```

3. **Si ves vehículos en pantalla:** ¡FUNCIONA! ✅

### OPCIÓN 2: Si NO tienes Internet (o muy lenta)

- ✅ La app usa **fallback a Haversine** para distancia
- ✅ Debería mostrar vehículos aunque sea más lentamente
- ⚠️ Si aún ves error, es problema de **credenciales de Supabase**

---

## 🔧 Si el problema persiste:

### Verificar Supabase:

```sql
-- En https://app.supabase.com → SQL Editor:
SELECT COUNT(*) FROM car_types WHERE is_active = true;
```

Debe retornar: `3` (o el número de vehículos)

### Verificar SupabaseConfig.ts:

```typescript
// c:\...\config\SupabaseConfig.ts
const SupabaseConfig = {
  url: 'https://XXXX.supabase.co',    ← Verifica que sea correcto
  anonKey: 'eyJhbG...',               ← Verifica que sea correcto
};
```

---

## 📋 LOGS ESPERADOS DESPUÉS DE CAMBIOS:

```
🗺️ [DIRECTIONS] Solicitando distancia/duración...
✅ [HAVERSINE] Distancia calculada (Sin internet funciona igual)

🔍 [SUPABASE] Buscando vehículos...
📡 [QUERY] SELECT * FROM car_types WHERE is_active = true
✅ [SUCCESS] Query exitosa!
📦 Vehículos recibidos: 3
✅ [COMPLETE] 3 vehículos listos
```

O con fallback:

```
⚠️ [DIRECTIONS FALLBACK] Usando Haversine
❌ [ERROR] Query falló - intentando fallback
✅ Fallback OK
🔄 [FALLBACK SUCCESS] 3 vehículos
```

---

## 💡 Tips:

- **Sin Internet:** app funciona con fallbacks (solo Haversine + precios base)
- **Con Internet lenta:** puede tardar 10-15 segundos pero funciona
- **Con Internet buena:** debería ser < 3 segundos

---

## ✅ Recarga y manda consola completa:

1. Presiona `r r` en Expo
2. Navega a BookingScreen
3. Espera a que cargue todo
4. Pegame la consola COMPLETA

Con eso sabré exactamente dónde está fallando. 🎯

