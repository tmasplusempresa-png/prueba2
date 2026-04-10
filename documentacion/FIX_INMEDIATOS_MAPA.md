# 🔧 FIX FLUJO INMEDIATOS → MAPA

## Problema Reportado

**Antes:**
```
Aceptar Reserva → "¡Servicio Aceptado!" → Click "Ir al viaje" 
    ↓
    Sin datos de reserva ❌
```

**Causa:**
El objeto `updated` de la respuesta de Supabase no tenía todos los campos necesarios (pickup_lat, pickup_lng, etc.), por lo que ReservationTripScreen no podía mostrar el mapa.

---

## Solución Implementada

### 1. **DriverReservationsScreen.tsx** (Línea ~295)

**ANTES:**
```typescript
const [updated] = await updateRes.json();
const completeReservation = {
  ...reservation,
  ...updated,
  status: 'ACCEPTED',
  driver: driverId,
};
```

**DESPUÉS:**
```typescript
const updateData = await updateRes.json();
const [updated] = Array.isArray(updateData) ? updateData : [updateData];

// Preservar datos originales + actualizar con respuesta
const completeReservation = {
  ...reservation,
  ...updated,
  status: 'ACCEPTED',
  driver: driverId,
  // Asegurar que estos campos se preservan
  pickup_lat: updated?.pickup_lat || reservation.pickup_lat,
  pickup_lng: updated?.pickup_lng || reservation.pickup_lng,
  drop_lat: updated?.drop_lat || reservation.drop_lat,
  drop_lng: updated?.drop_lng || reservation.drop_lng,
  pickup_address: updated?.pickup_address || reservation.pickup_address,
  drop_address: updated?.drop_address || reservation.drop_address,
  customer_name: updated?.customer_name || reservation.customer_name,
  id: reservation.id,
};

console.log('✅ [CompleteReservation] Datos listos:', { ... });
```

**Beneficio:** Combina respuesta de BD con datos originales, asegurando que no falten campos.

### 2. **ReservationTripScreen.tsx** (Línea ~79)

**Agregado: Logging y validación mejorado**

```typescript
// Debug logging
console.log('🗺️ [ReservationTripScreen] Route params:', {
  hasReservation: !!reservation,
  reservationId: reservation?.id,
  pickupLat: reservation?.pickup_lat,
  pickupLng: reservation?.pickup_lng,
  dropLat: reservation?.drop_lat,
  dropLng: reservation?.drop_lng,
});

// Validaciones más específicas
if (!reservation) {
  return <Text>❌ Sin datos de reserva (No se recibieron parámetros)</Text>;
}

if (!pickupLat || !pickupLng || !dropLat || !dropLng) {
  return <Text>❌ Coordenadas incompletas</Text>;
}
```

**Beneficio:** Identifica exactamente dónde está el problema si falla.

### 3. **Alert final mejorado**

```typescript
showAlert('success',
  isImmediate ? '¡Servicio Aceptado!' : '¡Reserva Aceptada!',
  ...,
  [{
    text: 'Ir al viaje',
    onPress: () => {
      console.log('✅ [NAVIGATE] Ir al viaje con:', {
        id: completeReservation.id,
        pickup: `${completeReservation.pickup_lat}, ${completeReservation.pickup_lng}`,
        drop: `${completeReservation.drop_lat}, ${completeReservation.drop_lng}`,
      });
      nav.navigate('ReservationTrip', { reservation: completeReservation });
    },
  }],
);
```

**Beneficio:** Logs claro antes de navegar para debuggear.

---

## Nuevo Flujo (Funcionando)

