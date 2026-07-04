-- =====================================================
-- Habilitar Supabase Realtime + corregir RLS en booking_tracking
-- =====================================================
-- 1) Asegura que la tabla esté incluida en la publicación realtime,
--    para que los INSERT lleguen a clientes suscritos por postgres_changes.
-- 2) Reemplaza las RLS policies que comparaban auth.uid() == driver_id
--    directamente. driver_id es FK a public.users.id (UUID propio),
--    distinto de auth.uid() que es auth.users.id == public.users.auth_id.
--    Las nuevas policies hacen el join correcto.
-- Idempotente: se puede correr múltiples veces.


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'booking_tracking'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.booking_tracking';
  END IF;
END $$;

ALTER TABLE public.booking_tracking REPLICA IDENTITY FULL;

-- Corregir RLS policies (drop si existen, recrear con el join correcto)
DROP POLICY IF EXISTS "Users can view tracking for their bookings" ON public.booking_tracking;
DROP POLICY IF EXISTS "Drivers can insert tracking" ON public.booking_tracking;

-- SELECT: cliente o conductor de la reserva pueden leer sus puntos.
CREATE POLICY "Users can view tracking for their bookings"
  ON public.booking_tracking
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.bookings b
      JOIN public.users u
        ON u.id = b.customer OR u.id = b.driver
      WHERE b.id = booking_id
        AND u.auth_id = auth.uid()
    )
  );

-- INSERT: solo el conductor cuyo users.auth_id coincide con auth.uid()
-- puede insertar puntos donde driver_id apunta a su propio users.id.
CREATE POLICY "Drivers can insert tracking"
  ON public.booking_tracking
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = driver_id
        AND u.auth_id = auth.uid()
    )
  );