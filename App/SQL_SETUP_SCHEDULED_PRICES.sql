-- ⭐ AGREGAR COLUMNA scheduled_price A car_types EN SUPABASE

-- 1. Agregar la columna si no existe
ALTER TABLE car_types ADD COLUMN IF NOT EXISTS scheduled_price NUMERIC DEFAULT 0;

-- 2. Configurar tarifas fijas para viajes PROGRAMADOS
-- Ajusta estos valores según tus necesidades
UPDATE car_types SET scheduled_price = 15000 WHERE name = 'T+Plus Especial' OR key = 'T+Plus Especial';
UPDATE car_types SET scheduled_price = 12000 WHERE name = 'Particular' OR key = 'Particular';
UPDATE car_types SET scheduled_price = 18000 WHERE name = 'Van' OR key = 'Van';
UPDATE car_types SET scheduled_price = 10000 WHERE name = 'Taxi' OR key = 'Taxi';

-- 3. Verificar que se guardaron correctamente
SELECT id, name, scheduled_price FROM car_types WHERE is_active = true;