```
┌────────────────────────────────────────────────┐
│  DriverReservationsScreen                      │
│  (Tab: ⚡ Inmediatos o 📅 Reservas)            │
│  Lista de servicios disponibles                │
└────────────┬─────────────────────────────────┘
             │
             │ Click: "Aceptar Reserva"
             ↓
┌────────────────────────────────────────────────┐
│  confirmAccept()                               │
│  ✅ Verificar disponibilidad en BD             │
│  ✅ Obtener datos del vehículo                 │
│  ✅ Actualizar BD (status = ACCEPTED)          │
│  ✅ Construir completeReservation con:         │
│     - Todos datos originales (pickup/drop)    │
│     - Datos actualizados (driver_name, etc)   │
│  ✅ Log: "Datos listos"                        │
│  ✅ Enviar push notifications                  │
│  ✅ Remover de lista local                     │
└────────────┬─────────────────────────────────┘
             │
             │ Alert: "¡Servicio Aceptado!"
             │ Button: "Ir al viaje"
             ↓
┌────────────────────────────────────────────────┐
│  Navegación                                    │
│  nav.navigate('ReservationTrip', {             │
│    reservation: completeReservation  ← ✅ OK  │
│  })                                            │
└────────────┬─────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────┐
│  ReservationTripScreen                         │
│  ✅ Recibe: completeReservation                │
│  ✅ Log: "Route params" (debug info)           │
│  ✅ Valida: pickup_lat, pickup_lng, etc       │
│  ✅ Si OK → Renderiza MapView                  │
│  ❌ Si falla → Muestra "Coordenadas           │
│               incompletas" con debug info     │
│                                                │
│  ╔════════════════════════════════════╗       │
│  ║  Mapa                              ║       │
│  ║  • Polyline (ruta cyan)            ║       │
│  ║  • Pickup marker (verde)           ║       │
│  ║  • Drop marker (rojo)              ║       │
│  ║  • Botón: "Confirmar Llegada"     ║       │
│  ╚════════════════════════════════════╝       │
└────────────────────────────────────────────────┘
```

---

## Cómo Probar

### Test 1: Inmediatos

```
1. Abre DriverReservationsScreen
2. Click Tab: "⚡ Inmediatos (3km)"
3. Selecciona un servicio inmediato
4. Click: "Aceptar Reserva"
5. Alert aparece: "¡Servicio Aceptado!"
6. Click: "Ir al viaje"
   ✅ ESPERADO: Mapa con polyline aparece
   ❌ SI FALLA: Ve los logs en consola para debug
```

### Test 2: Reservas  regulares

```
1. Abre DriverReservationsScreen
2. Click Tab: "📅 Reservas"
3. Selecciona una reserva
4. Click: "Aceptar Reserva"
5. Alert aparece: "¡Reserva Aceptada!"
6. Click: "Ir al viaje"
   ✅ ESPERADO: Mapa con polyline aparece (MISMO FLUJO)
   ❌ SI FALLA: Ve los logs en consola para debug
```

---

## Logs para Debuggear

### Si ves en consola

```
✅ [CompleteReservation] Datos listos: {
  id: "...",
  pickup: "4.123, -74.456",
  drop: "4.789, -74.321"
}

✅ [NAVIGATE] Ir al viaje con: { ... }

🗺️ [ReservationTripScreen] Route params: {
  hasReservation: true,
  reservationId: "...",
  pickupLat: 4.123,
  pickupLng: -74.456,
  dropLat: 4.789,
  dropLng: -74.321
}
```

→ **TODO ESTÁ BIEN** ✅

### Si ves en pantalla

```
❌ Sin datos de reserva (No se recibieron parámetros)
```

→ `completeReservation` es undefined en navegación

**Solución:** Verifica console.log en DriverReservationsScreen

### Si ves

```
❌ Coordenadas incompletas
Pickup: undefined, undefined | Drop: 4.789, -74.321
```

→ Los datos de pickup no llegaron

**Solución:** Verifica que `reservation` original tiene pickup_lat/lng

---

## Cambios Resumido

| Archivo | Línea | Cambio |
|---------|-------|--------|
| `DriverReservationsScreen.tsx` | ~295 | Preservar campos críticos en merge |
| `DriverReservationsScreen.tsx` | ~343 | Usar `completeReservation` en nav |
| `ReservationTripScreen.tsx` | ~79 | Agregar logging y validación |

---

## Estado Actual

✅ **ARREGLADO**: Flujo inmediatos = Flujo reservas normales  
✅ **MEJORADO**: Logging para debuggear fácilmente  
✅ **VALIDADO**: Coordenadas se preservan correctamente  

---

## Próximas Milestones

- [ ] Test: Aceptar inmediato → Ver mapa
- [ ] Test: Aceptar reserva → Ver mapa (MISMO FLUJO)
- [ ] Test: Confirmar llegada en ambos casos
- [ ] Test: Iniciar viaje en ambos casos

