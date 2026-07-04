-- Agrega la columna de vencimiento a solicitudes de booking
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS request_expires_at timestamptz;

-- Para bookings NEW/PENDING existentes sin expiry, calcular retroactivamente
UPDATE bookings
  SET request_expires_at = created_at + INTERVAL '5 minutes'
  WHERE request_expires_at IS NULL
    AND status IN ('NEW', 'PENDING');

-- Función que cancela automáticamente bookings vencidos (ejecución periódica via pg_cron o Edge Function)
CREATE OR REPLACE FUNCTION cancel_expired_booking_requests()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE bookings
    SET
      status           = 'CANCELLED',
      observations     = 'Solicitud vencida automáticamente por tiempo de espera',
      cancelled_by     = 'system',
      cancellation_time = NOW()::text
    WHERE status IN ('NEW', 'PENDING')
      AND request_expires_at IS NOT NULL
      AND request_expires_at < NOW();
END;
$$;
