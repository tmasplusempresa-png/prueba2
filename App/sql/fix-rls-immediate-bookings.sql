-- =====================================================
-- FIX RLS: Permitir conductores ver servicios inmediatos disponibles
-- =====================================================

-- Crear política para que conductores vean servicios inmediatos sin asignar
CREATE POLICY "Drivers can view available immediate bookings"
  ON public.bookings
  FOR SELECT
  USING (
    -- Conductores pueden ver servicios inmediatos sin driver asignado
    (
      booking_type = 'immediate' 
      AND driver IS NULL 
      AND status = 'NEW'
      AND (SELECT user_type FROM public.users WHERE id = auth.uid()) = 'driver'
    )
    OR
    -- O las políticas anteriores (sus propios bookings)
    auth.uid()::text = customer::text
    OR auth.uid()::text = driver::text
    OR (SELECT user_type FROM public.users WHERE id = auth.uid()) = 'admin'
  );
