# 🚀 Migración del Sistema de Bookings de Firebase a Supabase

## 📋 Resumen

Se ha migrado el sistema de reservas (bookings) de Firebase Realtime Database a Supabase PostgreSQL con suscripciones en tiempo real.

---

## 🗄️ Paso 1: Ejecutar el Schema SQL en Supabase

### Instrucciones:

1. Ir a [Supabase Dashboard](https://app.supabase.com)
2. Seleccionar tu proyecto
3. Ir a **SQL Editor** (icono de base de datos en el menú lateral)
4. Crear una nueva query
5. Copiar y pegar el contenido de `sql/bookings-schema.sql`
6. Ejecutar (botón "Run" o `Ctrl/Cmd + Enter`)

### Lo que crea este schema:

✅ **Tabla `bookings`** - Tabla principal de reservas con:
- Campos de cliente y conductor
- Ubicaciones de origen y destino
- Información del vehículo
- Costos y pagos
- Estados del viaje
- Seguridad (OTP)
- Promociones

✅ **Tabla `booking_tracking`** - Tracking en tiempo real de conductores

✅ **Triggers automáticos:**
- `update_bookings_updated_at` - Actualiza timestamp
- `generate_booking_reference` - Genera código único de 6 caracteres
- `calculate_total_cost` - Calcula costo total automáticamente
- `notify_new_booking` - Notifica nuevas reservas (para future integración)

✅ **Índices** para optimización de búsquedas

✅ **Row Level Security (RLS):**
- Clientes ven sus reservas
- Conductores ven reservas asignadas
- Conductores pueden actualizar sus reservas
- Admin tiene acceso completo

✅ **Vistas útiles:**
- `active_bookings` - Reservas activas con información de usuario
- `booking_stats` - Estadísticas por usuario

---

## 📝 Paso 2: Archivos Migrados

### ✅ Archivos Creados/Modificados:

1. **`sql/bookings-schema.sql`** ⭐ NUEVO
   - Schema completo de base de datos
   - **Acción:** Ejecutar en Supabase SQL Editor

2. **`common/actions/saveBooking.ts`** 🔄 MODIFICADO
   - Ahora usa Supabase en lugar de Firebase
   - Mapeo automático de campos
   - Logging detallado
   - **No requiere cambios adicionales**

3. **`common/services/BookingRealtimeService.ts`** ⭐ NUEVO
   - Servicio para suscripciones en tiempo real
   - Reemplaza listeners de Firebase
   - Métodos útiles:
     - `subscribeToNewBookings(city, callback)` - Escucha nuevas reservas
     - `subscribeToBookingUpdates(bookingId, callback)` - Cambios de una reserva
     - `subscribeToLocationTracking(bookingId, callback)` - Ubicación en tiempo real
     - `getActiveBookings(userId, userType)` - Obtener reservas activas
     - `updateBooking(bookingId, updates)` - Actualizar reserva
     - `insertTracking(bookingId, driverId, location)` - Insertar ubicación

---

## 🔧 Paso 3: Integración en el Código Existente

### Opción A: Uso del servicio en bookingsSlice.ts

Necesitas actualizar `common/store/bookingsSlice.ts` para usar el nuevo servicio:

```typescript
import BookingRealtimeService from '@/common/services/BookingRealtimeService';

// En lugar de Firebase listeners, usar:
export const listenToNewBookings = (city: string, driverId: string) => 
  (dispatch: AppDispatch, getState: () => RootState) => {
    
    BookingRealtimeService.subscribeToNewBookings(
      city,
      (newBooking) => {
        // Procesar nueva reserva
        dispatch(setNewBooking(newBooking));
        // Reproducir sonido
        playSound();
        // Enviar notificación al conductor
        sendNotificationToDriver(newBooking);
      },
      driverId
    );
  };
```

### Opción B: Uso directo en componentes

En `BookingScreen.tsx` o donde se creen reservas:

```typescript
import { saveBooking } from '@/common/actions/saveBooking';

const handleCreateBooking = async () => {
  const result = await saveBooking(bookingData);
  
  if (result.success) {
    console.log('Reserva creada:', result.uid);
    navigation.navigate('BookingCab', { booking: result.booking });
  } else {
    Alert.alert('Error', result.error);
  }
};
```

---

## 🔔 Paso 4: Sistema de Notificaciones

### Configurar en Cloud Functions o Edge Functions

Opción recomendada: **Supabase Edge Functions**

1. Crear Edge Function para notificaciones:

```bash
npx supabase functions new notify-drivers
```

2. Código de la función (`supabase/functions/notify-drivers/index.ts`):

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Escuchar nuevas reservas y enviar notificaciones push
  const { record } = await req.json();
  
  if (record.status === 'NEW') {
    // Buscar conductores disponibles en la ciudad
    const { data: drivers } = await supabase
      .from('users')
      .select('pushToken')
      .eq('user_type', 'driver')
      .eq('city', record.customer_city)
      .eq('driver_active_status', true);

    // Enviar notificaciones usando Expo Push API
    // ... código de notificaciones
  }

  return new Response('OK');
});
```

---

## 🧪 Paso 5: Testing

### Test de creación de reserva:

1. Ejecutar la app
2. Como cliente, crear una nueva reserva
3. Verificar en Supabase Dashboard → Table Editor → `bookings`
4. Debería aparecer la nueva reserva con:
   - `reference` generado automáticamente
   - `status = 'NEW'`
   - `total_cost` calculado correctamente
   - `created_at` y `updated_at` con timestamps

### Test de tiempo real:

1. Abrir SQL Editor en Supabase
2. Ejecutar:
```sql
INSERT INTO bookings (
  customer, customer_name, customer_city,
  pickup_address, pickup_lat, pickup_lng,
  drop_address, drop_lat, drop_lng,
  car_type, trip_cost, status
) VALUES (
  (SELECT id FROM users WHERE user_type = 'customer' LIMIT 1),
  'Test Cliente',
  'Bogotá',
  'Calle 123',
  4.7110,
  -74.0721,
  'Carrera 456',
  4.6097,
  -74.0817,
  'Sedan',
  15000,
  'NEW'
);
```

3. La app del conductor en Bogotá debería recibir notificación en tiempo real

---

## 📊 Paso 6: Dashboard de Monitoreo

### Consultas útiles:

**Ver reservas de hoy:**
```sql
SELECT * FROM bookings 
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;
```

**Estadísticas por ciudad:**
```sql
SELECT 
  customer_city,
  COUNT(*) as total_reservas,
  COUNT(CASE WHEN status = 'COMPLETE' THEN 1 END) as completadas,
  SUM(total_cost) as ingresos_totales
