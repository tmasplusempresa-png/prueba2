# 🔄 FLUJO DEL SISTEMA DE NOTIFICACIONES

## 📱 CLIENTE: Flujo de Notificación de Viaje

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENTE SOLICITA VIAJE                                      │
│ (SearchScreen.tsx → Booking request)                         │
└────────────────────┬────────────────────────────────────────┘
                     │ Send request to Supabase
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ CONDUCTOR ACEPTA EL VIAJE                                   │
│ (Status: ACCEPTED)                                           │
└────────────────────┬────────────────────────────────────────┘
                     │ Booking update via realtime subscription
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ CustomerActiveTripScreen.tsx                                 │
│ Detecta: booking.status === 'ACCEPTED'                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
  📍 setActiveTripId()    📢 scheduleActiveTripNotification()
  [Guarda booking.id en   [Crea notificación persistente]
   AsyncStorage]           - Título: "Tu viaje fue aceptado"
                           - Body: "Tu conductor está en camino..."
                           - Channel: tmasplus-active-trip
                           - Sticky: true
                     │
                     ▼
        ╔═════════════════════════════════╗
        ║ 🔔 NOTIFICACIÓN VISIBLE         ║
        ║ En barra de notificaciones       ║
        ║ (Persiste aunque cierres app)   ║
        ╚═════════════════════════════════╝
                     │
        ┌────────────┴────────────┐
        │ Usuario toca notificación (2 opciones)
        │
        ▼
  ┌─────────────────┐         ┌──────────────────┐
  │ App en          │         │ App cerrada:     │
  │ foreground      │         │ SO abre app      │
  │ → Navega        │         │ → NavesTo stored │
  │   automáticament│         │   booking screen │
  │   a Customer    │         │                  │
  │   ActiveTrip    │         └──────────────────┘
  │   Screen        │
  └─────────────────┘
        │
        ▼
  ╔════════════════════════════════╗
  ║ ESTADOS DEL VIAJE              ║
  ║ ACCEPTED   → [Primera notif]   ║
  ║ ARRIVED    → [Se actualiza]    ║
  ║ STARTED    → [Se actualiza]    ║
  ║ IN_PROGRESS→ [Se actualiza]    ║
  ║ COMPLETED  → [Se limpia]       ║
  ╚════════════════════════════════╝
        │
        ▼
  🏁 VIAJE COMPLETADO
  (BookingCabScreen.tsx)
        │
        ├─ clearActiveTripId()
        └─ cancelActiveTripNotification()
           │
           ▼
  ✅ Notificación desaparece
  ✅ AsyncStorage limpio
  ✅ Historial updatdo
```

---

## 🚗 CONDUCTOR: Flujo de Modo Activo

```
┌─────────────────────────────────────────────────────────────┐
│ CONDUCTOR ACTIVA MODO CONDUCTOR                             │
│ (Home.tsx → Toggle ON)                                      │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
  setupDriver     setDriver     showDriver
  Notification    ModeActive    Active
  Channel()       (true)        Notification()
        │            │            │
        ├─ Crear     ├─ Guardar   └─ Crear notif
        │  canal     │  en          persistente
        │  Android  │ AsyncStorage  - Título: "Conductor Activo"
        │           │  key: driver  - Body: "[Nombre], estás en línea"
        │           │  _mode_active - Channel: driver-active
        │           │  value: true  - Sticky: true
        │           │               - Sin sonido
        ▼           ▼               ▼
        └───────────┴───────────────┘
                    │
                    ▼
        ╔═════════════════════════════════╗
        ║ 🚗 NOTIFICACIÓN PERSISTENTE     ║
        ║ Conductor recibe solicitudes... ║
        ║ (Visible permanentemente)       ║
        ╚═════════════════════════════════╝
                    │
            ┌───────┴───────┐
            │               │
     Cliente solicita  [Conductor sigue
       servicio       recibiendo]
            │
            ▼
  Conductor ve notif de
  nueva solicitud
            │
            ├─ Aceptar → updateDriverNotification()
            │  "🎯 Servicio aceptado"
            │
            ├─ Llegar → updateDriverNotification()
            │  "📍 Cliente en punto"
            │
            ├─ Iniciar → updateDriverNotification()
            │  "▶️ Viaje en curso"
            │
            └─ Completar
                │
                ├─ clearActiveTripId()
                │  (Limpia viaje activo pero mantiene modo)
                │
                └─ Vuelve a "Esperando solicitudes"
                    │
                    ▼
        ╔═════════════════════════════════╗
        ║ 🚗 Notif: "Conductor Activo"   ║
        ║ (Sigue visible para próximas)  ║
        ╚═════════════════════════════════╝
                    │
            ┌───────┴───────────────────┐
            │ Si desactiva modo         │
            │ (toggle OFF)              │
            ▼
  setDriverModeActive(false)
  dismissDriverNotification()
            │
            ▼
  ✅ Notificación desaparece
  ✅ driver_mode_active = false
  ✅ AsyncStorage limpio
