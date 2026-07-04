-- =====================================================
-- SISTEMA DE REFERIDOS — PROYECTO DE LA APP (secundario: utofhxgzkdhljrixperh)
-- Replica en la base de la App las tablas que en el dashboard viven en el
-- proyecto primario (vlavutmqyrzloivukbqg): referral_codes / referrals.
--
-- Alcance actual de la App: MOSTRAR / COMPARTIR el código propio (AAA-XXXXX).
-- Por eso lo esencial aquí es que cada usuario tenga su fila en referral_codes,
-- generada por el trigger handle_new_user (igual que en el primario).
--
-- ⚠️ NO confundir las dos cosas:
--   - users.referred_by_code  = código de QUIEN INVITÓ al usuario (lo escribe al
--                                registrarse). NO es su código.
--   - referral_codes.referral_code = el código PROPIO del usuario (AAA-XXXXX),
--                                lo que debe mostrar/compartir en su perfil.
-- Idempotente: se puede correr varias veces.
-- =====================================================

-- 0) Extensión para gen_random_uuid() (Postgres 13+ ya la trae integrada,
--    pero la dejamos por seguridad).
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =====================================================
-- 1) TABLAS
-- =====================================================

-- El código propio de cada usuario (exactamente uno por usuario).
CREATE TABLE IF NOT EXISTS public.referral_codes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code   text NOT NULL UNIQUE,
  is_active       boolean NOT NULL DEFAULT true,
  total_referrals integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Un solo código por usuario (necesario para el embed de PostgREST y para
-- ON CONFLICT (driver_id) en ensure_referral_code).
CREATE UNIQUE INDEX IF NOT EXISTS idx_referral_codes_driver
  ON public.referral_codes (driver_id);

-- Relación referidor ↔ referido (una fila por usuario que entra con el código
-- de otro). No la usa todavía la App, pero se crea para mantener el esquema
-- alineado con el primario.
CREATE TABLE IF NOT EXISTS public.referrals (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code_id   uuid NOT NULL REFERENCES public.referral_codes(id) ON DELETE CASCADE,
  referrer_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referred_driver_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  referral_code      text NOT NULL,
  status             text NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','approved','completed','cancelled')),
  reward_claimed     boolean NOT NULL DEFAULT false,
  referred_at        timestamptz NOT NULL DEFAULT now()
);

-- §6.2 de la spec: forzar que un usuario solo pueda ser referido UNA vez.
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referred_unique
  ON public.referrals (referred_driver_id);

-- =====================================================
-- 2) GENERADOR DEL CÓDIGO  AAA-XXXXX
--    AAA   = primeras 3 letras del nombre (solo A-Z), en mayúscula, rellenando
--            con 'X' si el nombre tiene menos de 3 letras.
--    XXXXX = 5 caracteres hex en mayúscula (0-9 A-F) de un uuid aleatorio.
--    Reintenta si choca con uno existente.
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_referral_code(p_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_prefix text;
  v_suffix text;
  v_code   text;
BEGIN
  v_prefix := upper(regexp_replace(coalesce(p_name, ''), '[^A-Za-z]', '', 'g'));
  v_prefix := substr(v_prefix || 'XXX', 1, 3);

  LOOP
    v_suffix := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 5));
    v_code   := v_prefix || '-' || v_suffix;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.referral_codes WHERE referral_code = v_code
    );
  END LOOP;

  RETURN v_code;
END;
$$;

-- Crea la fila en referral_codes para un usuario si aún no la tiene.
CREATE OR REPLACE FUNCTION public.ensure_referral_code(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
BEGIN
  IF EXISTS (SELECT 1 FROM public.referral_codes WHERE driver_id = p_user_id) THEN
    RETURN;
  END IF;

  SELECT first_name INTO v_name FROM public.users WHERE id = p_user_id;

  INSERT INTO public.referral_codes (driver_id, referral_code)
  VALUES (p_user_id, public.generate_referral_code(v_name))
  ON CONFLICT (driver_id) DO NOTHING;
END;
$$;

-- =====================================================
-- 3) TRIGGER handle_new_user — además de poblar public.users, genera el código
--    propio. Mantiene todo lo que ya hacía (document_*, referred_by_code, etc.)
--    y añade la generación de referral_codes.
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id uuid;
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
    referred_by_code = COALESCE(NULLIF(NEW.raw_user_meta_data->>'referred_by_code',''), users.referred_by_code)
  RETURNING id INTO v_user_id;

  -- Generar el código propio (AAA-XXXXX) si todavía no existe.
  PERFORM public.ensure_referral_code(v_user_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 4) BACKFILL — genera el código para los usuarios que ya existen (incluidos
--    los conductores importados desde el primario) y aún no tienen uno.
-- =====================================================
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT u.id
    FROM public.users u
    LEFT JOIN public.referral_codes rc ON rc.driver_id = u.id
    WHERE rc.id IS NULL
  LOOP
    PERFORM public.ensure_referral_code(r.id);
  END LOOP;
END $$;

-- =====================================================
-- 5) RLS — cada usuario autenticado puede leer SOLO su propio código.
--    (La App lo lee por REST usando el JWT del usuario; ver referralsService.ts)
-- =====================================================
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS referral_codes_select_own ON public.referral_codes;
CREATE POLICY referral_codes_select_own
  ON public.referral_codes
  FOR SELECT
  TO authenticated
  USING (
    driver_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- =====================================================
-- 6) VERIFICACIÓN
-- =====================================================
SELECT
  (SELECT count(*) FROM public.users)            AS total_users,
  (SELECT count(*) FROM public.referral_codes)   AS total_referral_codes;

-- Ejemplos del formato generado:
SELECT referral_code, total_referrals
FROM public.referral_codes
ORDER BY created_at DESC
LIMIT 10;
