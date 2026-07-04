-- =====================================================
-- DATOS DE PRUEBA — copia registros reales con nuevo UUID
-- Técnica: SQL dinámico que excluye 'id' automáticamente
--          y genera gen_random_uuid() para cada fila nueva.
-- =====================================================

DELETE FROM public.bookings WHERE reference LIKE 'TST-%';

DO $$
DECLARE
  cols      TEXT;   -- todas las columnas excepto id
  new_id    UUID;
BEGIN
  -- Obtener lista de columnas excepto 'id'
  SELECT string_agg(column_name, ', ' ORDER BY ordinal_position)
  INTO   cols
  FROM   information_schema.columns
  WHERE  table_schema = 'public'
    AND  table_name   = 'bookings'
    AND  column_name  <> 'id';

  -- ── PENDIENTES (copias de CDRK1S) ──────────────────────────────────────

  -- TST-P001 · HOY
  new_id := gen_random_uuid();
  EXECUTE format(
    'INSERT INTO public.bookings (id, %s) SELECT $1, %s FROM public.bookings WHERE reference = ''CDRK1S'' LIMIT 1',
    cols, cols
  ) USING new_id;
  UPDATE public.bookings SET reference='TST-P001', booking_date=NOW(),              status='PENDING', created_at=NOW(), updated_at=NOW() WHERE id=new_id;

  -- TST-P002 · hace 3 días
  new_id := gen_random_uuid();
  EXECUTE format(
    'INSERT INTO public.bookings (id, %s) SELECT $1, %s FROM public.bookings WHERE reference = ''CDRK1S'' LIMIT 1',
    cols, cols
  ) USING new_id;
  UPDATE public.bookings SET reference='TST-P002', booking_date=NOW()-INTERVAL '3 days',  status='PENDING', created_at=NOW(), updated_at=NOW() WHERE id=new_id;

  -- ── CANCELADAS (copias de TP089N) ───────────────────────────────────────

  -- TST-X001 · hace 6 días
  new_id := gen_random_uuid();
  EXECUTE format(
    'INSERT INTO public.bookings (id, %s) SELECT $1, %s FROM public.bookings WHERE reference = ''TP089N'' LIMIT 1',
    cols, cols
  ) USING new_id;
  UPDATE public.bookings SET reference='TST-X001', booking_date=NOW()-INTERVAL '6 days',  status='CANCELLED', created_at=NOW(), updated_at=NOW() WHERE id=new_id;

  -- TST-X002 · hace 20 días
  new_id := gen_random_uuid();
  EXECUTE format(
    'INSERT INTO public.bookings (id, %s) SELECT $1, %s FROM public.bookings WHERE reference = ''TP089N'' LIMIT 1',
    cols, cols
  ) USING new_id;
  UPDATE public.bookings SET reference='TST-X002', booking_date=NOW()-INTERVAL '20 days', status='CANCELLED', created_at=NOW(), updated_at=NOW() WHERE id=new_id;

  -- TST-X003 · hace 90 días
  new_id := gen_random_uuid();
  EXECUTE format(
    'INSERT INTO public.bookings (id, %s) SELECT $1, %s FROM public.bookings WHERE reference = ''TP089N'' LIMIT 1',
    cols, cols
  ) USING new_id;
  UPDATE public.bookings SET reference='TST-X003', booking_date=NOW()-INTERVAL '90 days', status='CANCELLED', created_at=NOW(), updated_at=NOW() WHERE id=new_id;

  RAISE NOTICE '✓ 5 registros de prueba insertados correctamente.';
END $$;

-- Verificar
SELECT reference, status, booking_date::date AS fecha, customer_id
FROM   public.bookings
WHERE  reference LIKE 'TST-%'
ORDER  BY booking_date DESC;
