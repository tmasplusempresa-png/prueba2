-- =====================================================
-- DIAGNÓSTICO: ¿Por qué no hay viajes recientes?
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. ¿Existe el usuario en public.users?
SELECT id, auth_id, email, first_name, last_name
FROM public.users
WHERE email = 'andresf.cristanchol@ecci.edu.co';

-- 2. ¿Cuántos bookings hay en total?
SELECT COUNT(*) AS total_bookings FROM public.bookings;

-- 3. ¿Hay bookings con referencia TST-?
SELECT id, customer_id, reference, status, created_at
FROM public.bookings
WHERE reference LIKE 'TST-%';

-- 4. ¿Hay bookings con customer_id = auth UUID?
SELECT id, customer_id, status, created_at
FROM public.bookings
WHERE customer_id = 'b6789038-c0ad-4ce7-bd4a-f9b1b69bbcd9'
LIMIT 5;

-- 5. ¿Qué customer_ids distintos hay? (primeros 10)
SELECT DISTINCT customer_id, COUNT(*) as total
FROM public.bookings
GROUP BY customer_id
ORDER BY total DESC
LIMIT 10;

-- 6. Listar TODAS las columnas de bookings (para ver qué existe realmente)
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'bookings'
ORDER BY ordinal_position;
