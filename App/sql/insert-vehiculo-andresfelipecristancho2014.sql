-- Script para insertar un vehículo para el usuario andresfelipecristancho2014@gmail.com
-- Ejecutar en el editor SQL de Supabase

begin;

-- 1) Obtener el id del usuario
select id, email from public.users where lower(email) = lower('andresfelipecristancho2014@gmail.com');
-- Reemplaza el valor de driver_id abajo con el id obtenido

-- 2) Insertar vehículo
insert into public.cars (
  driver_id,
  make,
  model,
  plate,
  color,
  fuel_type,
  transmission,
  capacity,
  is_active,
  features
) values (
  'REEMPLAZAR_CON_ID', -- id del usuario
  'Chevrolet',         -- marca
  'Spark',             -- modelo
  'ABC123',            -- placa
  'Blanco',            -- color
  'Gasolina',          -- tipo de combustible
  'MECANICO',          -- transmisión
  4,                   -- capacidad
  true,                -- activo
  '{"carType": "TREAS-X"}'::json -- características
);

-- 3) Verificar inserción
select * from public.cars where driver_id = 'REEMPLAZAR_CON_ID' order by created_at desc limit 1;

commit;

-- NOTA: Cambia 'REEMPLAZAR_CON_ID' por el id real del usuario antes de ejecutar.