FROM bookings
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY customer_city;
```

**Conductores más activos:**
```sql
SELECT 
  driver_name,
  COUNT(*) as viajes_completados,
  SUM(driver_share) as ganancias
FROM bookings
WHERE status = 'PAID'
  AND driver IS NOT NULL
GROUP BY driver, driver_name
ORDER BY viajes_completados DESC
LIMIT 10;
```

---

## 🚨 Troubleshooting

### Error: "relation 'bookings' does not exist"
**Solución:** Ejecutar `sql/bookings-schema.sql` en Supabase

### Error: "row-level security policy"
**Solución:** Verificar que el usuario autenticado tenga el user_type correcto en la tabla `users`

### Realtime no funciona
**Solución:** 
1. Ir a Database → Replication en Supabase
2. Habilitar replicación para las tablas `bookings` y `booking_tracking`
3. Verificar que las políticas RLS permitan SELECT

### Notificaciones no llegan
**Solución:**
1. Verificar que los conductores tengan `pushToken` en la tabla `users`
2. Revisar logs de Edge Functions
3. Confirmar que `driver_active_status = true`

---

## 📈 Ventajas de la Migración

✅ **PostgreSQL** - Base de datos relacional robusta
✅ **Consultas SQL** - Queries complejas y agregaciones
✅ **Índices** - Búsquedas ultra-rápidas
✅ **Triggers** - Automatización de lógica
✅ **RLS** - Seguridad a nivel de fila
✅ **Real-time** - Suscripciones instantáneas
✅ **Escalabilidad** - Mejor rendimiento con grandes volúmenes
✅ **Backups automáticos** - Supabase hace backups diarios
✅ **Dashboard visual** - Ver y editar datos fácilmente
✅ **Migraciones** - Control de versiones del schema

---

## 🔄 Migración de Datos Existentes (Opcional)

Si tienes datos en Firebase que quieres migrar:

1. **Exportar de Firebase:**
```bash
firebase database:get /bookings > firebase-bookings.json
```

2. **Transformar y cargar en Supabase:**
```typescript
// Script de migración (crear archivo migrate-bookings.ts)
import supabase from './config/SupabaseConfig';
import firebaseBookings from './firebase-bookings.json';

async function migrateBookings() {
  for (const [id, booking] of Object.entries(firebaseBookings)) {
    const transformed = {
      // Mapear campos de Firebase a Supabase
      customer: booking.customer,
      customer_name: booking.customer_name,
      // ... mapear todos los campos
    };
    
    await supabase.from('bookings').insert([transformed]);
  }
}

migrateBookings();
```

---

## ✅ Checklist de Migración

- [ ] Ejecutar `sql/bookings-schema.sql` en Supabase
- [ ] Verificar que las tablas se crearon correctamente
- [ ] Habilitar Replicación para realtime
- [ ] Probar creación de reserva con `saveBooking()`
- [ ] Verificar que aparece en Supabase Dashboard
- [ ] Probar suscripción a nuevas reservas
- [ ] Configurar Edge Function para notificaciones (opcional)
- [ ] Migrar datos existentes de Firebase (si aplica)
- [ ] Actualizar `bookingsSlice.ts` con nuevo servicio
- [ ] Testing completo del flujo de reserva
- [ ] Desplegar a producción

---

## 📞 Soporte

Si encuentras problemas durante la migración, revisa:
1. Logs en consola del navegador (red, errores)
2. Logs en Supabase Dashboard → Logs
3. Network tab para ver requests fallidos
4. PostgreSQL errors en Supabase

**Documentación oficial:**
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [Supabase Database](https://supabase.com/docs/guides/database)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
