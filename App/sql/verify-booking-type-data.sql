-- =====================================================
-- VERIFICACIÓN: Estructura actual de booking_type
-- =====================================================

-- 1. Verificar que booking_type existe y tiene datos
SELECT 
  booking_type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'NEW' THEN 1 END) as new,
  COUNT(CASE WHEN status = 'ACCEPTED' THEN 1 END) as accepted,
  COUNT(CASE WHEN status = 'COMPLETE' THEN 1 END) as complete
FROM public.bookings
GROUP BY booking_type
ORDER BY booking_type;

-- 2. Mostrar las últimas 5 RESERVAS (booking_type='reservation', status='PENDING')
SELECT 
  id, reference, booking_type, status,
  customer_name, booking_date
FROM public.bookings
WHERE booking_type = 'reservation' AND status = 'PENDING'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Mostrar los últimos 5 INMEDIATOS (booking_type='immediate', status='NEW')
SELECT 
  id, reference, booking_type, status,
  customer_name, pickup_address, created_at
FROM public.bookings
WHERE booking_type = 'immediate' AND status = 'NEW'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Contar por tipo Y estado (matriz)
SELECT 
  booking_type,
  status,
  COUNT(*) as count
FROM public.bookings
GROUP BY booking_type, status
ORDER BY booking_type, status;

-- 5. Ver si hay NULLs en booking_type
SELECT COUNT(*) as null_count
FROM public.bookings
WHERE booking_type IS NULL;

-- =====================================================
-- Si todo está bien, verás:
-- booking_type='immediate' con status='NEW' en tabla 3
-- booking_type='reservation' con status='PENDING' en tabla 2
-- =====================================================
