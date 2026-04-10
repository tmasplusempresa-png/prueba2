# ⚠️ REQUISITO CRÍTICO: Ejecutar migraciones en Supabase

## El problema

Los servicios inmediatos y las reservas siguen apareciéndose juntos porque:

1. ❌ La columna `booking_type` probablemente **NO existe** en la tabla `bookings`
2. ❌ O existe pero los datos anteriores no tienen este campo lleno

## ✅ LA SOLUCIÓN (3 pasos)

### PASO 1️⃣: Ejecutar migración (crear columna)

Ve a **Supabase → SQL Editor** y ejecuta todo el contenido de:

```
masterchiefpar1/sql/add-booking-mode-column.sql
```

Este script:
- ✅ Crea la columna `booking_type` si no existe
- ✅ Llena datos existentes (PENDING → 'reservation', NEW → 'immediate')
- ✅ Crea índices para optimizar búsquedas
- ✅ Te muestra un reporte de lo que hizo

### PASO 2️⃣: Verificar data

Ejecuta en Supabase SQL Editor:

```
masterchiefpar1/sql/diagnose-booking-type-v2.sql
```

Esto te mostrará:
- Si la columna existe ✅
- Cuántas reservas vs inmediatos tienes
- Los últimos servicios creados

**Resultado esperado:**
```
booking_type | total | pending | new | accepted
-------------|-------|---------|-----|----------
immediate    |  5    |    0    |  5  |    0
reservation  |  3    |    3    |  0  |    0
```

### PASO 3️⃣: Probar en la app

1. Crea un **servicio INMEDIATO** (radio "⚡ Inmediato")
2. Crea una **reserva PROGRAMADA** (radio "📅 Programado" + fecha futura)
3. Abre Supabase → SQL → consulta de nuevo

**Resultado esperado:**
```
booking_type | count
-------------|-------
immediate    | 6     ← +1 nuevo inmediato
reservation  | 4     ← +1 nueva reserva
```

---

## 🔄 Cambios en el código (ya implementados)

✅ **CreateReservationScreen.tsx**
- Inciado de "⚡ Inmediato": guardará `booking_type='immediate'`, `status='NEW'`
- Incidió de "📅 Programado": guardará `booking_type='reservation'`, `status='PENDING'`

✅ **DriverReservationsScreen.tsx**
- Tab "📅 Reservas": Muestra SOLO `booking_type='reservation'` con `status='PENDING'`
- Tab "⚡ Inmediatos": Muestra SOLO `booking_type='immediate'` con `status='NEW'`
- Filtros SQL explícitos con logs para debug

✅ **Flujo después de aceptar**
- Ambos tipos (inmediato y reserva) van a **ReservationTripScreen**
- El screen muestra:
  - Mapa con ruta
  - Botones: "Iniciar Viaje", "Llamar Cliente", "Cancelar"
  - Fases: NAVEGANDO → LLEGADO → VIAJE INICIADO → COMPLETADO

---

## 🐛 DEBUG: Ver qué se está filtrando

En la app (una vez arriba), abre la consola React Native:

**Verás logs como:**
```
[RESERVAS] Trayendo reservas con filtro: https://...bookings?booking_type=eq.reservation&status=eq.PENDING...
[RESERVAS] Encontradas 3 reservas

[INMEDIATOS] Encontrados 5 servicios en rango de 3km
```

Si ves:
- `Encontradas 0 reservas` pero debería haber
- `Encontrados 0 servicios` pero debería haber

**Significa que `booking_type` NO está en la BD** → Ejecuta PASO 1

---

## 📝 Resumen de estados

| Modo | booking_type | status | Dónde busca conductor | Estado |
|------|-------------|--------|----------------------|--------|
| ⚡ Inmediato | `immediate` | `NEW` | Tab "Inmediatos" | ASAP |
| ⚡ Inmediato | `immediate` | `ACCEPTED` | Mapa + Viaje | Driver en camino |
| 📅 Programado | `reservation` | `PENDING` | Tab "Reservas" | Esperando driver |
| 📅 Programado | `reservation` | `ACCEPTED` | Mapa + Viaje | Driver confirmado |

---

## ⏱️ Rango dinámico (Inmediatos)

- 0 min: 3 km
- 5 min: 6 km  
- 10 min: 9 km
- 15 min: 12 km
- (Se reinicia a 3km si cambias de tab)

---

## ✅ Checklist final

- [ ] 1. Ejecuté `add-booking-mode-column.sql` en Supabase
- [ ] 2. Ejecuté `diagnose-booking-type-v2.sql` y vi booking_type en ambas tablas
- [ ] 3. Reinicié la app
- [ ] 4. Vi diferentes filtros en tabs "Reservas" vs "Inmediatos"
- [ ] 5. Creé un inmediato → apareció en tab "Inmediatos"
- [ ] 6. Creé una reserva → apareció en tab "Reservas"
- [ ] 7. Acepté ambos tipos → fueron a pantalla de viaje (mapa)
- [ ] 8. Puedo iniciar viaje desde ambos tipos

**Si algo no funciona, revisa los logs de React Native (cmd+D en Expo)** 📱
