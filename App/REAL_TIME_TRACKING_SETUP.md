# 🚗 Guía de Configuración: Seguimiento en Tiempo Real del Conductor

## 📋 Resumen del Problema

El módulo de "Mi Viaje Activo" debe mostrar:
1. ✅ La ubicación en tiempo real del conductor en el mapa
2. ✅ La distancia desde el cliente al conductor
3. ✅ El tiempo estimado de llegada (ETA)
4. ✅ Mapbox debe cargar correctamente

## 🔧 Pasos de Configuración

### 1. **Crear la tabla `booking_tracking` en Supabase**

```sql
-- Ejecuta el archivo: sql/001_create_booking_tracking_table.sql
-- En tu panel de Supabase:
-- 1. Ve a SQL Editor
-- 2. Copia y pega el contenido del archivo
-- 3. Ejecuta la query
```

**Esto crea:**
- Tabla `booking_tracking` con campos: `id`, `booking_id`, `driver_id`, `lat`, `lng`, `accuracy`, `created_at`
- Índices para performance en `booking_id`, `driver_id`, `created_at`
- Políticas RLS para seguridad
- Publicación realtime

### 2. **Verificar Configuración de Variables de Entorno**

En tu `.env`:
```
MAPBOX_ACCESS_TOKEN=pk_... (debes tener un token válido)
SUPABASE_URL=https://...supabase.co
SUPABASE_ANON_KEY=eyJ...
```

Verifica que:
- ✅ MAPBOX_ACCESS_TOKEN es válido (comienza con `pk_` o `sk_`)
- ✅ SUPABASE_URL es correcto
- ✅ SUPABASE_ANON_KEY es válido

### 3. **Cómo Funciona el Sistema**

#### **Lado del Conductor:**
```
1. Cuando aceptan viaje → status = 'ACCEPTED'
2. Cada 15 segundos:
   - Se obtiene la ubicación GPS actual
   - Se llama dispatch(updateLocation())
   - Se guarda en booking_tracking table
   - Se guarda en Firebase realtime DB
```

#### **Lado del Cliente:**
```
1. Cuando status = 'ACCEPTED':
   - Se carga el último punto de tracking conocido
   - Se suscribe a nuevos INSERT en booking_tracking
   - Cada nuevo punto:
     - Actualiza driverLocation state
     - Calcula distancia: cliente → conductor
     - Calcula ETA: conductor → pickup
     - Muestra en mapa + pill info
```

## 🐛 Debugging

### Mira los console logs:

#### **Driver está enviando datos:**
```
[tracking] insert ok { bookingId: "xxx", status: "ACCEPTED" }
```

#### **Cliente está recibiendo datos:**
```
[tracking][customer] subscribing { bookingId: "xxx", status: "ACCEPTED" }
[tracking][customer] channel status: SUBSCRIBED
[tracking][customer] new point received: { lat: 4.7123, lng: -74.0456, ... }
[tracking] Distance to driver: 2.5 km
[ETA] Distance: 2.5 km, Duration: 8 mins
```

### Si NO ves estos logs:

#### ❌ Problema: No se ve `[tracking] insert ok`
```
→ El conductor no está enviando ubicación
→ Verifica: permisos de localización en el conductor
→ Verifica: updateLocation se está ejecutando cada 15s
```

#### ❌ Problema: No se ve `[tracking][customer] channel status: SUBSCRIBED`
```
→ La suscripción a booking_tracking falló
→ Verifica: La tabla booking_tracking existe en Supabase
→ Verifica: RLS policies permitenSELECT/INSERT
→ Verifica: SUPABASE_ANON_KEY es correcto
```

#### ❌ Problema: El mapa no muestra marcador del conductor
```
→ driverLocation está null
→ Causas posibles:
   a) Tracking data no llega
   b) Supabase subscription falla
   c) No hay datos en booking_tracking table
```

## 🎯 Checklist de Verificación

- [ ] Tabla `booking_tracking` creada en Supabase
- [ ] RLS policies habilitadas con INSERT/SELECT correctos
- [ ] Realtime publication incluye booking_tracking
- [ ] MAPBOX_ACCESS_TOKEN configurado y válido
- [ ] Permisos de localización activos en app
- [ ] Firebase database configurado (si se usa dual-tracking)
- [ ] Ambos usuarios tienen conexión de red estable

## 📊 Flujo Completo de un Viaje

```
CLIENTE SOLICITA → CONDUCTOR ACEPTA
                    ↓
              Status = ACCEPTED
                    ↓
    CONDUCTOR: Inicia updateLocation() cada 15s
                    ↓
    Guarda en booking_tracking table
                    ↓
    CLIENTE: Recibe via realtime subscription
                    ↓
    Muestra en mapa + ETA pill
                    ↓
              "Tu conductor llega en 5 min"
                    ↓
              CONDUCTOR LLEGA
                    ↓
              Status = ARRIVED
                    ↓
    Detiene updateLocation() loop
```

## 🔗 Ficheros Clave

- `common/services/DriverTrackingService.ts` - Servicio de tracking (NEW)
- `app/Booking/BookingCabScren.tsx` - Pantalla principal (ACTUALIZADO)
- `common/store/bookingsSlice.ts` - Redux actions
- `sql/001_create_booking_tracking_table.sql` - Schema (NEW)

## 💡 Tips

1. **Desarrollo Local:** Usa emulador con GPS simulado
2. **Testing:** Abre console en dos dispositivos/simuladores
3. **Performance:** Los índices en booking_tracking son críticos
4. **Tiempo Real:** Supabase realtime tiene límites, monitorea uso

## 📞 Soporte

Si algo no funciona:
1. Verifica console logs (incluye el prefijo `[tracking]`)
2. Confirma table existe: `SELECT count(*) FROM booking_tracking`
3. Verifica policies: Ve a Database → booking_tracking → RLS
4. Comprueba MAPBOX_ACCESS_TOKEN es válido

---

**Última actualización:** 30 de abril de 2026
**Versión:** 1.0
