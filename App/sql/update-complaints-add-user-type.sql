-- =====================================================
-- AGREGAR COLUMNA user_type A TABLA complaints EXISTENTE
-- Ejecutar en SQL Editor de Supabase DESPUÉS de crear la tabla
-- =====================================================

-- 1. AGREGAR COLUMNA user_type
ALTER TABLE public.complaints
ADD COLUMN IF NOT EXISTS user_type VARCHAR(20) DEFAULT 'customer'
CHECK (user_type IN ('customer', 'driver', 'admin'));

-- 2. AGREGAR ÍNDICE PARA user_type
CREATE INDEX IF NOT EXISTS idx_complaints_user_type
  ON public.complaints(user_type);

-- 3. ACTUALIZAR REGISTROS EXISTENTES CON user_type CORRECTO
UPDATE public.complaints
SET user_type = COALESCE((
  SELECT u.user_type
  FROM public.users u
  WHERE u.id = complaints.user_id
), 'customer')
WHERE user_type IS NULL OR user_type = 'customer';

-- 4. TRIGGER PARA ACTUALIZAR user_type AUTOMÁTICAMENTE
CREATE OR REPLACE FUNCTION public.update_complaints_user_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Obtener el user_type del usuario que crea la queja
  SELECT user_type INTO NEW.user_type
  FROM public.users
  WHERE id = NEW.user_id;

  -- Si no se encuentra, usar 'customer' por defecto
  IF NEW.user_type IS NULL THEN
    NEW.user_type = 'customer';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear el trigger si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_complaints_user_type'
    AND tgrelid = 'public.complaints'::regclass
  ) THEN
    CREATE TRIGGER trg_complaints_user_type
      BEFORE INSERT ON public.complaints
      FOR EACH ROW
      EXECUTE FUNCTION public.update_complaints_user_type();
  END IF;
END $$;

-- 5. VERIFICAR QUE TODO FUNCIONE
-- SELECT id, user_id, user_type, complaint_type, subject, created_at
-- FROM public.complaints
-- LIMIT 5;