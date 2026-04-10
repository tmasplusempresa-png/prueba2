# 🔍 Diagnóstico CRÍTICO de Supabase

## El problema:
`taxiOptions` siempre está vacío = **Supabase NO está retornando vehículos**

## Necesito que hagas ESTO AHORA:

### PASO 1: Abre tu Supabase Dashboard
```
https://app.supabase.com
Tu proyecto → SQL Editor
```

### PASO 2: Ejecuta esta query:
```sql
SELECT * FROM car_types LIMIT 10;
```

**¿Qué ves?**
- [ ] A: Tabla no existe (ERROR)
- [ ] B: Tabla existe pero está vacía (0 rows)
- [ ] C: Tabla tiene datos (X rows)

### PASO 3: Si ves datos, verifica que tengan is_active = true:
```sql
SELECT id, name, is_active, base_price FROM car_types WHERE is_active = true;
```

**¿Cuántos resultados ves?**
- [ ] 0 resultados = **Los datos tienen is_active = false**
- [ ] 3+ resultados = **La tabla tiene datos correctos** ✅

### PASO 4: Si todo es correcto, verifica credenciales:

Abre: `config/SupabaseConfig.ts` (en tu editor)

```typescript
export const supabase = createClient(
  'https://YOUR-PROJECT.supabase.co',  // Debe coincidir con tu proyecto
  'eyJhbG...',                          // API KEY de anon
);
```

Copias en un documento:
- URL: ___________________
- KEY: ___________________

Luego abre https://app.supabase.com → Settings → API → anon key

Compara que sean EXACTAMENTE iguales (sin espacios, sin cambios)

---

## Si la tabla está VACÍA (0 rows):

Ejecuta esto para agregar datos de prueba:

```sql
INSERT INTO car_types (name, is_active, capacity, base_price, price_per_km, description) VALUES
('TREAS-X', true, 3, 3500, 2500, 'Servicio Económico'),
('TREAS-X PLUS', true, 5, 5000, 3000, 'Servicio Plus'),
('TREAS-PRO', true, 7, 7000, 3500, 'Servicio Premium');
```

---

## Luego que hagas esto, recarga la app y **copia la consola completa** de BookingScreen mostrando:

```
🔍 [SUPABASE DIRECT] Iniciando carga...
📡 [SUPABASE] Query a tabla car_types...
```

---

## RÁPIDO: Manda captura de:

1. **Tu dashboard de Supabase** mostrando la tabla `car_types` y sus datos
2. **Tu archivo `config/SupabaseConfig.ts`** (oculta la key pero muestra URL)
3. **La consola** después de recargar con mis cambios

Con eso sabré exactamente qué está fallando.

