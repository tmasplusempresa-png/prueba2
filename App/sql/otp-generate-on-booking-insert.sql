-- =====================================================
-- ADELANTAR OTP DE RECOGIDA AL CREAR EL BOOKING
-- =====================================================
-- Objetivo operativo: que el OTP de recogida quede generado y disponible
-- desde el instante en que se crea la reserva, para que el admin lo vea en
-- la web (CorporateBookingsPage / BookingDetailView) y pueda dárselo al
-- cliente cuando este no puede darlo por sí mismo.
--
-- Es un TRIGGER BEFORE INSERT: funciona igual sin importar el origen del
-- booking (app móvil vía saveBooking, o la web / edge functions). Es el
-- MISMO código que el conductor valida al llegar (Opción A: un solo OTP de
-- por vida). La app conductor ya NO lo regenera; solo lo lee.
--
-- Idempotente: se puede correr varias veces sin efectos secundarios.
-- =====================================================

-- 1) Función que genera el OTP de 4 dígitos si no viene ya asignado
CREATE OR REPLACE FUNCTION public.generate_booking_otp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.otp IS NULL OR NEW.otp = '' THEN
    NEW.otp := LPAD((FLOOR(RANDOM() * 10000))::int::text, 4, '0');
    NEW.otp_verified := COALESCE(NEW.otp_verified, false);
    NEW.otp_generated_at := COALESCE(NEW.otp_generated_at, NOW());
  END IF;
  RETURN NEW;
END;
$$;

-- 2) Trigger BEFORE INSERT en bookings
DROP TRIGGER IF EXISTS trg_generate_booking_otp ON public.bookings;

CREATE TRIGGER trg_generate_booking_otp
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.generate_booking_otp();

-- 3) (Opcional) Rellenar el OTP en reservas ACTIVAS que aún no lo tienen,
--    para que el admin también pueda ver el código de reservas ya creadas.
--    Ajusta el filtro de status según lo que consideres "activo".
-- UPDATE public.bookings
-- SET otp = LPAD((FLOOR(RANDOM() * 10000))::int::text, 4, '0'),
--     otp_verified = false,
--     otp_generated_at = NOW()
-- WHERE (otp IS NULL OR otp = '')
--   AND status IN ('NEW', 'ACCEPTED', 'ARRIVED');

-- 4) Verificación
SELECT tgname, tgenabled
FROM pg_trigger
WHERE tgrelid = 'public.bookings'::regclass
  AND tgname = 'trg_generate_booking_otp';
