-- =====================================================
-- DIAGNÓSTICO: Verificar diferenciación de booking_type
-- =====================================================
-- Este script verifica si la columna existe y si los datos están correctamente diferenciados

-- 1. Verificar que la columna existe
SELECT COLUMN_NAME
FROM information_schema.COLUMNS
WHERE TABLE_NAME = 'bookings' AND COLUMN_NAME = 'booking_type';

-- 2. Ver distribución actual de booking_type
SELECT 
  booking_type,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'NEW' THEN 1 END) as new,
  COUNT(CASE WHEN status = 'ACCEPTED' THEN 1 END) as accepted,
  COUNT(CASE WHEN driver IS NOT NULL THEN 1 END) as with_driver
FROM public.bookings
GROUP BY booking_type;

-- 3. Ver últimas reservas programadas (PENDING)
SELECT 
  id, reference, booking_type, status, 
  customer_name, booking_date, created_at
FROM public.bookings
WHERE booking_type = 'reservation' AND status = 'PENDING'
ORDER BY created_at DESC
LIMIT 5;

-- 4. Ver últimos servicios inmediatos (NEW)
SELECT 
  id, reference, booking_type, status,
  customer_name, pickup_address, created_at
FROM public.bookings
WHERE booking_type = 'immediate' AND status = 'NEW'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Si hay NULL en booking_type, mostrarlos
SELECT COUNT(*) as null_booking_type
FROM public.bookings
WHERE booking_type IS NULL;
