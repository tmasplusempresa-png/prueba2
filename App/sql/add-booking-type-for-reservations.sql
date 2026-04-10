-- =====================================================
-- MIGRACIÓN: Agregar soporte de RESERVAS a la tabla bookings
-- =====================================================
-- Este script agrega la columna booking_type y el estado PENDING
-- para poder usar la misma tabla bookings para reservas programadas.
-- =====================================================

-- 1. Agregar columna booking_type para distinguir viajes inmediatos de reservas
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS booking_type VARCHAR(20) DEFAULT 'immediate';

-- 2. Marcar todos los registros existentes como 'immediate'
UPDATE public.bookings SET booking_type = 'immediate' WHERE booking_type IS NULL;

-- 3. Actualizar CHECK constraint de status para incluir PENDING
-- Primero eliminar el constraint existente (puede tener diferentes nombres)
DO $$
BEGIN
  -- Intentar eliminar por nombre exacto
  ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;
  -- Intentar eliminar constraint genérico
  ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_check;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignorar si no existe
END $$;

-- Recrear con PENDING incluido
ALTER TABLE public.bookings 
  ADD CONSTRAINT bookings_status_check 
  CHECK (status IN ('NEW', 'PENDING', 'ACCEPTED', 'STARTED', 'ARRIVED', 'COMPLETE', 'PAID', 'CANCELLED'));

-- 4. Índices para optimización de consultas de reservas
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON public.bookings(booking_type);
CREATE INDEX IF NOT EXISTS idx_bookings_type_status ON public.bookings(booking_type, status);
CREATE INDEX IF NOT EXISTS idx_bookings_type_customer ON public.bookings(booking_type, customer);
CREATE INDEX IF NOT EXISTS idx_bookings_type_driver ON public.bookings(booking_type, driver);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON public.bookings(booking_date);

-- 5. RLS policies para reservas (si aún no existen)

-- Los conductores pueden VER reservas PENDING (para aceptarlas)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' AND policyname = 'drivers_view_pending_reservations'
  ) THEN
    CREATE POLICY drivers_view_pending_reservations ON public.bookings
      FOR SELECT
      USING (booking_type = 'reservation' AND status = 'PENDING');
  END IF;
END $$;

-- Los conductores pueden ACEPTAR reservas PENDING (UPDATE donde driver es NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' AND policyname = 'drivers_accept_pending_reservations'
  ) THEN
    CREATE POLICY drivers_accept_pending_reservations ON public.bookings
      FOR UPDATE
      USING (
        booking_type = 'reservation' 
        AND status = 'PENDING' 
        AND driver IS NULL
      )
      WITH CHECK (
        booking_type = 'reservation'
        AND status = 'ACCEPTED'
        AND driver::text = (auth.uid())::text
      );
  END IF;
END $$;

-- Los clientes pueden VER sus propias reservas (usando columna customer)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'bookings' AND policyname = 'customers_view_own_reservations'
  ) THEN
    CREATE POLICY customers_view_own_reservations ON public.bookings
      FOR SELECT
      USING (
        booking_type = 'reservation' 
        AND customer::text = (auth.uid())::text
      );
  END IF;
END $$;

-- =====================================================
-- INSTRUCCIONES: Ejecutar este SQL en el Supabase SQL Editor
-- DESPUÉS de ejecutar, verificar con:
--   SELECT column_name, data_type, column_default 
--   FROM information_schema.columns 
--   WHERE table_name = 'bookings' AND column_name = 'booking_type';
-- =====================================================
