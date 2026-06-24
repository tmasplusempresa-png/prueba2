-- =====================================================
-- RPC: get_active_booking_by_plate
-- PURPOSE: Resolve a plate number → active booking + last known driver position
-- Used by PlateTrackingScreen (no auth required for the lookup itself;
-- the caller still needs to be authenticated to use the realtime channel
-- via the "auth_view_active_bookings_tracking" policy below).
-- =====================================================

CREATE OR REPLACE FUNCTION get_active_booking_by_plate(p_plate text)
RETURNS TABLE(
  booking_id   uuid,
  driver_lat   decimal,
  driver_lng   decimal,
  last_update  timestamptz,
  booking_status text,
  driver_name  text,
  car_model    text,
  car_color    text,
  plate_number text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id                   AS booking_id,
    bt.lat                 AS driver_lat,
    bt.lng                 AS driver_lng,
    bt.created_at          AS last_update,
    b.status::text         AS booking_status,
    b.driver_name::text    AS driver_name,
    b.car_model::text      AS car_model,
    b.car_color::text      AS car_color,
    b.plate_number::text   AS plate_number
  FROM public.bookings b
  LEFT JOIN public.booking_tracking bt ON bt.booking_id = b.id
  WHERE lower(trim(b.plate_number)) = lower(trim(p_plate))
    AND b.status IN ('ACCEPTED', 'ARRIVED', 'STARTED')
  ORDER BY bt.created_at DESC NULLS LAST
  LIMIT 1;
END;
$$;

-- Grant execute to all authenticated users
GRANT EXECUTE ON FUNCTION get_active_booking_by_plate(text) TO authenticated;

-- =====================================================
-- RLS POLICY: allow authenticated users to SELECT tracking
-- for any booking that is currently active.
-- This is required so the Supabase Realtime channel subscription
-- (filtered by booking_id) is allowed after resolving plate → booking_id.
-- =====================================================
DROP POLICY IF EXISTS "auth_view_active_bookings_tracking" ON public.booking_tracking;
CREATE POLICY "auth_view_active_bookings_tracking"
  ON public.booking_tracking
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
      WHERE status IN ('ACCEPTED', 'ARRIVED', 'STARTED')
    )
  );
