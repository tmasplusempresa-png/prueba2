-- ============================================================
-- CREATE CALL NOTIFICATIONS TABLE (SAFE - IDEMPOTENT)
-- ============================================================
-- Este SQL es seguro ejecutar múltiples veces
-- Si la tabla/policy ya existen, las ignora

-- 1. Crear tabla (si no existe)
CREATE TABLE IF NOT EXISTS public.call_notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_name TEXT NOT NULL,
  channel_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, declined, missed
  created_at TIMESTAMP DEFAULT now(), 
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS call_notifications_customer_id_idx ON public.call_notifications(customer_id);
CREATE INDEX IF NOT EXISTS call_notifications_driver_id_idx ON public.call_notifications(driver_id);
CREATE INDEX IF NOT EXISTS call_notifications_channel_name_idx ON public.call_notifications(channel_name);

-- 3. Habilitar RLS
ALTER TABLE public.call_notifications ENABLE ROW LEVEL SECURITY;

-- 4. Crear policy (segura - si ya existe se ignora)
DO $$ BEGIN
  CREATE POLICY "Users can view their own call notifications"
    ON public.call_notifications
    FOR SELECT
    USING (auth.uid() = customer_id OR auth.uid() = driver_id);
EXCEPTION WHEN duplicate_object THEN
  NULL; -- La policy ya existe, ignorar
END $$;

-- 5. Habilitar Realtime para la tabla (idempotente)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.call_notifications;
EXCEPTION WHEN others THEN
  NULL; -- La tabla ya está en Realtime, ignorar
END $$;

-- 6. Crear función para actualizar timestamp (fuera del DO block)
CREATE OR REPLACE FUNCTION update_call_notifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Crear trigger (seguro - elimina anterior si existe)
DROP TRIGGER IF EXISTS call_notifications_updated_at_trigger ON public.call_notifications;

CREATE TRIGGER call_notifications_updated_at_trigger
BEFORE UPDATE ON public.call_notifications
FOR EACH ROW
EXECUTE FUNCTION update_call_notifications_timestamp();

-- ✅ Setup completado
SELECT '✅ call_notifications tabla configurada correctamente' AS result;
