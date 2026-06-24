-- =====================================================
-- RPC FUNCTION: check_email_exists
-- =====================================================
-- Esta función bypasea RLS y es mucho más rápida
-- para validar si un email existe durante el registro

CREATE OR REPLACE FUNCTION check_email_exists(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  email_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM users WHERE email = LOWER(TRIM(check_email)) LIMIT 1
  ) INTO email_exists;

  RETURN email_exists;
END;
$$;

-- =====================================================
-- OTORGAR PERMISOS PÚBLICOS A LA FUNCIÓN
-- =====================================================

GRANT EXECUTE ON FUNCTION check_email_exists(TEXT) TO anon, authenticated, service_role;

-- =====================================================
-- LOGS
-- =====================================================

DO $$
BEGIN
  RAISE LOG 'RPC function check_email_exists creada correctamente';
END $$;
