-- =====================================================
-- AGREGAR COLUMNAS DE IMÁGENES DE DOCUMENTOS
-- Tabla: public.users
-- =====================================================

-- Cédula frente (campo principal)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verify_id_image      TEXT;
-- Cédula frente (campo extendido sin límite de tamaño, usado por ImageGalleryComponent)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verify_id_image_data TEXT;
-- Cédula posterior
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS verify_id_image_bk   TEXT;
-- SOAT
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS soat_image           TEXT;
-- Tarjeta de propiedad frente
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS card_prop_image      TEXT;
-- Tarjeta de propiedad posterior
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS card_prop_image_bk   TEXT;
-- Licencia de conducción frente
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS license_image        TEXT;
-- Licencia de conducción posterior
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS license_image_back   TEXT;

-- Verificación
DO $$
BEGIN
  RAISE NOTICE 'Columnas de imágenes de documentos agregadas a public.users';
END $$;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN (
    'verify_id_image',
    'verify_id_image_data',
    'verify_id_image_bk',
    'soat_image',
    'card_prop_image',
    'card_prop_image_bk',
    'license_image',
    'license_image_back'
  )
ORDER BY column_name;
