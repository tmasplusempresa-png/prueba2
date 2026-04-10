-- =====================================================
-- MIGRACIÓN: Diferenciación entre RESERVAS e INMEDIATOS
-- =====================================================
-- Esta migración agrega la columna booking_type para
-- diferenciar entre booking_type='immediate' y booking_type='reservation'
-- =====================================================

-- 1. Agregar columna booking_type si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'booking_type'
  ) THEN
    ALTER TABLE public.bookings 
      ADD COLUMN booking_type VARCHAR(20) DEFAULT 'immediate';
    RAISE NOTICE 'Columna booking_type creada';
  ELSE
    RAISE NOTICE 'Columna booking_type ya existe';
  END IF;
END $$;

-- 2. Agregar constraint CHECK si no existe
DO $$
BEGIN
  PERFORM 1 FROM information_schema.constraint_column_usage 
  WHERE table_name = 'bookings' AND column_name = 'booking_type';
  IF NOT FOUND THEN
    ALTER TABLE public.bookings 
      ADD CONSTRAINT bookings_booking_type_check 
      CHECK (booking_type IN ('immediate', 'reservation'));
    RAISE NOTICE 'Constraint booking_type agregado';
  ELSE
    RAISE NOTICE 'Constraint booking_type ya existe';
  END IF;
END $$;

-- 3. Backfill: Establecer booking_type según status actual
--    - PENDING/ACCEPTED sin status confirming → 'reservation' (viajes programados)
--    - NEW/SEARCHING → 'immediate' (viajes ASAP)
UPDATE public.bookings 
  SET booking_type = CASE
    WHEN status IN ('NEW', 'SEARCHING') THEN 'immediate'
    WHEN status IN ('PENDING', 'ACCEPTED') AND booking_type IS NULL THEN 'reservation'
    ELSE COALESCE(booking_type, 'immediate')
  END
WHERE booking_type IS NULL 
   OR booking_type NOT IN ('immediate', 'reservation');

-- 4. Índices para optimización
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type 
  ON public.bookings(booking_type);

CREATE INDEX IF NOT EXISTS idx_bookings_type_status 
  ON public.bookings(booking_type, status);

CREATE INDEX IF NOT EXISTS idx_bookings_type_driver_status 
  ON public.bookings(booking_type, driver, status);

-- 5. Verificar que se hayan actualizado correctamente
SELECT 
  booking_type, 
  COUNT(*) as count,
  COUNT(CASE WHEN driver IS NOT NULL THEN 1 END) as with_driver
FROM public.bookings
GROUP BY booking_type
ORDER BY booking_type;

-- =====================================================
-- COMENTARIOS
-- =====================================================
-- 
-- booking_type en bookings:
-- - 'immediate' = Servicio ASAP (driver busca en "Servicios Inmediatos")
-- - 'reservation' = Reserva programada (driver busca en "Reservas Disponibles")
--
-- Estados por tipo:
-- IMMEDIATE:
--   NEW → ACCEPTED → STARTED → COMPLETE → PAID
-- RESERVATION:
--   PENDING → ACCEPTED → STARTED → COMPLETE → PAID
-- 
-- =====================================================

