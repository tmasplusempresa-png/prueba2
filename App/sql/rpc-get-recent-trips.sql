-- ============================================================
-- RPC: get_customer_recent_trips
-- Devuelve los últimos 5 viajes de un usuario (bypasea RLS)
-- Ejecutar en Supabase SQL Editor
-- ============================================================
-- NOTA: Columnas reales de bookings (según database.types.ts):
--   customer_id, pickup_location (JSONB), destination_location (JSONB),
--   drop_location (JSONB), distance, duration, price, created_at

-- Eliminar función anterior si existe
DROP FUNCTION IF EXISTS get_customer_recent_trips(TEXT);

CREATE OR REPLACE FUNCTION get_customer_recent_trips(p_user_id TEXT)
RETURNS TABLE (
  id UUID,
  customer_id TEXT,
  pickup_location JSONB,
  destination_location JSONB,
  drop_location JSONB,
  created_at TIMESTAMPTZ,
  distance DOUBLE PRECISION,
  duration DOUBLE PRECISION,
  price DOUBLE PRECISION,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER  -- Ejecuta con permisos del owner, bypasea RLS
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.customer_id::TEXT,
    b.pickup_location::JSONB,
    b.destination_location::JSONB,
    b.drop_location::JSONB,
    b.created_at,
    b.distance::DOUBLE PRECISION,
    b.duration::DOUBLE PRECISION,
    b.price::DOUBLE PRECISION,
    b.status::TEXT
  FROM bookings b
  WHERE b.customer_id::TEXT = p_user_id
  ORDER BY b.created_at DESC
  LIMIT 5;
END;
$$;

-- Dar permiso de ejecución al rol anon y authenticated
GRANT EXECUTE ON FUNCTION get_customer_recent_trips(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_customer_recent_trips(TEXT) TO authenticated;
