# 🧪 Guía de Testing: Seguimiento en Tiempo Real

## 📱 Setup para Testing

### Simulación de Dos Usuarios

**Opción 1: Dos Emuladores**
```bash
# Terminal 1: Emulador Android
emulator -avd Pixel_6_API_30

# Terminal 2: Emulador iPhone  
xcrun simctl launch booted open geoLocation://device  # Para simular GPS en iOS
```

**Opción 2: Un Emulador + Un Dispositivo Físico**
```bash
# Asegúrate de estar en la misma red WiFi
adb connect <dispositivo_ip>:5555
```

**Opción 3: Dos Emuladores Android**
```bash
# Terminal 1
emulator -avd Pixel_6_API_30

# Terminal 2
emulator -avd Pixel_5_API_31
```

## 🧬 Test Case 1: Verificar Tabla Supabase

### Objetivo
Confirmar que `booking_tracking` existe y tiene permissions correctas

### Pasos
1. Abre panel de Supabase
2. Ve a **SQL Editor**
3. Ejecuta:
```sql
SELECT 
  table_name,
  grants
FROM 
  information_schema.tables
WHERE 
  table_schema = 'public'
  AND table_name = 'booking_tracking';
```

### Resultado Esperado
```
booking_tracking | rls policies configuradas
```

### Si Falla
- Tabla no existe → Ejecuta `sql/001_create_booking_tracking_table.sql`
- RLS no configurado → Verifica policies en Supabase UI

---

## 🧬 Test Case 2: Verificar Permisos de Localización

### Objetivo
Confirmarthat app tiene acceso a GPS

### Pasos (iOS)
1. Abre **Settings** → **App Name** → **Location**
2. Selecciona "While Using"
3. Vuelve a la app

### Pasos (Android)
1. Abre **Settings** → **Apps** → **App Name** → **Permissions** → **Location**
2. Selecciona "Allow only while using the app"
3. Vuelve a la app

### Test
```javascript
// En console durante la app
console.log('🔍 Testing Location:');
Location.getForegroundPermissionsAsync().then(status => {
  console.log('Location Status:', status.status); // Debe ser 'granted'
});
```

---

## 🧬 Test Case 3: Flujo Completo de Tracking

### Escenario
- **Usuario A**: Cliente
- **Usuario B**: Conductor

### Setup
1. Abre app en dos emuladores/dispositivos
2. Cliente A inicia sesión como customer
3. Cliente B inicia sesión como driver

### Pasos

#### Fase 1: Cliente solicita viaje
```
[A] Clic en "Solicitar viaje"
[A] Ingresa Origen → Destino
[A] Presiona "Solicitar"
→ Booking status = 'NEW'
→ Abierto a que conductores acepten
```

#### Fase 2: Conductor acepta
```
[B] Ve solicitud nueva
[B] Presiona "Aceptar"
→ Booking status = 'ACCEPTED'
→ COMIENZA TRACKING
```

#### Fase 3: Verificar Logs en Console

**En Conductor (B):**
```
[tracking] insert ok { bookingId: "xxx-xxx", status: "ACCEPTED" }
[tracking] insert ok { bookingId: "xxx-xxx", status: "ACCEPTED" }
[tracking] insert ok { bookingId: "xxx-xxx", status: "ACCEPTED" }
```
(Cada 15 segundos)

**En Cliente (A):**
```
[tracking][customer] subscribing { bookingId: "xxx-xxx", status: "ACCEPTED" }
[tracking][customer] channel status: SUBSCRIBED
[tracking][customer] new point received: { lat: 4.7123, lng: -74.0456 }
[tracking] Distance to driver: 2.34 km
[ETA] Distance: 2.34 km, Duration: 8 mins
```

### Resultado Esperado
- ✅ Mapa en Cliente muestra marcador rojo del conductor
- ✅ ETA pill muestra "Tu conductor llega en X min"
- ✅ Distancia se actualiza cada 15 segundos
- ✅ Cámara del mapa sigue al conductor

### Si Falla

**Síntoma**: No ves logs de conductor
```
→ Verifica permisos de localización en dispositivo B
→ Verifica dispatch(updateLocation) está activo cada 15s
→ Revisa console para errores en insertTrackingPoint
```

