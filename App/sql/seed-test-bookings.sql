-- =====================================================
-- SEED DE VIAJES DE PRUEBA (BOOKINGS)
-- =====================================================
-- Usa directamente el auth UUID conocido (no depende de public.users.auth_id)

-- Primero elimina viajes de prueba anteriores
DELETE FROM public.bookings WHERE reference LIKE 'TST-%';

-- UUID del usuario autenticado (de los logs: Auth State Change)
-- Si tu UUID es diferente, cámbialo aquí:
DO $$
DECLARE
  v_customer_id UUID := 'b6789038-c0ad-4ce7-bd4a-f9b1b69bbcd9';
BEGIN
  INSERT INTO public.bookings (customer_id, customer, pickup_location, destination_location, drop_location, pickup_address, drop_address, pickup_lat, pickup_lng, drop_lat, drop_lng, distance, duration, price, payment_mode, status, reference, created_at, updated_at)
  VALUES
    (v_customer_id, v_customer_id,
     '{"lat": 4.610356, "lng": -74.070546, "address": "Cra 7 #32-16, Bogota"}'::jsonb,
     '{"lat": 4.657191, "lng": -74.061318, "address": "Av. Chile #72-31, Bogota"}'::jsonb,
     '{"lat": 4.657191, "lng": -74.061318, "address": "Av. Chile #72-31, Bogota"}'::jsonb,
     'Cra 7 #32-16, Bogota', 'Av. Chile #72-31, Bogota',
     4.610356, -74.070546, 4.657191, -74.061318,
     8.40, 22, 21000, 'cash', 'COMPLETE', 'TST-001', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

    (v_customer_id, v_customer_id,
     '{"lat": 4.676379, "lng": -74.056978, "address": "Calle 80 #10-43, Bogota"}'::jsonb,
     '{"lat": 4.676983, "lng": -74.048126, "address": "Parque de la 93, Bogota"}'::jsonb,
     '{"lat": 4.676983, "lng": -74.048126, "address": "Parque de la 93, Bogota"}'::jsonb,
     'Calle 80 #10-43, Bogota', 'Parque de la 93, Bogota',
     4.676379, -74.056978, 4.676983, -74.048126,
     4.10, 13, 10250, 'cash', 'COMPLETE', 'TST-002', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

    (v_customer_id, v_customer_id,
     '{"lat": 4.658339, "lng": -74.112771, "address": "Terminal Salitre, Bogota"}'::jsonb,
     '{"lat": 4.701594, "lng": -74.146947, "address": "Aeropuerto El Dorado, Bogota"}'::jsonb,
     '{"lat": 4.701594, "lng": -74.146947, "address": "Aeropuerto El Dorado, Bogota"}'::jsonb,
     'Terminal Salitre, Bogota', 'Aeropuerto El Dorado, Bogota',
     4.658339, -74.112771, 4.701594, -74.146947,
     9.60, 18, 24000, 'cash', 'COMPLETE', 'TST-003', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

    (v_customer_id, v_customer_id,
     '{"lat": 4.694604, "lng": -74.090084, "address": "CC Titan Plaza, Bogota"}'::jsonb,
     '{"lat": 4.703230, "lng": -74.042274, "address": "Unicentro Bogota"}'::jsonb,
     '{"lat": 4.703230, "lng": -74.042274, "address": "Unicentro Bogota"}'::jsonb,
     'CC Titan Plaza, Bogota', 'Unicentro Bogota',
     4.694604, -74.090084, 4.703230, -74.042274,
     11.70, 27, 29250, 'cash', 'COMPLETE', 'TST-004', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

    (v_customer_id, v_customer_id,
     '{"lat": 4.658941, "lng": -74.093765, "address": "Biblioteca Virgilio Barco, Bogota"}'::jsonb,
     '{"lat": 4.648873, "lng": -74.077886, "address": "Movistar Arena, Bogota"}'::jsonb,
     '{"lat": 4.648873, "lng": -74.077886, "address": "Movistar Arena, Bogota"}'::jsonb,
     'Biblioteca Virgilio Barco, Bogota', 'Movistar Arena, Bogota',
     4.658941, -74.093765, 4.648873, -74.077886,
     5.80, 15, 14500, 'cash', 'COMPLETE', 'TST-005', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days');

  RAISE NOTICE 'Insertados 5 viajes de prueba para customer_id: %', v_customer_id;
END $$;

-- Verificación
SELECT id, customer_id, customer, pickup_address, drop_address, distance, price, status, reference, created_at
FROM public.bookings
WHERE reference LIKE 'TST-%'
ORDER BY created_at DESC;
