-- =====================================================
-- MIGRATION 003: Auto-fill vehicle info when driver is assigned
-- Triggered on INSERT (driver pre-assigned) and on UPDATE
-- when the driver field changes from NULL → a value.
-- Source: public.cars WHERE driver_id = NEW.driver AND is_active = true
-- =====================================================

-- Add car_color column if it doesn't exist (referenced by get_active_booking_by_plate RPC)
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS car_color VARCHAR(100);

-- =====================================================
-- TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION fill_vehicle_info_on_driver_assign()
RETURNS TRIGGER AS $$
DECLARE
  v_plate   VARCHAR(20);
  v_make    VARCHAR(100);
  v_model   VARCHAR(100);
  v_color   VARCHAR(100);
  v_mobile  VARCHAR(50);
BEGIN
  -- Only run when a driver is being set for the first time
  IF NEW.driver IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.driver IS DISTINCT FROM NEW.driver) THEN
    SELECT
      c.plate,
      c.make,
      c.model,
      c.color
    INTO
      v_plate, v_make, v_model, v_color
    FROM public.cars c
    WHERE c.driver_id = NEW.driver
      AND c.is_active = true
    ORDER BY c.updated_at DESC
    LIMIT 1;

    SELECT REGEXP_REPLACE(COALESCE(u.mobile, ''), '^\+57', '')
    INTO v_mobile
    FROM public.users u
    WHERE u.id = NEW.driver
    LIMIT 1;

    IF FOUND OR v_plate IS NOT NULL THEN
      NEW.plate_number   := COALESCE(NEW.plate_number,   v_plate);
      NEW.vehicle_make   := COALESCE(NEW.vehicle_make,   v_make);
      NEW.car_model      := COALESCE(NEW.car_model,      v_model);
      NEW.vehicle_model  := COALESCE(NEW.vehicle_model,  v_model);
      NEW.car_color      := COALESCE(NEW.car_color,      v_color);
      NEW.vehicle_color  := COALESCE(NEW.vehicle_color,  v_color);
      NEW.driver_contact := COALESCE(NEW.driver_contact, v_mobile);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ATTACH TRIGGER
-- =====================================================
DROP TRIGGER IF EXISTS trigger_fill_vehicle_on_driver_assign ON public.bookings;
CREATE TRIGGER trigger_fill_vehicle_on_driver_assign
  BEFORE INSERT OR UPDATE OF driver
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION fill_vehicle_info_on_driver_assign();

-- =====================================================
-- BACKFILL: update existing ACCEPTED/ARRIVED/STARTED bookings
-- that are missing vehicle info but have a driver assigned
-- =====================================================
UPDATE public.bookings b
SET
  plate_number   = COALESCE(b.plate_number,   c.plate),
  vehicle_make   = COALESCE(b.vehicle_make,   c.make),
  car_model      = COALESCE(b.car_model,      c.model),
  vehicle_model  = COALESCE(b.vehicle_model,  c.model),
  car_color      = COALESCE(b.car_color,      c.color),
  vehicle_color  = COALESCE(b.vehicle_color,  c.color),
  driver_contact = COALESCE(b.driver_contact, REGEXP_REPLACE(COALESCE(u.mobile, ''), '^\+57', ''))
FROM public.cars c, public.users u
WHERE b.driver = c.driver_id
  AND u.id = b.driver
  AND c.is_active = true
  AND b.driver IS NOT NULL
  AND (
    b.plate_number   IS NULL OR
    b.vehicle_make   IS NULL OR
    b.car_model      IS NULL OR
    b.vehicle_model  IS NULL OR
    b.car_color      IS NULL OR
    b.vehicle_color  IS NULL OR
    b.driver_contact IS NULL
  );
