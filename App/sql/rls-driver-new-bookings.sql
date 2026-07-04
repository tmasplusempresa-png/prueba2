-- Permite que conductores activos vean reservas en estado NEW (para recibir nuevas solicitudes)
-- y reservas donde ellos son el conductor asignado.
-- Esto es necesario para que Supabase Realtime funcione con RLS activo.

DROP POLICY IF EXISTS "Drivers can view new bookings" ON public.bookings;

CREATE POLICY "Drivers can view new bookings"
  ON public.bookings
  FOR SELECT
  USING (
    -- Conductor asignado siempre puede ver sus reservas
    auth.uid()::text = driver::text
    OR
    -- Conductores activos pueden ver reservas NEW (para aceptar)
    (
      status = 'NEW'
      AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
          AND user_type = 'driver'
          AND is_active = true
      )
    )
    OR
    -- Clientes ven sus propias reservas
    auth.uid()::text = customer::text
    OR
    -- Admin ve todo
    (SELECT user_type FROM public.users WHERE id = auth.uid()) = 'admin'
  );
