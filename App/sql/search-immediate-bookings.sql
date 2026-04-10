-- =====================================================
-- FUNCIÓN RPC: Buscar servicios inmediatos disponibles por rango de distancia
-- =====================================================
-- Esta función permite a los conductores buscar servicios inmediatos (ASAP)
-- dentro de un rango especificado que aumenta gradualmente
-- =====================================================

CREATE OR REPLACE FUNCTION search_immediate_bookings(
  driver_lat DECIMAL,
  driver_lng DECIMAL,
  range_km DECIMAL,
  driver_id UUID
)
RETURNS TABLE (
  id UUID,
  reference VARCHAR,
  customer_name VARCHAR,
  customer_contact VARCHAR,
  customer_token TEXT,
  pickup_address TEXT,
  drop_address TEXT,
  pickup_lat DECIMAL,
  pickup_lng DECIMAL,
  drop_lat DECIMAL,
  drop_lng DECIMAL,
  booking_date TIMESTAMPTZ,
  distance_to_pickup DECIMAL,
  booking_distance DECIMAL,
  duration INTEGER,
  estimate DECIMAL,
  driver_share DECIMAL,
  car_type VARCHAR,
  trip_type VARCHAR,
  payment_mode VARCHAR,
  observations TEXT,
  customer_id UUID,
  status VARCHAR
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.id,
    b.reference,
    b.customer_name,
    b.customer_contact,
    b.customer_token,
    b.pickup_address,
    b.drop_address,
    b.pickup_lat,
    b.pickup_lng,
    b.drop_lat,
    b.drop_lng,
    b.booking_date,
    -- Calcular distancia desde driver actual a pickup (en km)
    ROUND(
      (
        3959 * acos(
          cos(radians(driver_lat)) * cos(radians(b.pickup_lat::numeric)) * 
          cos(radians(b.pickup_lng::numeric) - radians(driver_lng)) + 
          sin(radians(driver_lat)) * sin(radians(b.pickup_lat::numeric))
        )
      )::numeric / 1.60934, 
      2
    ) as distance_to_pickup,
    b.distance,
    b.duration,
    b.estimate,
    b.driver_share,
    b.car_type,
    b.trip_type,
    b.payment_mode,
    b.observations,
    b.customer,
    b.status
  FROM public.bookings b
  WHERE 
    -- Filtros principales
    b.booking_type = 'immediate'
    AND b.status = 'NEW'
    AND b.driver IS NULL
    -- Rango de distancia
    AND (
      3959 * acos(
        cos(radians(driver_lat)) * cos(radians(b.pickup_lat::numeric)) * 
        cos(radians(b.pickup_lng::numeric) - radians(driver_lng)) + 
        sin(radians(driver_lat)) * sin(radians(b.pickup_lat::numeric))
      )
    ) / 1.60934 <= range_km
    -- Excluir si el driver ya tiene esta reserva o está rechazada
    AND (b.requested_drivers::jsonb ? driver_id::text) IS NOT TRUE
    -- Ordenar por distancia (más cercanos primero)
  ORDER BY distance_to_pickup ASC, b.created_at DESC
  LIMIT 50;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- COMENTARIOS
-- =====================================================
-- 
-- USO:
-- SELECT * FROM search_immediate_bookings(
--   4.7110,      -- driver_lat (Bogotá ejemplo)
--   -74.0721,    -- driver_lng
--   3.0,         -- range_km (3km inicial)
--   'driver-uuid'-- driver_id
-- );
--
-- RANGO DINÁMICO (en aplicación):
-- - Inicial: 3 km
-- - 5 min: 6 km
-- - 10 min: 9 km
-- - 15 min: 12 km
-- - etc, +3km cada 5 minutos
--

-- Crear índice para optimización de búsquedas geoespaciales
CREATE INDEX IF NOT EXISTS idx_bookings_immediate_pickup_coords 
  ON public.bookings(booking_type, status, driver) 
  WHERE booking_type = 'immediate' AND status = 'NEW' AND driver IS NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_immediate_created 
  ON public.bookings(created_at DESC) 
  WHERE booking_type = 'immediate' AND status = 'NEW';
