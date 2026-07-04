-- ============================================================
-- car_brands: tabla de marcas creadas desde la web (panel).
-- La app las SUMA a la lista local harcodeada (no la reemplaza).
-- Este script deja todo listo para probar la lectura con la anon key
-- ANTES de recompilar el APK.
-- ============================================================

-- 1) Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS public.car_brands (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  is_active  boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Evita marcas repetidas (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS car_brands_name_unique
  ON public.car_brands (lower(name));

-- 2) Activar RLS
ALTER TABLE public.car_brands ENABLE ROW LEVEL SECURITY;

-- 3) Política de LECTURA: la app (anon key) y usuarios autenticados
--    pueden leer solo las marcas activas.
DROP POLICY IF EXISTS "Anyone can read active car brands" ON public.car_brands;

CREATE POLICY "Anyone can read active car brands"
  ON public.car_brands
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- 4) Marca de prueba (para confirmar que aparece en el selector)
INSERT INTO public.car_brands (name, is_active)
VALUES ('MARCA PRUEBA WEB', true)
ON CONFLICT (lower(name)) DO NOTHING;

-- ============================================================
-- VERIFICACIÓN
-- ============================================================

-- (a) ¿RLS activo?  rowsecurity debe ser true
SELECT relname, relrowsecurity AS rls_activo
FROM pg_class
WHERE relname = 'car_brands';

-- (b) ¿Existe la política de SELECT?
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'car_brands';

-- (c) Exactamente lo que pedirá la app (debe devolver 'MARCA PRUEBA WEB')
SELECT name
FROM public.car_brands
WHERE is_active = true
ORDER BY name ASC;