```

---

## 🔄 RESTAURACIÓN DE ESTADO: App Se Abre

```
┌─────────────────────────────────────────────────────────────┐
│ APP SE ABRE / USUARIO INICIA SESIÓN                         │
│ (_layout.tsx → onAuthStateChange)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─ dispatch(login(user))
                     │
                     ├─ registerForPushNotificationsAsync()
                     │
                     ├─ startBackgroundLocation()
                     │
                     └─► restoreAppState(userId) ◄──── 🔑 NUEVO
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    Get active      Get driver       Validar en
    trip from       mode from        Supabase
    AsyncStorage    AsyncStorage
        │               │               │
        │ ¿EXISTS?      │ ¿EXISTS?      │
        ▼               ▼               ▼
        │               │               │
    ┌─ SÍ              │               │
    │ │                └─ SÍ           │
    │ │                  │             │
    │ │                  ▼             │
    │ │            Verificar driver   │
    │ │            sigue online       │
    │ │            en profiles        │
    │ │                │              │
    │ │                ├─ SÍ          │
    │ │                │  restoreDriver│─┐
    │ │                │  ModeNotif()  │ │
    │ │                │              │ │
    │ │                └─ NO          │ │
    │ │                   Limpiar     │ │
    │ │                   AsyncStorage│ │
    │ │                              │ │
    │ └───────┐                      │ │
    │         │ Verificar booking    │ │
    │         │ en Supabase          │ │
    │         ▼                      │ │
    │    ¿Status ACTIVO?             │ │
    │    (ACCEPTED,ARRIVED,etc)      │ │
    │         │                      │ │
    │         ├─ SÍ                  │ │
    │         │  schedule            │ │
    │         │  ActiveTrip         │ │
    │         │  Notification()      │ │
    │         │                      │ │
    │         └─ NO                  │ │
    │            Limpiar            │ │
    │            AsyncStorage        │ │
    │                              │ │
    ▼                              ▼ ▼
    ╔════════════════════════════════════════╗
    ║ 🔄 ESTADO RESTAURADO                  ║
    ║                                        ║
    ║ • Notificaciones re-aparecenh          ║
    ║ • Viajes se restauran                  ║
    ║ • Usuario ve donde estaba              ║
    ║ • No pierde contexto                   ║
    ╚════════════════════════════════════════╝
