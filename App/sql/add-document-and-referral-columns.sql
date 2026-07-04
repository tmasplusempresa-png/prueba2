-- =====================================================
-- AGREGAR COLUMNAS: tipo/numero de documento y codigo de referido
-- Aplica para clientes y conductores (tabla public.users)
-- =====================================================

-- 1) Nuevas columnas (idempotente)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS document_type    VARCHAR(10);

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS document_number  VARCHAR(30);

-- Codigo de referido INGRESADO por el usuario al registrarse
-- (NO confundir con referral_id, que es el codigo propio del usuario)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(50);

-- 2) Validaciones
-- Tipos de documento aceptados en Colombia
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS valid_document_type;
ALTER TABLE public.users
  ADD CONSTRAINT valid_document_type
  CHECK (document_type IS NULL OR document_type IN ('CC','CE','TI','PA','NIT','RC'));

-- 3) Indices
-- Unico por (tipo + numero) cuando ambos existan
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_document_unique
  ON public.users (document_type, document_number)
  WHERE document_type IS NOT NULL AND document_number IS NOT NULL;

-- Para buscar quien uso un codigo de referido
CREATE INDEX IF NOT EXISTS idx_users_referred_by_code
  ON public.users (referred_by_code);

-- 4) Actualizar trigger handle_new_user para que guarde estos campos
--    desde raw_user_meta_data durante el signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    auth_id,
    email,
    first_name,
    last_name,
    mobile,
    user_type,
    document_type,
    document_number,
    referred_by_code,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'customer'),
    NEW.raw_user_meta_data->>'document_type',
    NEW.raw_user_meta_data->>'document_number',
    NULLIF(NEW.raw_user_meta_data->>'referred_by_code', ''),
    true
  )
  ON CONFLICT (auth_id) DO UPDATE SET
    email            = NEW.email,
    first_name       = COALESCE(NEW.raw_user_meta_data->>'first_name',       users.first_name),
    last_name        = COALESCE(NEW.raw_user_meta_data->>'last_name',        users.last_name),
    mobile           = COALESCE(NEW.raw_user_meta_data->>'phone',            users.mobile),
    user_type        = COALESCE(NEW.raw_user_meta_data->>'user_type',        users.user_type),
    document_type    = COALESCE(NEW.raw_user_meta_data->>'document_type',    users.document_type),
    document_number  = COALESCE(NEW.raw_user_meta_data->>'document_number',  users.document_number),
    referred_by_code = COALESCE(NULLIF(NEW.raw_user_meta_data->>'referred_by_code',''), users.referred_by_code);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- 5) Verificacion
DO $$
BEGIN
  RAISE NOTICE 'Columnas document_type, document_number y referred_by_code agregadas a public.users';
END $$;

SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema='public' AND table_name='users'
  AND column_name IN ('document_type','document_number','referred_by_code');
