-- =====================================================
-- TABLE: booking_tracking
-- PURPOSE: Store real-time GPS coordinates of drivers
-- =====================================================

-- Create the booking_tracking table
CREATE TABLE IF NOT EXISTS public.booking_tracking (
  id BIGSERIAL PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  driver_id UUID,
  lat DECIMAL(10, 8) NOT NULL,
  lng DECIMAL(11, 8) NOT NULL,
  accuracy REAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_booking_tracking_booking_id ON public.booking_tracking(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_tracking_driver_id ON public.booking_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_booking_tracking_created_at ON public.booking_tracking(created_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE public.booking_tracking ENABLE ROW LEVEL SECURITY;

-- Allow drivers to insert their own tracking data
DROP POLICY IF EXISTS "drivers_insert_own_tracking" ON public.booking_tracking;
CREATE POLICY "drivers_insert_own_tracking"
  ON public.booking_tracking
  FOR INSERT
  TO authenticated
  WITH CHECK (driver_id = auth.uid() OR driver_id IS NULL);

-- Allow drivers to view their own tracking data
DROP POLICY IF EXISTS "drivers_view_own_tracking" ON public.booking_tracking;
CREATE POLICY "drivers_view_own_tracking"
  ON public.booking_tracking
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

-- Allow customers to view tracking data for their bookings
DROP POLICY IF EXISTS "customers_view_booking_tracking" ON public.booking_tracking;
CREATE POLICY "customers_view_booking_tracking"
  ON public.booking_tracking
  FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM public.bookings
      WHERE customer = auth.uid()
    )
  );

-- Allow system/admin to manage all tracking data
DROP POLICY IF EXISTS "service_role_all_tracking" ON public.booking_tracking;
CREATE POLICY "service_role_all_tracking"
  ON public.booking_tracking
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a realtime subscription for new inserts
ALTER PUBLICATION supabase_realtime ADD TABLE booking_tracking;
