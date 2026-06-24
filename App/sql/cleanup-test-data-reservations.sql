-- =====================================================
-- LIMPIEZA DE DATOS DE PRUEBA - MÓDULO "TUS RESERVAS"
-- =====================================================

DELETE FROM public.bookings
WHERE reference IN (
  'TST-P001', 'TST-P002',
  'TST-A001', 'TST-A002',
  'TST-C001', 'TST-C002', 'TST-C003',
  'TST-X001', 'TST-X002', 'TST-X003'
);

DO $$
DECLARE
  remaining INT;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM public.bookings
  WHERE reference LIKE 'TST-%';

  IF remaining = 0 THEN
    RAISE NOTICE '✓ Todos los registros TST-* eliminados.';
  ELSE
    RAISE WARNING '⚠ Quedan % registros TST-* sin eliminar.', remaining;
  END IF;
END $$;
