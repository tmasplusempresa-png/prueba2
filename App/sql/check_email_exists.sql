-- Función para verificar si un email existe en auth.users
-- Esta función es necesaria porque no se puede consultar auth.users directamente desde el cliente

CREATE OR REPLACE FUNCTION check_email_exists(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM auth.users 
    WHERE email = check_email
  );
END;
$$;

-- Dar permisos de ejecución a usuarios anónimos y autenticados
GRANT EXECUTE ON FUNCTION check_email_exists TO anon;
GRANT EXECUTE ON FUNCTION check_email_exists TO authenticated;