```

---

## 🎯 FLUJO DE NOTIFICACIÓN TOCADA

```
┌──────────────────────────────────────────────────┐
│ USUARIO TOCA NOTIFICACIÓN EN BARRA/LOCK         │
│ (Notif persistente visible)                     │
└────────────────────┬─────────────────────────────┘
                     │
                     ▼ Android/iOS:
          ┌──────────────────────────┐
          │ Sistema operativo trae   │
          │ app a foreground         │
          │ (automaticamente)        │
          └────────┬─────────────────┘
                   │
                   ▼
    addNotificationResponseReceived
    Listener(_layout.tsx)
                   │
                   ├─ Parse data: type, bookingId, role
                   │
                   ▼
    CHECK: type === 'active-trip' ?
                   │
        ┌──────────┴──────────┐
        │ SÍ (Cliente)        │ NO: type === 'driver-active'
        │                     │
        ▼                     ▼
    Guardar            (Sin acción extra)
    bookingId en       App ya en foreground
    AsyncStorage       Conductor ve su pantalla
    ("pending_custom
     er_active_trip")
        │
        ▼
    Navigation.navigate()
    Ruta: CustomerActiveTrip + {bookingId}
        │
        ▼
    ╔━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ╗
    ║ 🎯 USUARIO EN VIAJE            ║
    ║                                 ║
    ║ • Ve ubicación conductor        ║
    ║ • Chat activo                   ║
    ║ • Tracking en tiempo real       ║
    ║ • Sin perder contexto           ║
    ╚━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ ╝
```

---

## 📊 TABLA DE ESTADOS Y TRANSICIONES

### CLIENTE

| Estado | Notificación | Acción | Next |
|--------|--------------|--------|------|
| - | ❌ | Solicita viaje | ACCEPTED |
| ACCEPTED | ✅ "Tu viaje fue aceptado" | Espera | ARRIVED |
| ARRIVED | ✅ "Tu conductor ha llegado" | Sube | STARTED |
| STARTED | ✅ "Tu viaje está en curso" | En viaje | IN_PROGRESS |
| IN_PROGRESS | ✅ "Tu viaje está en curso" | En viaje | COMPLETED |
| COMPLETED | ❌ (Se limpia) | Pago + Rating | - |

### CONDUCTOR

| Estado | Notificación | Acción | Next |
|--------|--------------|--------|------|
| Modo OFF | ❌ | Activa toggle | Modo ON |
| Modo ON | ✅ "Conductor Activo" | Espera solicitudes | - |
| - | ✅ "Servicio aceptado" | Acepta viaje | ARRIVED |
| ARRIVED | ✅ "Cliente en punto" | Espera cliente | STARTED |
| STARTED | ✅ "Viaje en curso" | En viaje | COMPLETED |
| COMPLETED | ✅ "Conductor Activo" | Pago + Vuelve a esperar | - |
| Modo OFF | ❌ (Se limpia) | Desactiva toggle | - |

---

## 🔐 ASYNC STORAGE KEYS

```
ClienteActivo:
├─ active_trip_id: "booking-uuid"
├─ notification_active_trip: "booking-uuid" (temporal)
└─ restore_state_log: [{timestamp, message}, ...]

ConductorActivo:
├─ driver_mode_active: "true"
├─ active_trip_id: "booking-uuid" (si hay viaje)
└─ restore_state_log: [{timestamp, message}, ...]

Limpieza al Logout:
└─ Borra todo excepto restore_state_log (para debugging)
```

---

## 💾 FIREBASE/SUPABASE INTEGRACIÓN

```
App solicita booking
        │
        ▼
Supabase: INSERT bookings {status: NEW}
        │
        ▼
Edge Function/Trigger envía FCM/Expo
        │
        ▼
Conductor recibe push (si en segundo plano)
        │
        ▼
Sistema OS muestra notificación
        │
        ▼
Conductor toca o app se abre
        │
        ▼
Realtime listeners en BookingRealtimeService
        │
        ├─ subscribeToNewBookings()
        ├─ subscribeToBookingUpdates()
        └─ subscribeToLocationTracking()
        │
        ▼
Cambios en booking.status
        │
        ├─ ACCEPTED → Cliente recibe notif
        ├─ ARRIVED → Status se actualiza
        ├─ STARTED → Tracking activado
        ├─ IN_PROGRESS → Ubicación en vivo
        └─ COMPLETED → Notif limpiada
```

---

## 🧪 TESTING: Path Completo

```
SCENARIO: Cliente solicita, conductor acepta, viaje completo

START
  │
  ├─ Test 1: SOLICITUD
  │  ├─ Abre app cliente
  │  ├─ Solicita viaje
  │  └─ ✅ Estado: NEW en Supabase
  │
  ├─ Test 2: ACEPTACIÓN (Conductor)
  │  ├─ Conductor acepta
  │  ├─ Status → ACCEPTED
  │  └─ ✅ Cliente ve notificación
  │
  ├─ Test 3: NOTIFICACIÓN PERSISTENTE
  │  ├─ Cierra app cliente
  │  ├─ Notificación sigue visible
  │  └─ ✅ Toca → Abre app en viaje
  │
  ├─ Test 4: TRACKING EN VIVO
  │  ├─ Conductor moves → Ubicación updatea
  │  ├─ Cliente ve mapa en vivo
  │  └─ ✅ Realtime funciona
  │
  ├─ Test 5: CONDUCTOR LLEGA
  │  ├─ Conductor: Estado ARRIVED
  │  ├─ Notificación cliente actualiza
  │  ├─ Cliente: "Tu conductor ha llegado"
  │  └─ ✅ Mensaje update
  │
  ├─ Test 6: VIAJE INICIA
  │  ├─ Estado: STARTED
  │  ├─ Notificación: "Viaje en curso"
  │  └─ ✅ Tracking continúa
  │
  ├─ Test 7: VIAJE COMPLETA
  │  ├─ Estado: COMPLETED
  │  ├─ Cliente paga
  │  ├─ Notificación desaparece
  │  └─ ✅ Limpieza OK
  │
  └─ Test 8: RESTAURACIÓN
     ├─ Cierra app completamente
     ├─ Abre app nuevamente
     ├─ ¿Se restauró el viaje?
     └─ ✅ Estado persistente OK

END - ALL TESTS PASS ✅
```