**Síntoma**: No ves logs de cliente
```
→ Verifica booking_tracking table existe
→ Verifica RLS policies permiten SELECT
→ Abre DevTools: Verifica red Supabase realtime está conectada
```

**Síntoma**: Marcador no aparece en mapa
```
→ Verifica driverLocation state no es null
→ Verifica currentBooking.status === 'ACCEPTED'
→ Verifica mapbox token es válido
```

---

## 🧬 Test Case 4: ETA Calculation

### Objetivo
Verificar que cálculo de ETA es preciso

### Pasos
1. En cliente, anota ETA mostrado (ej: "8 mins")
2. Mira Mapbox Directions API response:

```javascript
// En BookingCabScren.tsx, agrega log:
console.log('API Response:', {
  distance: result.distance,
  duration: result.duration,
  formatted: `${result.distance.toFixed(1)}km en ${result.duration}mins`
});
```

3. Compara con Google Maps
   - Abre Google Maps
   - Ingresa coordenadas conductor → pickup
   - Compara ETA

### Resultado Esperado
- ±2 minutos de diferencia es normal (tráfico dinámico)

---

## 🧬 Test Case 5: Cambios de Estado

### Objetivo
Verificar que sistema maneja transiciones correctas

### Pasos

```
1. ACCEPTED → Tracking activo ✅
2. ARRIVED → Muestra código OTP ✅
3. STARTED → Sigue tracking ✅
4. REACHED → Detiene tracking ✅
5. CANCELLED → Limpia todo ✅
```

### Test Log
```javascript
console.log('📊 Booking Status:', {
  current: currentBooking.status,
  driverLocation: !!driverLocation,
  eta: etaToPickup,
  distance: distanceToDriver
});
```

---

## 🧬 Test Case 6: Fallback a Firebase

### Objetivo
Verificar que si Supabase falla, Firebase funciona como backup

### Setup
```
// En DriverTrackingService.ts, ambos servicios funcionan:
- subscribeToSupabaseTracking() → PRIMARY
- subscribeToDriverTracking() → FALLBACK (Firebase)
```

### Pasos (Simular falla Supabase)
1. Desconecta internet del conductor
2. Reconecta
3. Verifica que sigue recibiendo updates (via Firebase)

### Resultado Esperado
- Transición suave entre servicios
- Sin interrupción visible del tracking

---

## 📊 Tabla de Verificación

| Componente | ¿Funciona? | Evidence (Console Log) |
|---|---|---|
| Ubicación GPS conductor | ✅/❌ | `[tracking] insert ok` |
| Inserción en Supabase | ✅/❌ | `[tracking] insert FAILED` si error |
| Realtime subscription cliente | ✅/❌ | `[tracking][customer] channel status: SUBSCRIBED` |
| Recepción de puntos | ✅/❌ | `[tracking][customer] new point received` |
| Cálculo de distancia | ✅/❌ | `[tracking] Distance to driver: X km` |
| Cálculo de ETA | ✅/❌ | `[ETA] Distance: X km, Duration: Y mins` |
| Visualización en mapa | ✅/❌ | Marcador visible en cliente |
| Actualización ETA pill | ✅/❌ | "Tu conductor llega en X min" |

---

## 🔍 Comandos útiles en Console

```javascript
// Ver estado actual de tracking
console.log({
  driverLocation,
  distanceToDriver,
  etaToPickup,
  estimatedDistance,
  estimatedTime
});

// Forzar recalculación de ETA
dispatch(updateLocation({ booking: currentBooking, driverProfile: user }));

// Ver últimos puntos de tracking en Supabase
supabase
  .from('booking_tracking')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(10)
  .then(({data}) => console.table(data));
```

---

## 💾 Reportar Bugs

Si algo falla, incluye:

1. **Logs de console** (copiar con prefijos `[tracking]`, `[ETA]`)
2. **Versión de app** y **ambiente** (dev/prod)
3. **Device info** (emulator/physical, OS version)
4. **Pasos para reproducir**
5. **Expected vs Actual behavior**

---

**Última actualización:** 30 de abril de 2026
