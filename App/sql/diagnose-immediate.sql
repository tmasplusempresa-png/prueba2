-- =====================================================
-- DIAGNÓSTICO: ¿Por qué no se ven los servicios inmediatos?
-- =====================================================

-- 1. Ver TODOS los bookings (últimos 10)
SELECT 
  id,
  reference,
  booking_type,
  status,
  customer_status,
  driver,
  pickup_address,
  created_at,
  customer_name
FROM bookings
ORDER BY created_at DESC
LIMIT 10;

-- 2. Ver específicamente los que DEBERÍAN aparecer (booking_type='immediate' y status='NEW')
SELECT 
  id,
  reference,
  booking_type,
  status,
  customer_status,
  driver,
  customer_name,
  created_at
FROM bookings
WHERE booking_type = 'immediate' 
  AND status = 'NEW'
ORDER BY created_at DESC;

-- 3. Ver la DISTRIBUCIÓN de booking_type
SELECT 
  booking_type,
  COUNT(*) as total
FROM bookings
GROUP BY booking_type;

-- 4. Ver DISTRIBUCIÓN de status
SELECT 
  status,
  COUNT(*) as total
FROM bookings
GROUP BY status;

-- 5. Ver la COMBINACIÓN (booking_type + status) - es lo que importa
SELECT 
  booking_type,
  status,
  COUNT(*) as total
FROM bookings
GROUP BY booking_type, status
ORDER BY booking_type, status;

-- 6. Ver si hay algún booking con driver asignado
SELECT 
  id,
  reference,
  booking_type,
  driver,
  status
FROM bookings
WHERE driver IS NOT NULL
LIMIT 5;
