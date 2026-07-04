-- ============================================================================
-- Chat del servicio: mensajes entre conductor y cliente de una reserva
-- ============================================================================
-- Cada fila es un mensaje asociado a una reserva (bookings.id). Solo el
-- conductor (bookings.driver) y el cliente (bookings.customer) de esa reserva
-- pueden leer y escribir mensajes, validado por RLS contra el JWT del usuario.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id  UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id   UUID,                       -- users.id del autor (informativo)
  sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('driver', 'customer')),
  sender_name VARCHAR(255),
  message     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para listar/ordenar los mensajes de una reserva eficientemente
CREATE INDEX IF NOT EXISTS idx_chat_messages_booking
  ON public.chat_messages (booking_id, created_at);

-- ============================================================================
-- Row Level Security
-- ============================================================================
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Helper: ¿el usuario autenticado participa en la reserva del mensaje?
-- Se contemplan las dos convenciones presentes en el proyecto:
--   1) users.id == auth.uid()  (id directo)
--   2) users.auth_id == auth.uid()  (mapeo por auth_id)
-- para que la política funcione con cualquiera de los dos esquemas.
DROP POLICY IF EXISTS "Participantes pueden ver mensajes" ON public.chat_messages;
CREATE POLICY "Participantes pueden ver mensajes"
  ON public.chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = chat_messages.booking_id
        AND (
          auth.uid()::text = b.customer::text
          OR auth.uid()::text = b.driver::text
          OR auth.uid() IN (
            SELECT u.auth_id FROM public.users u
            WHERE u.id = b.customer OR u.id = b.driver
          )
        )
    )
  );

DROP POLICY IF EXISTS "Participantes pueden enviar mensajes" ON public.chat_messages;
CREATE POLICY "Participantes pueden enviar mensajes"
  ON public.chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = chat_messages.booking_id
        AND (
          auth.uid()::text = b.customer::text
          OR auth.uid()::text = b.driver::text
          OR auth.uid() IN (
            SELECT u.auth_id FROM public.users u
            WHERE u.id = b.customer OR u.id = b.driver
          )
        )
    )
  );

-- ============================================================================
-- Realtime (opcional): permite suscripciones en vivo además del polling REST.
-- Si la publicación ya incluye la tabla, este bloque se ignora sin error.
-- ============================================================================
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
  END;
END $$;
