-- =====================================================
-- AGREGAR COLUMNA CITY A LA TABLA public.users
-- =====================================================

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS city VARCHAR(100);

-- Verificación
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'users'
  AND column_name  = 'city';
